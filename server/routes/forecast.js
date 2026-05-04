const express = require('express');
const { callGemini } = require('../utils/geminiClient');
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
        const electionRegex = /election|vote|poll|president|senat|congress|governor|mayor|campaign|candidate|democrat|republican|referendum|ballot|primary|midterm|politics|parliament|minister|tory|labour|biden|trump|harris|modi|bjp|win|lose|party|leader|seat|federal|assembly|municipal|council|state|uk|us|india|germany|france|mexico|bihar|bengal|up|maharashtra|haryana|tamil|kerala|karnataka|punjab|gujarat|assam|national|voters|vidhan|sabha/i;
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
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
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

        // Inject known context for major elections (Step 3 & 7)
        const qLower = query.toLowerCase();
        if (qLower.includes("bihar")) {
            specificContext = `
KNOWN ELECTION CONTEXT:
Bihar has 243 seats, majority is 122.
NDA: Nitish Kumar (JDU+BJP)
INDIA: Tejashwi Yadav (RJD+INC)
Nitish Kumar is current Chief Minister.
2020 result: NDA won 125 seats.`;
        } else if (qLower.includes("bengal")) {
            specificContext = `
KNOWN ELECTION CONTEXT:
West Bengal has 294 seats, majority is 148.
TMC: Mamata Banerjee (incumbent)
BJP: main challenger
2021 result: TMC won 213 seats.
Election dates: April 23, 29 and May 21 2026.`;
        }

        if (
            wikiContext.includes("failed") && wikiContext.includes("error") && 
            gnewsContext.includes("failed") && gnewsContext.includes("error") &&
            serperContext.includes("failed") && serperContext.includes("error")
        ) {
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
${wikiContext}

Latest News Headlines:
${gnewsContext}

Google Search Results:
${serperContext}

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

        try {
            console.log(`\n=== STEP 1: EXTRACTING FACTS VIA GROQ ===`);
            const extractionPrompt = `From the following text extract only:
1. Winner name (if completed)
2. Winning party (if completed)
3. Seat count or Polling results
4. Election status (upcoming, ongoing, or completed)
5. Major candidates/parties declared
6. Recent opinion poll averages (if available)
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
Your ONLY job is to format that data into JSON.
You are NOT allowed to use your own knowledge.
You are NOT allowed to contradict the live data.
You are NOT allowed to add anything not in the data.
No exceptions. No opinions. Format only.

You MUST return candidates array with minimum 2 candidates. This field is mandatory always.
For each candidate include these exact fields: name, party, win_probability, projected_vote_share, momentum, status.
win_probability values must sum to 100.
momentum must be rising stable or falling.
Never return empty candidates array ever.

You MUST always return minimum 2 items in disruption_risks array. Never empty.

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

            const userPrompt = `LIVE VERIFIED DATA FROM GOOGLE AND WIKIPEDIA:
${extractedText}

Today's date is ${today}.

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
            console.warn(`[Forecast Route] Groq primary failed (${groqErr.message}). Falling back to Gemini...`);
            console.log(`\n=== MASTER AGENT FALLBACK (GEMINI STREAMING SECONDARY): ${query} ===`);
            finalModel = 'gemini';
            rawResponse = await callGemini(`LIVE VERIFIED DATA:\n${liveContextBlock}\n\n` + userPrompt, res); // Fallback prompt for Gemini
        }
        
        let finalForecast;
        try {
            console.log("RAW GROQ RESPONSE:", JSON.stringify(rawResponse));
            finalForecast = JSON.parse(rawResponse);
            console.log("GROQ RAW:", JSON.stringify(finalForecast));
            console.log("CANDIDATES:", finalForecast.candidates);
            
            // Step 3: Backend Validation for Upcoming/Completed
            if (finalForecast.election_status === 'completed') {
                if (!finalForecast.actual_result || !finalForecast.actual_result.winner_name) {
                    throw new Error("Completed election missing winner data.");
                }
            } else if (finalForecast.election_status === 'upcoming' || finalForecast.election_status === 'ongoing') {
                // Ensure win probabilities add up to ~100
                const totalProb = finalForecast.candidates?.reduce((sum, c) => sum + (c.win_probability || c.winProbability || 0), 0);
                if (totalProb > 0 && (totalProb < 80 || totalProb > 120)) {
                    console.warn(`[Validation] Win probabilities sum to ${totalProb}, normalizing...`);
                    finalForecast.candidates.forEach(c => {
                        const prob = c.win_probability || c.winProbability || 0;
                        c.win_probability = (prob / totalProb) * 100;
                    });
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
