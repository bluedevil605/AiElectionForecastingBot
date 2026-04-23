import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, Shield, Sparkles } from 'lucide-react';
import { useElectionStore } from '../store/useElectionStore';

export default function SearchBar() {
  const { setQuery, setIsSearching, setForecastData, setError, isSearching, setApiStatus, setIsStreaming, isStreaming, streamedRawText, setStreamedRawText } = useElectionStore();
  const [localQuery, setLocalQuery] = useState('');
  const abortRef = useRef(null);

  const doFetch = async (q) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setQuery(q);
    setIsSearching(true);
    setIsStreaming(false);
    setStreamedRawText('');
    setError(null);
    setForecastData(null);
    setApiStatus('ok');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${apiUrl}/api/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
        signal: abortRef.current.signal
      });

      if (!response.ok) {
        let errMsg = `HTTP Error: ${response.status}`;
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch(e) {}
        throw new Error(errMsg);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let textAccumulator = '';

      setIsSearching(false);
      setIsStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;
            if (!dataStr) continue;
            
            let parsed;
            try {
              parsed = JSON.parse(dataStr);
              if (parsed.error) {
                if (parsed.error === 'DAILY_QUOTA_EXHAUSTED') throw new Error(parsed.error);
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                textAccumulator += parsed.text;
                setStreamedRawText(textAccumulator);
              }
            } catch (err) {
               if (err.message === 'DAILY_QUOTA_EXHAUSTED' || (parsed && err.message === parsed.error)) throw err;
            }
          }
        }
      }

      setIsStreaming(false);

      let finalData;
      try {
        let cleaned = textAccumulator.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) cleaned = jsonMatch[0];
        finalData = JSON.parse(cleaned);
      } catch (err) {
        throw new Error('Failed to parse final forecast format from AI.');
      }
      
      setForecastData(finalData);

    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      if (err.message.includes('DAILY_QUOTA_EXHAUSTED') || err.message.includes('quota')) {
        setApiStatus('quota_reached');
      } else {
        setApiStatus('offline');
      }
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!localQuery.trim() || isSearching) return;
    doFetch(localQuery.trim());
  };

  const loadingSteps = [
    'Initializing Neural Swarm...',
    'Scraping Live Intelligence...',
    'Calibrating Historical Bias...',
    'Synthesizing Sentiment Data...',
    'Rendering Final Forecast...'
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl mx-auto mb-12 relative rounded-[2.6rem] p-[1.5px] overflow-hidden group/main shadow-[0_0_50px_rgba(0,0,0,0.5)]"
    >
      {/* Animated Big Box Border Background */}
      <div 
        className="absolute top-1/2 left-1/2 w-[200%] h-[200%] animate-[spin_8s_linear_infinite] opacity-30 group-hover/main:opacity-60 transition-opacity duration-1000 pointer-events-none" 
        style={{ 
          background: 'conic-gradient(from 0deg at 50% 50%, transparent 0%, rgba(99,102,241,1) 15%, transparent 40%, rgba(168,85,247,1) 65%, transparent 100%)',
          transform: 'translate(-50%, -50%)'
        }} 
      />

      {/* Inner Big Box Area */}
      <div className="relative z-10 w-full h-full glass-panel-heavy border-0 p-10 md:p-16 text-center rounded-[2.5rem] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
      
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-black uppercase tracking-widest mb-6">
          <Shield size={10} /> Secure Analysis Node
        </span>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter uppercase">
          Strategic <span className="text-gradient">Forecasting</span>
        </h2>
        <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
          Input your target parameters to deploy a multi-agent specialized swarm for real-time predictive modeling.
        </p>
      </motion.div>

      <form onSubmit={handleSearch} className="relative w-full group">
        <motion.div
          animate={isSearching ? { scale: [1, 0.99, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className="relative rounded-[1.2rem] p-[1.5px] overflow-hidden"
        >
          {/* Animated Border Background */}
          <div 
            className="absolute top-1/2 left-1/2 w-[200%] h-[200%] animate-[spin_4s_linear_infinite] opacity-40 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" 
            style={{ 
              background: 'conic-gradient(from 0deg at 50% 50%, transparent 0%, rgba(99,102,241,1) 20%, transparent 50%, rgba(168,85,247,1) 70%, transparent 100%)',
              transform: 'translate(-50%, -50%)'
            }} 
          />
          
          <div className="absolute inset-0 blur-xl rounded-[1.2rem] opacity-0 group-focus-within:opacity-50 transition-opacity duration-700 pointer-events-none" 
               style={{ background: 'conic-gradient(from 0deg at 50% 50%, transparent 0%, rgba(99,102,241,1) 20%, transparent 50%, rgba(168,85,247,1) 70%, transparent 100%)' }} />

          {/* Inner Content Area */}
          <div className="relative z-10 w-full h-full bg-slate-950 rounded-[1.1rem]">
            <input
              type="text"
              disabled={isSearching}
              placeholder="e.g. United Kingdom General Election 2024"
              className="w-full pl-16 pr-44 py-7 rounded-[1.1rem] bg-black/60 border-none text-white focus:outline-none focus:ring-0 focus:bg-black/90 shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] placeholder:text-slate-600 text-xl md:text-2xl transition-all disabled:opacity-50 font-black tracking-tighter"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
            />
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none">
              <Search size={28} />
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(79, 70, 229, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isSearching || isStreaming || !localQuery.trim()}
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-black transition-all border border-indigo-400 shadow-xl text-base uppercase tracking-widest flex items-center gap-2"
              >
                {isSearching || isStreaming ? (
                   <>
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     Processing
                   </>
                ) : (
                  <>
                     <Zap size={16} /> Execute
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </form>

      <AnimatePresence>
        {isSearching && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-12 flex flex-col items-center justify-center space-y-6"
          >
            <div className="flex gap-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1, 
                    delay: i * 0.2 
                  }}
                  className="w-2.5 h-2.5 bg-indigo-500 rounded-full"
                />
              ))}
            </div>
            <LoadingStepCycle steps={loadingSteps} />
          </motion.div>
        )}

        {isStreaming && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-8 bg-black/60 rounded-2xl border border-indigo-500/30 hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300 text-left overflow-hidden relative group max-h-64"
          >
             <div className="absolute top-0 right-0 p-4 flex gap-2 items-center bg-gradient-to-l from-black/80 to-transparent">
                 <span className="text-sm text-indigo-400 uppercase tracking-widest font-bold">Receiving telemetry...</span>
                 <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_#6366f1]"></div>
             </div>
             <div className="p-6 overflow-y-auto max-h-64 scroll-smooth">
               <pre className="font-mono text-indigo-300 text-base whitespace-pre-wrap leading-relaxed">
                  {streamedRawText || "Opening tunnel..."}
               </pre>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isSearching && !isStreaming && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">Trending Vectors:</span>
          {['Bihar 2025', 'US Midterms', 'Germany Federal'].map(tag => (
            <button 
              key={tag}
              onClick={() => setLocalQuery(tag)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-wider"
            >
              {tag}
            </button>
          ))}
        </motion.div>
      )}
      </div>
    </motion.div>
  );
}

function LoadingStepCycle({ steps }) {
  const [idx, setIdx] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setIdx(i => (i + 1) % steps.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <motion.div 
      key={idx}
      initial={{ opacity: 0, filter: 'blur(5px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(5px)' }}
      className="text-indigo-300 font-black text-base tracking-[0.2em] flex items-center gap-3 uppercase"
    >
      <Sparkles size={16} className="text-indigo-400 animate-pulse" />
      {steps[idx]}
    </motion.div>
  );
}
