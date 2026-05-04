const dotenv = require('dotenv');
dotenv.config();

/**
 * Uses Serper API to perform a Google News search and returns a text summary
 * of the top headlines to use as context for the LLM.
 * @param {string} query - The search query
 * @returns {Promise<string>} - Aggregated news context
 */
async function fetchNewsContext(query) {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) return "No SERPER_API_KEY provided.";

    try {
        const response = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: {
                "X-API-KEY": apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                q: `${query} official result winner 2026`,
                gl: "in",
                num: 10
            })
        });

        if (!response.ok) {
            console.warn(`Serper API failed with status ${response.status}`);
            return "Serper search failed.";
        }

        const data = await response.json();
        
        if (!data.organic || data.organic.length === 0) {
            return "No recent Serper search results found.";
        }

        // Map the results into a compact string format
        const searchContext = data.organic.map((item, idx) => {
            return `[Serper Result ${idx + 1}] Title: "${item.title}". Snippet: "${item.snippet}"`;
        }).join('\n');

        return searchContext;
    } catch (err) {
        console.error("Error fetching data from Serper:", err.message);
        return "Serper search error.";
    }
}

module.exports = { fetchSerperContext: fetchNewsContext };
