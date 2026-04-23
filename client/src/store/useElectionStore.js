import { create } from 'zustand';

export const useElectionStore = create((set) => ({
  query: '',
  setQuery: (q) => set({ query: q }),
  
  forecastData: null,
  setForecastData: (data) => set({ forecastData: data }),
  
  isSearching: false,
  setIsSearching: (status) => set({ isSearching: status }),

  isStreaming: false,
  setIsStreaming: (status) => set({ isStreaming: status }),

  streamedRawText: '',
  setStreamedRawText: (text) => set({ streamedRawText: text }),
  
  error: null,
  setError: (err) => set({ error: err }),

  // API Status Indicator: 'ok' | 'quota_reached'
  apiStatus: 'ok',
  setApiStatus: (status) => set({ apiStatus: status }),


  // Scenario Simulator Overrides
  scenarioOverride: {
    turnout: 65,
    youthVote: 50,
    incumbency: 0,
    economy: 0,
    unity: 50
  },
  setScenarioOverride: (overrides) => set((state) => ({ 
    scenarioOverride: { ...state.scenarioOverride, ...overrides } 
  })),

  resetAll: () => set({ 
    query: '', 
    forecastData: null, 
    isSearching: false, 
    error: null,
    apiStatus: 'ok',
    scenarioOverride: { turnout: 65, youthVote: 50, incumbency: 0, economy: 0, unity: 50 }
  })

}));
