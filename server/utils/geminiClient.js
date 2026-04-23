const dotenv = require('dotenv');
dotenv.config();

/**
 * Uses gemini-2.5-flash with built-in Google Search via Streaming.
 * @param {string} prompt - The consolidated Master Agent prompt.
 * @param {object} res - Express response object for piping SSE chunks.
 * @returns {Promise<string>} - Full concatenated raw text response from Gemini.
 */
async function callGemini(prompt, res = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_key_here') {
    const error = new Error('API key invalid. Check GEMINI_API_KEY in .env');
    error.status = 403;
    throw error;
  }

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=" 
    + apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: { temperature: 0.1 }
      })
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 429) {
      const err = new Error("Gemini daily quota reached. Resets at midnight Pacific Time. Free tier allows 1500 requests per day.");
      err.status = 429;
      throw err;
    }
    if (response.status === 400) {
      const err = new Error("Invalid request. Try different search term.");
      err.status = 400;
      throw err;
    }
    if (response.status === 403) {
      const err = new Error("API key invalid. Check GEMINI_API_KEY in .env");
      err.status = 403;
      throw err;
    }
    throw new Error(body.error?.message || "Gemini failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    
    // Google SSE format is "data: {...}\n\n"
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.replace('data: ', '').trim();
        if (!dataStr) continue;
        
        try {
          const parsed = JSON.parse(dataStr);
          const txt = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (txt) {
            fullText += txt;
            if (res) {
                // Pipe to our own SSE stream
                res.write(`data: ${JSON.stringify({ text: txt })}\n\n`);
                // Flush might be needed depending on compression middleware, but typically res.write works.
            }
          }
        } catch (err) {
          // ignore partial json parsing issues in chunks
        }
      }
    }
  }

  let cleaned = fullText.replace(/```json/g, '').replace(/```/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];

  return cleaned;
}

module.exports = { callGemini };
