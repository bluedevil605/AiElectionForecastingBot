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
        const electionRegex = /election|vote|poll|president|senat|congress|governor|mayor|campaign|candidate|democrat|republican|referendum|ballot|primary|midterm|politics|parliament|minister|tory|labour|biden|trump|harris|modi|bjp|win|lose|party|leader|seat|federal|assembly|municipal|council|state|uk|us|india|germany|france|mexico|bihar|national/i;
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
1. Winner name
2. Winning party
3. Seat count if available
4. Election status completed or not

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
If live data says BJP won you must output BJP won.
No exceptions. No opinions. Format only.`;

            const userPrompt = `LIVE VERIFIED DATA FROM GOOGLE AND WIKIPEDIA:
${extractedText}

Today's date is ${today}.

Format the above data into this JSON structure:
{
  "election_status": "upcoming" | "ongoing" | "completed",
  "actual_result": "Fill with actual winner/results if completed, otherwise null",
  "candidates": [
    {
      "name": "Candidate or Party Leader Name",
      "party": "Full Party Name",
      "party_logo_url": "Valid Wikipedia Commons SVG URL",
      "party_color": "e.g. Blue, Red, Saffron, Green",
      "party_abbreviation": "e.g. DEM, GOP, BJP, INC",
      "winProbability": 45.5,
      "projectedVoteShare": 42.1,
      "momentum": "rising" | "falling" | "stable",
      "sentimentScore": 75,
      "status": "active"
    }
  ],
  "confidenceLevel": "high" | "medium" | "low",
  "marginOfVictoryEstimate": "e.g. Tight, Landslide, Narrow",
  "explanation": {
    "summary": "1-2 sentence analytical summary based strictly on live context.",
    "topDecisiveFactors": [{"factor": "Key issue", "impact": 8.5}],
    "historicalComparison": "1 sentence context.",
    "riskFactors": ["Key risk 1"]
  },
  "sources": ["https://..."]
}

CRITICAL: Only use data from above. Nothing else.`;

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
            console.log("RAW RESPONSE FROM MODEL:", rawResponse);
            finalForecast = JSON.parse(rawResponse);
        } catch (err) {
            console.error('[Forecast Route] Failed to parse JSON from streamed text.', err.message);
            res.write('data: {"error": "Failed to generate valid forecast data. Please try again."}\n\n');
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
