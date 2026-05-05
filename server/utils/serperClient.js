const dotenv = require('dotenv');
dotenv.config();

/**
 * Uses Serper API to perform a Google News search and returns a text summary
 * of the top headlines to use as context for the LLM.
 * @param {string} query - The search query
 * @returns {Promise<string>} - Aggregated news context
 */
async function fetchSerperContext(query) {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) return "No SERPER_API_KEY provided.";

    try {
        const queryLower = query.toLowerCase();
        const isIndian = queryLower.includes('india') || queryLower.includes('election commission of india') || queryLower.includes('eci') || queryLower.includes('bengal') || queryLower.includes('bihar') || queryLower.includes('delhi') || queryLower.includes('up') || queryLower.includes('uttar pradesh') || queryLower.includes('vidhan sabha');
        const isState = queryLower.includes('assembly') || queryLower.includes('vidhan sabha') || isIndian; 
        
        let suffix = "";
        if (isIndian) {
            suffix += " ECI";
            if (isState) suffix += " Vidhan Sabha";
        }

        const queries = [
            `${query} election 2026 candidates list`.trim(),
            `${query} assembly election news update`.trim(),
            `${query} main political parties contenders`.trim(),
            `${query} opinion poll survey current`.trim(),
            `${query} alliance formation news`.trim(),
            `${query} winner prediction forecast`.trim()
        ];

        if (isIndian) {
            queries.push(`${query} BJP TMC INC candidates`.trim());
            queries.push(`${query} NDA INDIA alliance Bengal UP Bihar`.trim());
        }

        console.log(`[SerperClient] Executing ${queries.length} parallel queries:`);
        queries.forEach((q, i) => console.log(`  Query ${i+1}: "${q}"`));

        const fetchQuery = async (q) => {
            const response = await fetch("https://google.serper.dev/search", {
                method: "POST",
                headers: {
                    "X-API-KEY": apiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ q, gl: "in", num: 5 })
            });
            if (!response.ok) return [];
            const data = await response.json();
            return data.organic || [];
        };

        const results = await Promise.all(queries.map(fetchQuery));
        
        // Flatten and deduplicate by URL
        const allOrganic = [];
        const seenUrls = new Set();
        
        for (const resArray of results) {
            for (const item of resArray) {
                if (!seenUrls.has(item.link)) {
                    seenUrls.add(item.link);
                    allOrganic.push(item);
                }
            }
        }

        if (allOrganic.length === 0) {
            return "No recent Serper search results found.";
        }

        // Map the results into a compact string format
        const searchContext = allOrganic.slice(0, 15).map((item, idx) => {
            return `[Serper Result ${idx + 1}] Title: "${item.title}". Snippet: "${item.snippet}"`;
        }).join('\n');

        console.log(`[SerperClient] Snippets fetched:\n${searchContext.substring(0, 500)}...`);

        return searchContext;
    } catch (err) {
        console.error("Error fetching data from Serper:", err.message);
        return "Serper search error.";
    }
}

module.exports = { fetchSerperContext };
