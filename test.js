const { callGroq } = require('./server/utils/groqClient.js');

async function test() {
    try {
        const res = await callGroq(`
You are an election forecasting expert. Use web search for current data.
Do not hallucinate. Cite sources. Return ONLY valid JSON.
Target Election/Query: "Germany Federal"
JSON SCHEMA:
{
  "election_status": "upcoming"|"ongoing"|"completed",
  "actual_result": null,
  "candidates": [
    { "name": "str", "party": "str", "winProbability": 65.5, "projectedVoteShare": 51.2, "momentum": "stable", "sentimentScore": 75, "status": "active" }
  ],
  "confidenceLevel": "high",
  "marginOfVictoryEstimate": "str",
  "explanation": {
    "summary": "Short 2 sentence summary.",
    "topDecisiveFactors": [{"factor": "str", "impact": 8.5}],
    "historicalComparison": "Short 1 sentence.",
    "riskFactors": ["str"]
  },
  "sources": ["url1"]
}
        `);
        console.log("=== RAW GROQ RESPONSE ===");
        console.log(res);
        console.log("=== PARSING ATTEMPT ===");
        console.log(JSON.parse(res));
    } catch(e) {
        console.error(e);
    }
}
test();
