const { callGemini } = require('./utils/geminiClient');
async function run() {
  try {
    const res = await callGemini('You are an election forecasting expert. Use web search for current data. Target Election: Bengal elections 2026. Return a JSON object with candidates name. Example: {"candidates": [{"name": "Mamata Banerjee"}, {"name": "Suvendu Adhikari"}]}');
    console.log(res);
  } catch(e) {
    console.error(e);
  }
}
run();
