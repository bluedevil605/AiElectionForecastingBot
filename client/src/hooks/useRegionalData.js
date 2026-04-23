// src/hooks/useRegionalData.js
import { useState, useEffect } from 'react';
import * as topojson from 'topojson-client';
import { getGeoJSONUrl, generateMockBreakdown } from '../utils/mapUtils';

// Simple in-memory cache to prevent re-fetching the same JSON
const geoCache = {};

export function useRegionalData(electionQuery, forecastData) {
    const [geoJSON, setGeoJSON] = useState(null);
    const [regionalBreakdown, setRegionalBreakdown] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchMap() {
            if (!electionQuery) return;
            
            setIsLoading(true);
            setError(null);
            
            try {
                const url = getGeoJSONUrl(electionQuery);
                let data = geoCache[url];

                if (!data) {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`Failed to map shapes: ${response.status}`);
                    }
                    data = await response.json();
                    
                    // If it's topojson, convert it to geojson.
                    // The ones we downloaded are actually pure GeoJSON, but we check just in case.
                    if (data.type === "Topology") {
                        const objectKey = Object.keys(data.objects)[0];
                        data = topojson.feature(data, data.objects[objectKey]);
                    }
                    
                    geoCache[url] = data;
                }

                if (!isMounted) return;
                
                setGeoJSON(data);

                // Use real AI data if available, else generate mock data for the map
                let breakdown = forecastData?.regional_breakdown;
                if (!breakdown || breakdown.length === 0) {
                    console.log("No AI regional_breakdown found. Generating mock overlays.");
                    breakdown = generateMockBreakdown(forecastData?.candidates, data.features);
                }
                
                setRegionalBreakdown(breakdown);

            } catch (err) {
                console.error("Map fetch error:", err);
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchMap();

        return () => { isMounted = false; };
    }, [electionQuery, forecastData]);

    return { geoJSON, regionalBreakdown, isLoading, error };
}
