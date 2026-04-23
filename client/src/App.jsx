import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Wifi, WifiOff, Database, Zap, Cpu } from 'lucide-react';
import SearchBar from './components/SearchBar';
import ForecastDashboard from './components/ForecastDashboard';
import { useElectionStore } from './store/useElectionStore';

// API Status Badge - elevated style
function ApiStatusBadge({ status }) {
  const configs = {
    ok:       { icon: <Wifi size={12} />,    label: 'LIVE NODE CONNECTED',  cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 active-glow-emerald' },
    cached:   { icon: <Database size={12} />, label: 'DATABASE CACHED',      cls: 'bg-sky-500/10    border-sky-500/30    text-sky-400' },
    offline:  { icon: <WifiOff size={12} />, label: 'NODE OFFLINE',         cls: 'bg-rose-500/10   border-rose-500/30   text-rose-400' },
  };
  const cfg = configs[status] || configs.ok;
  
  return (
    <motion.span 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest border backdrop-blur-md shadow-lg ${cfg.cls}`}
    >
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'offline' ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'offline' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
      </span>
      {cfg.label}
    </motion.span>
  );
}

// Advanced Dynamic Background
const BackgroundElements = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-slate-950">
    <motion.div 
      animate={{ 
        x: ['-5vw', '10vw', '-5vw'],
        y: ['-5vh', '10vh', '-5vh'],
        scale: [1, 1.3, 1],
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[5%] left-[5%] w-[45%] h-[45%] bg-indigo-600/30 blur-[130px] rounded-full mix-blend-screen"
    />
    <motion.div 
      animate={{ 
        x: ['5vw', '-10vw', '5vw'],
        y: ['10vh', '-5vh', '10vh'],
        scale: [1.2, 0.9, 1.2],
      }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[30%] right-[5%] w-[40%] h-[40%] bg-fuchsia-600/30 blur-[130px] rounded-full mix-blend-screen"
    />
    <motion.div 
      animate={{ 
        x: ['10vw', '-15vw', '10vw'],
        y: ['5vh', '-10vh', '5vh'],
        scale: [0.8, 1.2, 0.8],
      }}
      transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-[-10%] left-[25%] w-[55%] h-[55%] bg-teal-600/20 blur-[150px] rounded-full mix-blend-screen"
    />

    {/* 3D Perspective Grid */}
    <div className="absolute inset-0 perspective-container flex justify-center">
      <div className="absolute top-[30%] w-[300%] h-[150%] preserve-3d">
         <div className="absolute inset-0 bg-grid-pattern opacity-40 animate-grid-flow [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_70%,transparent)]" />
      </div>
    </div>

    {/* Vertical Fade so it doesn't clash with the top header */}
    <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
    
    <div className="noise-overlay" />
  </div>
);

export default function App() {
  const { forecastData, isSearching, error, resetAll, apiStatus } = useElectionStore();
  const dashboardRef = useRef(null);

  return (
    <div className="min-h-screen relative bg-slate-950 pb-20 font-sans selection:bg-indigo-500/30">
      <BackgroundElements />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 relative z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-8 border-b border-white/5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <Cpu className="text-indigo-400 w-5 h-5" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                Elect<span className="text-indigo-500">IQ</span>
              </h1>
            </div>
            <p className="text-slate-400 text-sm md:text-base font-medium flex items-center gap-2">
              <span className="w-8 h-[1px] bg-indigo-500/50" />
              Multi-Agent Strategic Election Intelligence
            </p>
          </motion.div>

          <div className="flex items-center gap-4 mt-6 md:mt-0">
            <ApiStatusBadge status={apiStatus} />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={resetAll}
              className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/10 backdrop-blur-md uppercase tracking-widest"
            >
              Reset Session
            </motion.button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto w-full mb-12"
            >
              <div className="glass-panel-heavy rounded-3xl p-10 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
                  <AlertTriangle className="text-rose-500 w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
                  {error.startsWith('Invalid Input') ? 'Invalid Input' : 'Analysis Interrupted'}
                </h2>
                <p className="text-slate-400 text-lg mb-8 max-w-md">
                  {error.startsWith('Invalid Input') 
                    ? error.replace('Invalid Input:', '').trim()
                    : error.includes('DAILY_QUOTA_EXHAUSTED')
                    ? 'AI processing units have reached daily capacity. Neural buffers will reset at midnight.'
                    : 'Tactical data retrieval failed. The query may be outside current predictive parameters.'}
                </p>
                
                <div className="bg-black/40 rounded-xl p-4 w-full text-left font-mono text-xs text-rose-400/60 mb-8 border border-white/5 overflow-hidden">
                  CODE: {error.startsWith('Invalid Input') ? '400_BAD_REQUEST' : error}
                </div>
                <button onClick={resetAll} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all shadow-xl shadow-indigo-500/20 uppercase tracking-widest text-sm">
                  Initialize New Search
                </button>
              </div>
            </motion.div>
          ) : !forecastData ? (
             <motion.div 
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
             >
                <SearchBar />
             </motion.div>
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
              ref={dashboardRef}
            >
              {forecastData?.cached && (
                <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between px-6 py-3 glass-panel rounded-2xl text-sky-400 text-xs font-bold tracking-widest uppercase">
                  <div className="flex items-center gap-3">
                    <Database size={14} />
                    <span>Historical Buffer Active (60m)</span>
                  </div>
                  <button onClick={() => { resetAll(); }} className="hover:text-white transition-colors underline decoration-2 underline-offset-4">Refresh Node</button>
                </div>
              )}
              <ForecastDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
