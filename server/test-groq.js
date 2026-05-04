const { callGroq } = require('./utils/groqClient');
async function run() {
  try {
    const res = await callGroq('You are an election forecasting expert. Return ONLY valid JSON. Target Election: Bengal elections 2026. Give me the current month and year according to your web search right now, and one piece of recent news. JSON SCHEMA: {"current_date":"str", "latest_news":"str"}');
    console.log(res);
  } catch(e) {
    console.error(e);
  }
}
run();
