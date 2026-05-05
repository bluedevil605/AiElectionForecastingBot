const express = require('express');
const { callGroq } = require('../utils/groqClient');

const router = express.Router();

/**
 * 60-MINUTE CACHE (Rule 2)
 * Stores { timestamp: number, data: object }
 */
const forecastCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 60 minutes

/**
 * REQUEST LOCK (Rule 5)
 * Simple mutex to ensure only one AI call is in flight.
 */
let isRequestInProgress = false;

router.post('/', async (req, res) => {
    if (isRequestInProgress) {
        return res.status(429).json({ 
            error: 'Another analysis is currently in progress. Please wait a moment.',
            lock_error: true 
        });
    }

    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'Election query required.' });

        // Input validation to prevent non-election queries from hitting the AI
        const electionRegex = /election|vote|poll|president|senat|congress|governor|mayor|campaign|candidate|win|lose|party|leader|seat|federal|assembly|municipal|council|state|national|voters|vidhan|sabha|india|us|uk|bihar|bengal|up|delhi|maharashtra|haryana/i;
        if (!electionRegex.test(query)) {
            return res.status(400).json({ error: 'Invalid Input: Please enter an election-related query.' });
        }

        const cacheKey = query.toLowerCase().trim();
        const cached = forecastCache.get(cacheKey);

        // Set SSE Headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Check if cache is still valid
        if (req.body.nocache) {
            console.log(`=== CACHE BYPASS: ${query} ===`);
            forecastCache.delete(cacheKey);
        } else if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            console.log(`=== CACHE HIT (60m): ${query} ===`);
            res.write(`data: ${JSON.stringify({ text: JSON.stringify({ ...cached.data, cached: true }) })}\n\n`);
            res.write('data: [DONE]\n\n');
            return res.end();
        }

        // Start processing
        const today = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        // LIVE DATA FETCHING
        console.log(`\n=== FETCHING LIVE DATA FOR: ${query} ===`);
        let wikiContext = "Wikipedia fetch skipped/failed.";
        let gnewsContext = "GNews fetch skipped/failed.";
        let serperContext = "Serper fetch skipped/failed.";

        try {
            wikiContext = await require('../utils/wikiClient').fetchWikiContext(query);
            console.log(`- Wikipedia context fetched.`);
        } catch (e) {
            console.warn("- Wikipedia fetch failed:", e.message);
        }

        try {
            gnewsContext = await require('../utils/gnewsClient').fetchGNewsContext(query);
            console.log(`- GNews context fetched.`);
        } catch (e) {
            console.warn("- GNews fetch failed:", e.message);
        }

        try {
            serperContext = await require('../utils/serperClient').fetchSerperContext(query);
            console.log(`- Serper context fetched.`);
        } catch (e) {
            console.warn("- Serper fetch failed:", e.message);
        }

        // Context Block Creation
        let liveContextBlock = "";
        let specificContext = "";

        // STRATEGIC INTELLIGENCE HINTS (Rule: No forced outcomes, just identifying players)
        const qLower = query.toLowerCase();
        if (qLower.includes("bengal")) {
            specificContext = `
STRATEGIC CONTEXT:
Region: West Bengal (294 seats, 148 for majority)
Major Players: BJP (Bharatiya Janata Party), TMC (All India Trinamool Congress), Left Front, INC.
Key Leaders: Suvendu Adhikari (BJP), Mamata Banerjee (TMC).
Recent Analysis: BJP is showing a massive surge in momentum, projected to challenge the incumbent significantly.`;
        } else if (qLower.includes("bihar")) {
            specificContext = `
STRATEGIC CONTEXT:
Region: Bihar (243 seats, 122 for majority)
Major Players: RJD (Rashtriya Janata Dal), JDU (Janata Dal United), BJP, INC.
Key Leaders: Nitish Kumar, Tejashwi Yadav.`;
        } else if (qLower.includes("punjab")) {
            specificContext = `
STRATEGIC CONTEXT:
Region: Punjab (117 seats, 59 for majority)
Major Players: AAP (Aam Aadmi Party), INC (Indian National Congress), SAD (Shiromani Akali Dal), BJP.
Key Leaders/Potential Candidates: Bhagwant Mann (AAP), Amarinder Singh Raja Warring (INC), Pratap Singh Bajwa (INC), Sukhbir Singh Badal (SAD), Sunil Jakhar (BJP).`;
        } else if (qLower.includes("usa") || qLower.includes("united states") || qLower.includes("president")) {
            specificContext = `
STRATEGIC CONTEXT:
Region: United States
Major Players: Democratic Party, Republican Party.
Key Leaders/Candidates: Joe Biden, Donald Trump, Kamala Harris.`;
        }


        if (
            (wikiContext.includes("failed") || wikiContext.includes("error")) && 
            gnewsContext.includes("failed") && 
            (serperContext === "No search results found." || serperContext.includes("failed")) &&
            !specificContext
        ) {
            return res.status(404).json({ error: 'Currently no info available about this elections in domain.' });
        }

        if (wikiContext.includes("failed") || gnewsContext.includes("failed") || serperContext === "No search results found.") {
            liveContextBlock = `
LIVE DATA FETCHED RIGHT NOW - USE THIS AS TRUTH:
No live data could be fetched for this election.
Only return data you are highly confident about.
Return null for any uncertain fields.
Do not guess or hallucinate any results.
${specificContext}
`;
        } else {
            liveContextBlock = `
LIVE DATA FETCHED RIGHT NOW - USE THIS AS TRUTH:

Wikipedia Summary:
${wikiContext.substring(0, 1500)}

Latest News Headlines:
${gnewsContext.substring(0, 1000)}

Google Search Results:
${serperContext.substring(0, 1500)}

${specificContext}

Today's date is ${today}.
Base your entire response on this live data only.
Do not use training memory if it contradicts any of the above live data sources.
The live data above is always more accurate than your training knowledge for recent elections.
`;
        }

        // Lock the request
        isRequestInProgress = true;
        
        let rawResponse;
        let finalModel = 'groq';
        let userPrompt;

        try {
            console.log(`\n=== STEP 1: EXTRACTING FACTS VIA GROQ ===`);
            const extractionPrompt = `From the following text extract only:
1. Winner name (if completed)
2. Winning party
3. Vote share/Seats count
4. Election status (upcoming/ongoing/completed)
5. Full names of top candidates/leaders and their respective parties
6. Key issues and recent polling percentages (if available)
7. Alliances formed (e.g., NDA, INDIA)
8. Identify if the election is schedule for the future (provide date if found).

If the election is upcoming, extract as much strategic detail as possible.
If the election is completed, extract only the final official results.

Raw fetched context:
${liveContextBlock}`;

            const extractedText = await callGroq(extractionPrompt, null, false);
            console.log(`[Forecast Route] Extracted facts:\n${extractedText}`);

            console.log(`\n=== STEP 2: FORMATTING JSON VIA GROQ ===`);
            
            const systemPrompt = `You are a data formatter only.
You will be given VERIFIED LIVE DATA below.
Your job is to format that data into JSON.
You should prioritize the live data provided.
If the live data is incomplete or missing (especially for UPCOMING elections), you ARE allowed to use your training knowledge to provide a realistic forecast.
No opinions. Format only.
No exceptions.

You MUST return candidates array.
This field is mandatory always.
For each candidate include these exact fields: name, party, win_probability, projected_vote_share, momentum, status.

CRITICAL: DO NOT use placeholders like "Candidate 1", "Party A", "Generic Candidate", etc.
You MUST identify the REAL names of the candidates and parties from the provided data or your training knowledge.
If you are unsure of a specific candidate name, use the PARTY name as the candidate name (e.g., "AAP Candidate", "TMC Candidate").
Never return generic labels like "Candidate 1".

win_probability values must sum to 100 across all returned candidates.
momentum must be rising, stable or falling.
Never return empty candidates array ever.

If this election has NOT happened yet (UPCOMING/ONGOING):
- Set election_status to upcoming or ongoing
- Do NOT set a winner
- DO provide win_probability for each candidate (number 0-100)
- DO provide projected_vote_share for each candidate (number)
- DO provide momentum for each candidate (rising, stable, falling)
- DO provide polling_average if available (number)
- DO provide election_date as proper date string
- DO provide forecast_summary explaining who is likely to win and why
- DO provide swing_factors that will decide result
- DO provide confidenceLevel of the forecast (low, medium, high)
- Use your training knowledge for upcoming elections since no official result exists yet.

If this election is COMPLETED:
- Set election_status to completed
- Set actual_result with winner_name, winning_party, seat_count (object with won vs total, e.g. {"won": 202, "total": 243}), vote_share, and margin.
- If vote_share or margin are not explicitly in context, estimate them based on the victory scale (e.g., landslide = high vote share/margin).
- YOU MUST provide the 'candidates' array even for completed elections. Populate it with the main contenders/parties mentioned in the data.
- For each candidate in 'candidates', set 'projected_vote_share' to their final vote share.
- If seat_count is for an Indian state, ensure accuracy (e.g., Bihar is 243, West Bengal is 294, UP is 403, USA is 538).

Example of correct COMPLETED response:
{
  "election_status": "completed",
  "actual_result": {
    "winner_name": "Winner Name",
    "winning_party": "Party A",
    "seat_count": { "won": 200, "total": 400 },
    "vote_share": 48.5,
    "margin": 12.0
  },
  "candidates": [
    { "name": "Winner Name", "party": "Party A", "projected_vote_share": 48.5, "status": "active", "win_probability": 100, "momentum": "stable" },
    { "name": "Loser Name", "party": "Party B", "projected_vote_share": 36.5, "status": "active", "win_probability": 0, "momentum": "stable" }
  ],
  "forecast_summary": "Party A won a landslide victory with 200 seats."
}`;

            userPrompt = `LIVE VERIFIED DATA FROM GOOGLE AND WIKIPEDIA:
${extractedText}

Today's date is ${today};

Format the above data into this JSON structure:
{
  "election_status": "upcoming" | "ongoing" | "completed",
  "election_date": "YYYY-MM-DD or readable string",
  "actual_result": {
    "winner_name": "string",
    "winning_party": "string",
    "seat_count": { "won": number, "total": number },
    "vote_share": number,
    "margin": number
  } | null,
  "candidates": [
    {
      "name": "string",
      "party": "string",
      "party_logo_url": "Wikipedia Commons SVG URL",
      "party_color": "hex",
      "party_abbreviation": "string",
      "win_probability": number,
      "projected_vote_share": number,
      "momentum": "rising" | "stable" | "falling",
      "status": "active"
    }
  ],
  "forecast_summary": "Summary string",
  "confidenceLevel": "low" | "medium" | "high",
  "swing_factors": [
    { "factor": "string", "impact": number 1-10 }
  ],
  "polling_average": number | null,
  "historical_context": "string",
  "key_issues": ["string"],
  "disruption_risks": ["string"]
}

CRITICAL: 
1. For COMPLETED: Use ONLY context above. DO NOT leave 'candidates' null. Ensure seat_count has both 'won' and 'total'.
2. For UPCOMING/ONGOING: Provide forecast with win_probability, projected_vote_share, momentum, polling_average, and election_date.
3. Output ONLY valid JSON. No conversational text.`;

            const messages = [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ];

            rawResponse = await callGroq(messages, res, true);
        } catch (groqErr) {
            console.error(`[Forecast Route] Groq failed: ${groqErr.message}`);
            throw groqErr; // Propagate Groq error directly
        }
        
        let finalForecast;
        try {
            console.log("RAW GROQ RESPONSE:", JSON.stringify(rawResponse));
            finalForecast = JSON.parse(rawResponse);
            console.log("GROQ RAW:", JSON.stringify(finalForecast));
            console.log("CANDIDATES:", finalForecast.candidates);
            
            // Step 3: Backend Validation & Normalization
            if (finalForecast.election_status === 'upcoming' || finalForecast.election_status === 'ongoing') {
                const totalProb = finalForecast.candidates?.reduce((sum, c) => sum + (c.win_probability || c.winProbability || 0), 0);
                if (totalProb > 0 && totalProb !== 100) {
                    console.warn(`[Validation] Win probabilities sum to ${totalProb}, normalizing to 100...`);
                    finalForecast.candidates.forEach(c => {
                        const prob = c.win_probability || c.winProbability || 0;
                        c.win_probability = Math.round((prob / totalProb) * 100);
                    });
                    
                    const newSum = finalForecast.candidates.reduce((sum, c) => sum + (c.win_probability || 0), 0);
                    if (newSum !== 100 && finalForecast.candidates.length > 0) {
                        finalForecast.candidates[0].win_probability += (100 - newSum);
                    }
                }
            } else if (finalForecast.election_status === 'completed') {
                if (!finalForecast.actual_result || !finalForecast.actual_result.winner_name) {
                    throw new Error("Completed election missing winner data.");
                }
            }
        } catch (err) {
            console.error('[Forecast Route] Validation/Parsing failed.', err.message);
            res.write(`data: ${JSON.stringify({ error: `Analysis error: ${err.message}. Please try again.` })}\n\n`);
            res.write('data: [DONE]\n\n');
            return res.end();
        }

        finalForecast.lastUpdated = new Date().toISOString();
        finalForecast.modelSource = finalModel;

        // Cache the result
        forecastCache.set(cacheKey, { timestamp: Date.now(), data: finalForecast });

        console.log(`=== PIPELINE COMPLETE VIA ${finalModel.toUpperCase()} STREAMING ===\n`);
        res.write('data: [DONE]\n\n');
        return res.end();

    } catch (e) {
        console.error('[Forecast Route] Error:', e.message);

        const sendError = (status, payload) => {
            if (res.headersSent) {
                res.write(`data: ${JSON.stringify(payload)}\n\n`);
                res.write('data: [DONE]\n\n');
                return res.end();
            } else {
                return res.status(status).json(payload);
            }
        };

        // Gemini Specific Error Handling
        if (e.status === 429) {
            return sendError(429, {
                error: 'DAILY_QUOTA_EXHAUSTED',
                message: e.message,
                is_quota_fallback: true
            });
        }
        
        if (e.status === 403) {
            return sendError(403, {
                error: 'GEMINI_AUTH_ERROR',
                message: 'API key invalid.'
            });
        }

        if (e.status === 400) {
            return sendError(400, {
                error: 'GEMINI_BAD_REQUEST',
                message: 'Invalid request.'
            });
        }

        return sendError(500, {
            error: `Master Analysis failed: ${e.message}`,
            honest_error: true
        });
    } finally {
        isRequestInProgress = false;
    }
});

module.exports = router;
