const dotenv = require('dotenv');
dotenv.config();

async function testGroqStream() {
  const prompt = 'You are a political data analyst. Return ONLY valid JSON. Target Election: Bengal elections 2026. Give me the current month and year according to your web search right now. JSON SCHEMA: {"current_date": "str", "latest_news": "str"}';
  
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
      stream: true
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log("CHUNK:", decoder.decode(value, { stream: true }));
  }
}

testGroqStream();
