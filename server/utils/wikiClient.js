/**
 * Uses Wikipedia API to perform a search and fetch the summary of the top result.
 * @param {string} query - The search query
 * @returns {Promise<string>} - The summary text of the top Wikipedia result
 */
async function fetchWikiContext(query) {
    try {
        // Extract year from query if present
        const yearMatch = query.match(/\b(20\d{2})\b/);
        const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
        
        // Ensure "election" and year are in the search query
        let searchQuery = query.toLowerCase().includes('election') ? query : `${query} election`;
        if (!searchQuery.includes(year)) {
            searchQuery = `${searchQuery} ${year}`;
        }

        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`;
        const searchResponse = await fetch(searchUrl);
        
        if (!searchResponse.ok) {
            console.warn(`Wikipedia search API failed with status ${searchResponse.status}`);
            return "Wikipedia search failed.";
        }

        const searchData = await searchResponse.json();
        
        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            return "No relevant Wikipedia articles found.";
        }

        // Find the first result whose title contains the year
        let topTitle = searchData.query.search[0].title;
        for (const item of searchData.query.search) {
            if (item.title.includes(year)) {
                topTitle = item.title;
                break;
            }
        }

        console.log(`[WikiClient] Exact Wikipedia page selected: "${topTitle}"`);

        const summaryUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&titles=${encodeURIComponent(topTitle)}&format=json&origin=*`;
        const summaryResponse = await fetch(summaryUrl);

        if (!summaryResponse.ok) {
             console.warn(`Wikipedia summary API failed with status ${summaryResponse.status}`);
             return "Wikipedia summary fetch failed.";
        }

        const summaryData = await summaryResponse.json();
        const pages = summaryData.query?.pages;
        if (pages) {
            const pageId = Object.keys(pages)[0];
            const extract = pages[pageId].extract;
            if (extract) {
                // Strip basic HTML tags from the extract
                const cleanExtract = extract.replace(/<\/?[^>]+(>|$)/g, "");
                console.log(`[WikiClient] Extract fetched:\n${cleanExtract.substring(0, 500)}...`);
                return cleanExtract;
            }
        }

        return "No summary extract available on Wikipedia.";

    } catch (err) {
        console.error("Error fetching data from Wikipedia:", err.message);
        return "Wikipedia fetch error.";
    }
}

module.exports = { fetchWikiContext };
