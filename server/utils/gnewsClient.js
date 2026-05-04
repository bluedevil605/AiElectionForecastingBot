const dotenv = require('dotenv');
dotenv.config();

/**
 * Uses GNews API to fetch the latest news headlines and snippets for an election.
 * @param {string} query - The search query
 * @returns {Promise<string>} - The formatted headlines and snippets
 */
async function fetchGNewsContext(query) {
    // Attempt to use GNEWS_API_KEY first, fallback to NEWS_API_KEY if that's what's currently in .env
    const apiKey = process.env.GNEWS_API_KEY || process.env.NEWS_API_KEY;
    
    if (!apiKey) {
        return "No GNews/News API key provided.";
    }

    try {
        const searchUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query + ' result winner declared')}&lang=en&max=10&token=${apiKey}`;
        const searchResponse = await fetch(searchUrl);
        
        if (!searchResponse.ok) {
            console.warn(`GNews API failed with status ${searchResponse.status}`);
            return "GNews search failed.";
        }

        const searchData = await searchResponse.json();
        
        if (!searchData.articles || searchData.articles.length === 0) {
            return "No recent GNews articles found.";
        }

        const newsContext = searchData.articles.map((item, idx) => {
            return `[GNews Article ${idx + 1}] Title: "${item.title}". Snippet: "${item.description}"`;
        }).join('\n');

        return newsContext;

    } catch (err) {
        console.error("Error fetching data from GNews:", err.message);
        return "GNews fetch error.";
    }
}

module.exports = { fetchGNewsContext };
