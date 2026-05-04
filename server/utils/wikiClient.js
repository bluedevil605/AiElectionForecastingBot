/**
 * Uses Wikipedia API to perform a search and fetch the summary of the top result.
 * @param {string} query - The search query
 * @returns {Promise<string>} - The summary text of the top Wikipedia result
 */
async function fetchWikiContext(query) {
    try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' result winner')}&format=json&origin=*`;
        const searchResponse = await fetch(searchUrl);
        
        if (!searchResponse.ok) {
            console.warn(`Wikipedia search API failed with status ${searchResponse.status}`);
            return "Wikipedia search failed.";
        }

        const searchData = await searchResponse.json();
        
        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            return "No relevant Wikipedia articles found.";
        }

        const topTitle = searchData.query.search[0].title;
        const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`;
        const summaryResponse = await fetch(summaryUrl);

        if (!summaryResponse.ok) {
             console.warn(`Wikipedia summary API failed with status ${summaryResponse.status}`);
             return "Wikipedia summary fetch failed.";
        }

        const summaryData = await summaryResponse.json();
        if (summaryData && summaryData.extract) {
            return summaryData.extract;
        }

        return "No summary extract available on Wikipedia.";

    } catch (err) {
        console.error("Error fetching data from Wikipedia:", err.message);
        return "Wikipedia fetch error.";
    }
}

module.exports = { fetchWikiContext };
