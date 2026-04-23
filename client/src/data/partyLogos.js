// Static list of major political parties with known colors and abbreviations.
// Some logo URLs are hardcoded, but if they are missing or fail to load,
// the PartyLogo component will fallback to the Wikipedia API or a colored circle.

const PARTY_DATA = [
  // US Parties
  {
    name: 'Republican',
    aliases: ['gop', 'republican party'],
    color: '#ef4444',
    abbrev: 'REP',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Republicanlogo.svg/512px-Republicanlogo.svg.png'
  },
  {
    name: 'Democrat',
    aliases: ['democratic', 'democratic party'],
    color: '#3b82f6',
    abbrev: 'DEM',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/DemocraticLogo.svg/512px-DemocraticLogo.svg.png'
  },
  {
    name: 'Independent',
    aliases: ['ind'],
    color: '#10b981',
    abbrev: 'IND',
    logoUrl: '' // Empty will trigger fallback or just colored circle
  },
  
  // UK Parties
  {
    name: 'Conservative',
    aliases: ['tory', 'conservatives', 'conservative party'],
    color: '#0087DC',
    abbrev: 'CON',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Conservative_logo_2006.svg/512px-Conservative_logo_2006.svg.png'
  },
  {
    name: 'Labour',
    aliases: ['labour party'],
    color: '#E4003B',
    abbrev: 'LAB',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Labour_Party_logo_%282024%29.svg/512px-Labour_Party_logo_%282024%29.svg.png'
  },
  {
    name: 'Liberal Democrats',
    aliases: ['libdem', 'lib dem', 'liberal democrat'],
    color: '#FAA61A',
    abbrev: 'LD',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Liberal_Democrats_logo.svg/512px-Liberal_Democrats_logo.svg.png'
  },

  // Indian Parties
  {
    name: 'Bharatiya Janata Party',
    aliases: ['bjp'],
    color: '#FF9933',
    abbrev: 'BJP',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Bharatiya_Janata_Party_logo.svg/512px-Bharatiya_Janata_Party_logo.svg.png'
  },
  {
    name: 'Indian National Congress',
    aliases: ['inc', 'congress'],
    color: '#19AAED',
    abbrev: 'INC',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Indian_National_Congress_hand_logo.svg/512px-Indian_National_Congress_hand_logo.svg.png'
  },
  {
    name: 'Aam Aadmi Party',
    aliases: ['aap'],
    color: '#0066A4',
    abbrev: 'AAP',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Aam_Aadmi_Party_logo_%281%29.svg/512px-Aam_Aadmi_Party_logo_%281%29.svg.png'
  },
  {
    name: 'Samajwadi Party',
    aliases: ['sp'],
    color: '#FF2222',
    abbrev: 'SP',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Samajwadi_Party_Flag.svg/512px-Samajwadi_Party_Flag.svg.png'
  },
  {
    name: 'Bahujan Samaj Party',
    aliases: ['bsp'],
    color: '#22409A',
    abbrev: 'BSP',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Elephant_Bahujan_Samaj_Party.svg/512px-Elephant_Bahujan_Samaj_Party.svg.png'
  },
  {
    name: 'Trinamool Congress',
    aliases: ['tmc', 'aitc'],
    color: '#20C646',
    abbrev: 'TMC',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/All_India_Trinamool_Congress_flag.svg/512px-All_India_Trinamool_Congress_flag.svg.png'
  },
  {
    name: 'Janata Dal (United)',
    aliases: ['jdu', 'jd(u)'],
    color: '#003366',
    abbrev: 'JDU',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Janata_Dal_%28United%29_Flag.svg/512px-Janata_Dal_%28United%29_Flag.svg.png'
  },
  {
    name: 'Rashtriya Janata Dal',
    aliases: ['rjd'],
    color: '#008000',
    abbrev: 'RJD',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Rashtriya_Janata_Dal_Flag.svg/512px-Rashtriya_Janata_Dal_Flag.svg.png'
  },
  {
    name: 'Nationalist Congress Party',
    aliases: ['ncp'],
    color: '#00B2B2',
    abbrev: 'NCP',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Nationalist_Congress_Party_Flag.svg/512px-Nationalist_Congress_Party_Flag.svg.png'
  },
  {
    name: 'Shiv Sena',
    aliases: ['shivsena', 'shiv sena'],
    color: '#F26F21',
    abbrev: 'SHS',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Shiv_Sena_Logo.svg/512px-Shiv_Sena_Logo.svg.png'
  },
  {
    name: 'Communist Party of India',
    aliases: ['cpi'],
    color: '#CB0922',
    abbrev: 'CPI',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/CPI-banner.svg/512px-CPI-banner.svg.png'
  },
  {
    name: 'Communist Party of India (Marxist)',
    aliases: ['cpim', 'cpi(m)'],
    color: '#DE0000',
    abbrev: 'CPIM',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Cpi-m-flag.svg/512px-Cpi-m-flag.svg.png'
  },
  {
    name: 'All India Anna Dravida Munnetra Kazhagam',
    aliases: ['aiadmk'],
    color: '#00953C',
    abbrev: 'AIADMK',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/AIADMK_Flag.svg/512px-AIADMK_Flag.svg.png'
  },
  {
    name: 'Dravida Munnetra Kazhagam',
    aliases: ['dmk'],
    color: '#D81A21',
    abbrev: 'DMK',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/DMK_flag.svg/512px-DMK_flag.svg.png'
  }
];

export function getPartyInfo(partyName) {
  if (!partyName) return null;
  
  const searchName = partyName.toLowerCase().trim();
  
  // Try exact match or exact alias match
  for (const party of PARTY_DATA) {
    if (party.name.toLowerCase() === searchName || party.aliases.includes(searchName)) {
      return { ...party };
    }
  }

  // Try substring match
  for (const party of PARTY_DATA) {
    if (searchName.includes(party.name.toLowerCase()) || 
        party.aliases.some(alias => searchName.includes(alias))) {
      return { ...party };
    }
  }

  // Generate fallback info for completely unknown parties
  const abbrev = partyName.substring(0, 3).toUpperCase();
  
  // Deterministic color based on string
  let hash = 0;
  for (let i = 0; i < partyName.length; i++) {
    hash = partyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;

  return {
    name: partyName,
    aliases: [],
    color,
    abbrev,
    logoUrl: ''
  };
}

// In-memory cache for fetched logos
const logoCache = new Map();

/**
 * Searches Wikipedia API for a page matching the party name
 * and returns the thumbnail URL if available.
 */
export async function fetchWikipediaLogo(partyName) {
  if (!partyName) return null;
  
  const cleanName = partyName.trim();
  if (logoCache.has(cleanName)) {
    return logoCache.get(cleanName);
  }

  try {
    const encodedName = encodeURIComponent(cleanName);
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodedName}`);
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.thumbnail && data.thumbnail.source) {
        const url = data.thumbnail.source;
        logoCache.set(cleanName, url);
        return url;
      }
    }
    
    // If exact name fails, sometimes adding "party" helps, but we will just return null to avoid bad matches
    logoCache.set(cleanName, null);
    return null;
  } catch (err) {
    console.error("Failed to fetch Wikipedia logo for", partyName, err);
    return null;
  }
}
