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

        // Expanded search for upcoming elections
        const queries = [
            searchQuery,
            `${query} opinion polls ${year}`,
            `${query} candidates ${year}`,
            `${query} previous result`
        ];

        console.log(`[WikiClient] Fetching context for potentially upcoming election...`);
        
        const fetchWiki = async (q) => {
            const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`;
            const searchResponse = await fetch(searchUrl);
            if (!searchResponse.ok) return null;
            return await searchResponse.json();
        };

        const searchResults = await Promise.all(queries.map(fetchWiki));
        
        // Find the best page title (containing the year)
        let topTitle = null;
        for (const data of searchResults) {
            if (data?.query?.search) {
                for (const item of data.query.search) {
                    if (item.title.includes(year)) {
                        topTitle = item.title;
                        break;
                    }
                }
            }
            if (topTitle) break;
        }

        if (!topTitle && searchResults[0]?.query?.search?.[0]) {
            topTitle = searchResults[0].query.search[0].title;
        }

        if (!topTitle) return "No relevant Wikipedia articles found.";

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
