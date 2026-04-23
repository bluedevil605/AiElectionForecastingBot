import React, { useState, useEffect } from 'react';
import { getPartyInfo, fetchWikipediaLogo } from '../data/partyLogos';

export default function PartyLogo({ partyName, candidateInfo, size = 'small', className = '' }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [partyData, setPartyData] = useState(null);

  const sizeClasses = {
    small: 'w-8 h-8 text-[10px]',
    medium: 'w-12 h-12 text-xs',
    large: 'w-16 h-16 text-sm'
  };

  const dimensions = sizeClasses[size] || sizeClasses.small;

  useEffect(() => {
    if (!partyName) return;
    
    let isMounted = true;
    const data = getPartyInfo(partyName);
    setPartyData(data);
    setImgError(false); // Reset error state on new party

    // Determine initial image URL to try
    let initialUrl = candidateInfo?.party_logo_url || data.logoUrl;

    const resolveLogo = async () => {
      if (initialUrl) {
        if (isMounted) setImgUrl(initialUrl);
      } else {
        // Fallback to Wikipedia API if no URL provided by Gemini or static list
        const wikiUrl = await fetchWikipediaLogo(data.name || partyName);
        if (isMounted && wikiUrl) {
          setImgUrl(wikiUrl);
        }
      }
    };

    resolveLogo();

    return () => {
      isMounted = false;
    };
  }, [partyName, candidateInfo]);

  const handleImageError = async () => {
    // If the primary image failed to load, let's try wikipedia fallback as a last resort
    // only if we haven't already tried it
    setImgError(true);
    
    if (partyData && imgUrl && !imgUrl.includes('wikipedia.org')) {
       const wikiUrl = await fetchWikipediaLogo(partyData.name || partyName);
       if (wikiUrl && wikiUrl !== imgUrl) {
          setImgError(false);
          setImgUrl(wikiUrl);
       }
    }
  };

  const fallbackColor = candidateInfo?.party_color || partyData?.color || '#8b5cf6';
  const abbreviation = candidateInfo?.party_abbreviation || partyData?.abbrev || partyName?.substring(0, 3).toUpperCase() || '?';

  if (!imgUrl || imgError) {
    return (
      <div 
        className={`rounded-full flex items-center justify-center font-black text-white uppercase tracking-widest border border-white/20 shadow-inner shrink-0 ${dimensions} ${className}`}
        style={{ backgroundColor: fallbackColor }}
        title={partyName}
      >
        {abbreviation}
      </div>
    );
  }

  return (
    <div className={`rounded-full bg-white border border-white/20 shadow-md flex items-center justify-center overflow-hidden shrink-0 ${dimensions} ${className}`} title={partyName}>
      <img 
        src={imgUrl} 
        alt={`${partyName} logo`} 
        className="w-[85%] h-[85%] object-contain"
        onError={handleImageError}
      />
    </div>
  );
}
