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

        // Prompt consolidated for Gemini (Token Reduced schema representation)
        const consolidatedPrompt = `
You are an expert political data analyst. Your task is to forecast the election specified in the query.
CRITICAL INSTRUCTIONS:
1. Use live web search to find the most up-to-date information, polls, and news for this specific election. Do NOT rely solely on past election results.
2. Identify the major candidates/parties actually expected to compete. (Max 4 candidates).
3. Provide realistic win probabilities (summing to ~100%) and projected vote shares.
4. Find the official Wikipedia Commons SVG logo URL for each party, and their standard color.
5. You MUST return ONLY valid JSON. No markdown formatting (\`\`\`json), no preamble, no trailing text.

Target Election/Query: "${query}"
Today's Date: ${today}

REQUIRED JSON SCHEMA:
{
  "election_status": "upcoming" | "ongoing" | "completed",
  "actual_result": null,
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
    "summary": "1-2 sentence analytical summary.",
    "topDecisiveFactors": [{"factor": "Key issue", "impact": 8.5}],
    "historicalComparison": "1 sentence context.",
    "riskFactors": ["Key risk 1"]
  },
  "sources": ["https://..."]
}
`.trim();

        // Lock the request
        isRequestInProgress = true;
        
        let rawResponse;
        let finalModel = 'groq';

        try {
            console.log(`\n=== MASTER AGENT STARTING (GROQ API PRIMARY STREAMING): ${query} ===`);
            rawResponse = await callGroq(consolidatedPrompt, res);
        } catch (groqErr) {
            console.warn(`[Forecast Route] Groq primary failed (${groqErr.message}). Falling back to Gemini...`);
            console.log(`\n=== MASTER AGENT FALLBACK (GEMINI STREAMING SECONDARY): ${query} ===`);
            finalModel = 'gemini';
            rawResponse = await callGemini(consolidatedPrompt, res);
        }
        
        let finalForecast;
        try {
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
