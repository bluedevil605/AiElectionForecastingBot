const dotenv = require('dotenv');
dotenv.config();

/**
 * Uses Groq's high-speed API with the Llama 3 8B model via streaming.
 * @param {string} prompt - The consolidated Master Agent prompt.
 * @param {object} res - Express response object for piping SSE chunks.
 * @returns {Promise<string>} - Full concatenated raw text response from Groq.
 */
async function callGroq(prompt, res = null) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const error = new Error('API key invalid. Check GROQ_API_KEY in .env');
    error.status = 403;
    throw error;
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile", // Reverted from groq/compound due to 413s and invalid JSON formatting
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" },
      stream: true
    })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 429) {
      const err = new Error("Groq API rate limit exceeded.");
      err.status = 429;
      throw err;
    }
    throw new Error(body.error?.message || `Groq failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";

  let streamBuffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    streamBuffer += decoder.decode(value, { stream: true });
    const lines = streamBuffer.split('\n');
    // Keep the last incomplete line in the buffer to process with the next chunk
    streamBuffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        const dataStr = line.replace('data: ', '').trim();
        if (!dataStr) continue;

        try {
          const parsed = JSON.parse(dataStr);
          const txt = parsed.choices?.[0]?.delta?.content || '';
          if (txt) {
            fullText += txt;
            if (res) {
              res.write(`data: ${JSON.stringify({ text: txt })}\n\n`);
            }
          }
        } catch (err) {
          // ignore partial json chunk parsing mapping
        }
      }
    }
  }

  let cleaned = fullText.replace(/```json/g, '').replace(/```/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) cleaned = jsonMatch[0];

  return cleaned;
}

module.exports = { callGroq };
