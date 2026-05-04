const dotenv = require('dotenv');
dotenv.config();

async function testGroqNoStream() {
  const prompt = 'You are an election forecasting expert. Return ONLY valid JSON. Target Election: Bengal elections 2026. Give me the current month and year according to your web search right now. JSON SCHEMA: {"current_date": "str", "latest_news": "str"}';
  
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "groq/compound",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" },
      stream: false
    })
  });

  const json = await response.json();
  console.log(JSON.stringify(json, null, 2));
}

testGroqNoStream();
