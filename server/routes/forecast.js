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
You are an election forecasting expert. Use web search for current data.
Do not hallucinate. Cite sources. Return ONLY valid JSON.
Keep "explanation" fields extremely brief to save tokens. Max 4 candidates.
Search for Wikipedia Commons SVG logo URL for each party if available and return it in party_logo_url.

Target Election/Query: "${query}"
Today's date is ${today}.

JSON SCHEMA:
{
  "election_status": "upcoming"|"ongoing"|"completed",
  "actual_result": { "winner": "str", "winner_party": "str", "vote_share": 51.5, "margin": "str" } | null,
  "candidates": [
    { "name": "str", "party": "str", "party_logo_url": "str", "party_color": "str", "party_abbreviation": "str", "winProbability": 65.5, "projectedVoteShare": 51.2, "momentum": "rising"|"falling"|"stable", "sentimentScore": 75, "status": "active"|"withdrew" }
  ],
  "confidenceLevel": "high"|"medium"|"low",
  "marginOfVictoryEstimate": "str",
  "explanation": {
    "summary": "Short 2 sentence summary.",
    "topDecisiveFactors": [{"factor": "str (Descriptive 4-8 word phrase, e.g. 'Economic Anxiety & High Inflation')", "impact": 8.5}],
    "historicalComparison": "Short 1 sentence.",
    "riskFactors": ["str"]
  },
  "sources": ["url1"]
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
