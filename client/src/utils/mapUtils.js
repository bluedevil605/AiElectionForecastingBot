// src/utils/mapUtils.js

export const PARTY_COLORS = {
    "BJP": "#f97316", // Orange/Saffron
    "NDA": "#f97316", // Orange/Saffron
    "AAP": "#0284c7", // Blue
    "INC": "#10b981", // Green
    "INDIA": "#10b981", // Green
    "SP": "#dc2626", // Red
    "BSP": "#1d4ed8", // Dark Blue
    "TMC": "#22c55e", // Light Green
    "NCP": "#0ea5e9", // Sky Blue
    "Others": "#64748b", // Slate
    "Tossup": "#64748b",
};

export const MARGIN_OPACITY = {
    "large": 0.9,     // > 10%
    "medium": 0.7,    // 5-10%
    "narrow": 0.5,    // 2-5%
    "tossup": 0.3     // < 2%
};

/**
 * Returns the path to the GeoJSON file for the given region.
 * Defaults to india-states.geojson.
 */
export function getGeoJSONUrl(regionTitle) {
    if (!regionTitle) return '/geojson/india-states.geojson';
    const title = regionTitle.toLowerCase().trim();
    
    if (title.includes('delhi') || title.includes('new delhi')) {
        return '/geojson/delhi-constituencies.geojson';
    }
    if (title.includes('mumbai') || title.includes('maharashtra')) {
        return '/geojson/maharashtra-districts.geojson';
    }
    if (title.includes('punjab')) {
        return '/geojson/punjab-districts.geojson';
    }
    if (title.includes('uttar pradesh') || title.includes('up')) {
        return '/geojson/up-districts.geojson';
    }
    
    return '/geojson/india-states.geojson';
}

/**
 * Determines the fill color and opacity for a specific region.
 */
export function getRegionColor(featureName, breakdownList, viewMode) {
    const defaultStyle = { fill: '#334155', opacity: 0.2 }; // Base slate style
    if (!breakdownList || breakdownList.length === 0) return defaultStyle;

    const sanitize = (str) => {
        if (!str) return "";
        return str.toLowerCase()
                  .replace(/district|constituency|north|south|east|west|central|new/g, "")
                  .replace(/[^a-z0-9]/g, "")
                  .trim();
    };

    const sFeature = sanitize(featureName);

    const regionData = breakdownList.find(b => {
        const sRegion = sanitize(b.region);
        return sFeature.includes(sRegion) || sRegion.includes(sFeature);
    });

    if (!regionData) return defaultStyle;

    const baseColor = PARTY_COLORS[regionData.leading_party] || PARTY_COLORS["Others"];
    
    if (viewMode === 'party') {
        const opacity = MARGIN_OPACITY[regionData.margin] || 0.6;
        return { fill: baseColor, opacity };
    } 
    else if (viewMode === 'margin') {
        // Red = tossup, Green = safe
        let color = '#fbbf24'; // medium
        if (regionData.margin === 'large') color = '#10b981'; // green
        if (regionData.margin === 'narrow') color = '#f97316'; // orange
        if (regionData.margin === 'tossup') color = '#ef4444'; // red
        return { fill: color, opacity: 0.8 };
    } 
    else if (viewMode === 'turnout') {
        // Higher turnout = brighter white/indigo
        const t = regionData.estimated_turnout || 60;
        const alpha = Math.max(0.2, Math.min(1, t / 100));
        return { fill: '#818cf8', opacity: alpha };
    }

    return defaultStyle;
}

/**
 * If the AI didn't provide a regional_breakdown, generate a plausible mock
 * by iterating over the map's GeoJSON features and randomly assigning leaders
 * based on the top 2 candidates' overall vote shares.
 */
export function generateMockBreakdown(candidates, features) {
    if (!candidates || candidates.length === 0 || !features) return [];
    
    const top2 = candidates.slice(0, 2);
    if (top2.length === 0) return [];

    return features.map(f => {
        // The property keys depend on the specific GeoJSON file.
        // E.g., ST_NM for India states, ac_name for Delhi assembly, dist_name for districts.
        const regionName = f.properties.ST_NM || f.properties.ac_name || f.properties.dist_name || f.properties.name || "Unknown";
        
        // Toss a coin weighted by their overall probabilities
        const totalProb = top2[0].winProbability + (top2[1]?.winProbability || 0) || 100;
        const roll = Math.random() * totalProb;
        
        const winner = roll < (top2[0].winProbability || 50) ? top2[0] : top2[1];
        const loser = winner === top2[0] ? top2[1] : top2[0];
        
        const margins = ["large", "medium", "narrow", "tossup"];
        const randomMargin = margins[Math.floor(Math.random() * margins.length)];

        return {
            region: regionName,
            leading_party: winner.party,
            margin: randomMargin,
            vote_share: Math.floor(Math.random() * 15 + 40), // 40-55
            opponent_share: Math.floor(Math.random() * 10 + 30), // 30-40
            key_factor: "Generated Scenario",
            estimated_turnout: Math.floor(Math.random() * 30 + 50) // 50-80
        };
    });
}
