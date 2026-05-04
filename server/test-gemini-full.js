const { callGemini } = require('./utils/geminiClient');
async function run() {
  const query = "Bengal elections 2026";
  const today = new Date().toLocaleDateString('en-US');
  const consolidatedPrompt = `You are an election forecasting expert. Use web search for current data.
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
    "topDecisiveFactors": [{"factor": "str (Descriptive 4-8 word phrase)", "impact": 8.5}],
    "historicalComparison": "Short 1 sentence.",
    "riskFactors": ["str"]
  },
  "sources": ["url1"]
}`.trim();
  try {
    const res = await callGemini(consolidatedPrompt);
    console.log(res);
  } catch(e) {
    console.error(e);
  }
}
run();
