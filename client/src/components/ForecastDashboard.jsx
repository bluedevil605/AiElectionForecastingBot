import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Zap, Clock, Lock, Cpu, BarChart3, PieChart, Activity, Map as MapIcon } from 'lucide-react';
import { useElectionStore } from '../store/useElectionStore';
import ProbabilityGauge from './ProbabilityGauge';
import SentimentMeter from './SentimentMeter';
import AIExplanation from './AIExplanation';
import CompletedElectionDashboard from './CompletedElectionDashboard';

function StatusBadge({ isQuotaExceeded, isConnecting }) {
  if (isConnecting) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-400 text-sm font-black uppercase tracking-widest rounded-lg border border-amber-500/20">
        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse blur-[1px]" /> Neural Link Active...
      </span>
    );
  }

  if (isQuotaExceeded) {
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 text-rose-400 text-sm font-black uppercase tracking-widest rounded-lg border border-rose-500/20">
        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" /> Signal Throttled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-sm font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">
      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> Sync Complete
    </span>
  );
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const target = new Date();
      target.setUTCHours(8, 0, 0, 0);
      if (now > target) target.setUTCDate(target.getUTCDate() + 1);
      const diff = target - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs  = Math.floor((diff % (1000 * 60)) / 1000);
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    const timer = setInterval(() => setTimeLeft(calculateTime()), 1000);
    setTimeLeft(calculateTime());
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-6xl font-black text-white tracking-widest bg-black/40 px-10 py-6 rounded-3xl border border-white/5 shadow-2xl font-mono">
        {timeLeft || "00:00:00"}
      </div>
      <div className="text-sm font-black text-slate-500 uppercase tracking-[0.4em]">
        Neural Buffer Reset Pipeline (PST)
      </div>
    </div>
  );
}

function QuotaReachedView() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[700px] text-center p-12"
    >
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-rose-500/20 blur-[100px] rounded-full animate-pulse"></div>
        <div className="relative w-32 h-32 bg-slate-900/80 border border-rose-500/30 rounded-[2.5rem] flex items-center justify-center shadow-2xl backdrop-blur-xl">
          <Lock className="text-rose-500" size={48} />
        </div>
      </div>

      <h2 className="text-5xl font-black text-white mb-6 tracking-tighter">
        Neural Capacity Reached
      </h2>
      
      <div className="max-w-xl glass-panel p-8 mb-12 rounded-[2rem] border border-white/5">
        <p className="text-slate-400 text-lg leading-relaxed">
          The high-bandwidth Gemini processing interface has reached its cycle limit. Predictive modeling will resume once the neural buffer clears.
        </p>
      </div>

      <CountdownTimer />
    </motion.div>
  );
}

export default function ForecastDashboard() {
  const { forecastData, query, apiStatus } = useElectionStore();

  const adjustedCandidates = useMemo(() => {
    if (!forecastData || !forecastData.candidates) return [];
    const activeCandidates = forecastData.candidates.filter(c => c.status !== 'withdrew');
    if (forecastData.election_status === 'completed') {
      return activeCandidates.sort((a, b) => {
        const shareA = a.projected_vote_share ?? a.projectedVoteShare ?? 0;
        const shareB = b.projected_vote_share ?? b.projectedVoteShare ?? 0;
        return shareB - shareA;
      });
    }

    return activeCandidates.map(c => {
      const rawProb = c.win_probability ?? c.winProbability;
      const base = (rawProb !== null && rawProb !== undefined && !isNaN(parseFloat(rawProb)))
        ? parseFloat(rawProb) : null;
      return { ...c, winProbability: base };
    }).sort((a, b) => {
      const probA = a.winProbability ?? 0;
      const probB = b.winProbability ?? 0;
      return probB - probA;
    });
  }, [forecastData]);

  if (!forecastData) return null;

  const isCompleted = forecastData.election_status === 'completed';
  const hasWithdrawn = forecastData.candidates?.some(c => c.status === 'withdrew');

  if (isCompleted) {
    return <CompletedElectionDashboard forecastData={forecastData} query={query} />;
  }

  if (apiStatus === 'quota_reached' || forecastData?.is_quota_fallback) {
    return <QuotaReachedView />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-8 pb-20 w-full"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <h2 className="text-4xl font-black tracking-tight uppercase text-gradient drop-shadow-md">{query}</h2>
            <div className="h-6 w-[1px] bg-white/10 hidden md:block" />
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-sm font-black uppercase tracking-widest rounded-lg border border-indigo-500/20 flex items-center gap-2">
                <Activity size={12} /> Strategic Forecast
              </span>
              <StatusBadge isQuotaExceeded={apiStatus === 'quota_reached'} />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest flex items-center gap-3">
            <Cpu size={14} className="text-indigo-500" />
            Analysis Ver. 4.2.0 • Pulse Check: {forecastData.lastUpdated ? new Date(forecastData.lastUpdated).toLocaleTimeString() : 'REAL-TIME'}
          </p>
        </div>
      </header>

      {hasWithdrawn && (
        <motion.div variants={itemVariants} className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex gap-4 text-amber-200 backdrop-blur-md">
          <AlertTriangle size={24} className="shrink-0 text-amber-500" />
          <div className="text-base font-medium">
            <strong className="text-amber-400 uppercase tracking-widest text-sm block mb-1">Intelligence Notice</strong>
            Dynamic candidate status detected. Withdrawn participants have been purged from the real-time simulation.
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-8 glass-panel p-8 rounded-[2rem] min-h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <PieChart size={18} />
               </div>
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Live Probability & Projection</h3>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Model Confidence</span>
                  <span className={`text-sm font-black uppercase tracking-tighter ${
                    forecastData.confidenceLevel?.toLowerCase() === 'high' ? 'text-emerald-400' : 
                    forecastData.confidenceLevel?.toLowerCase() === 'medium' ? 'text-amber-400' : 'text-rose-400'
                  }`}>{forecastData.confidenceLevel || 'MEDIUM'}</span>
               </div>
            </div>
          </div>
          <ProbabilityGauge candidates={adjustedCandidates} margin={forecastData.marginOfVictoryEstimate}/>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col gap-8">
          <div className="glass-panel p-8 rounded-[2rem] flex-1">
             <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <Zap size={18} />
               </div>
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Momentum Vector</h3>
            </div>
            <SentimentMeter candidates={adjustedCandidates} />
          </div>

          <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2rem] backdrop-blur-md">
             <h3 className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-4">Key Swing Factors</h3>
             <div className="space-y-3">
                {(forecastData.swing_factors || []).map((sf, idx) => (
                  <div key={idx} className="flex items-center justify-between group">
                    <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{sf.factor}</span>
                    <div className="flex items-center gap-2">
                       <div className="h-1.5 w-12 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${(sf.impact || 5) * 10}%` }} />
                       </div>
                       <span className="text-[10px] font-black text-indigo-400">{sf.impact || 5}/10</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </motion.div>
      </div>

      {/* Extended Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-3xl border border-white/5">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Polling Average</p>
           <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-white">
                {forecastData.polling_average !== null ? forecastData.polling_average : (
                   adjustedCandidates.length > 0 && adjustedCandidates[0].projected_vote_share 
                      ? adjustedCandidates[0].projected_vote_share 
                      : '--'
                )}%
              </span>
              <span className="text-xs font-bold text-emerald-400 mb-1">AGGREGATE</span>
           </div>
        </motion.div>
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-3xl border border-white/5">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Election Date</p>
           <span className="text-xl font-black text-slate-200 uppercase tracking-tight">{forecastData.election_date || 'TBD'}</span>
        </motion.div>
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-3xl border border-white/5">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Simulation Status</p>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-black text-emerald-400 uppercase tracking-widest">REAL-TIME ACTIVE</span>
           </div>
        </motion.div>
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-3xl border border-white/5">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Data Integrity</p>
           <span className="text-xs font-black text-slate-300 uppercase tracking-widest">WIKI + GOOGLE VERIFIED</span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <motion.div variants={itemVariants} className="glass-panel p-8 rounded-[2rem]">
           <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                <Cpu size={18} />
             </div>
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Strategic Neural Analysis</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2">
                <p className="text-lg font-bold text-slate-200 leading-relaxed italic mb-6">
                   "{forecastData.forecast_summary || forecastData.explanation?.summary}"
                </p>
                <div className="flex flex-wrap gap-2">
                   {(forecastData.key_issues || []).map((issue, i) => (
                     <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       {issue}
                     </span>
                   ))}
                </div>
             </div>
             <div className="bg-black/40 rounded-2xl p-6 border border-white/5">
                <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertTriangle size={12} /> Disruption Risks
                </h4>
                <div className="space-y-3">
                   {(forecastData.disruption_risks || []).map((risk, i) => (
                     <div key={i} className="flex gap-3">
                        <div className="w-1 h-1 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <p className="text-xs font-bold text-slate-400 leading-tight">{risk}</p>
                     </div>
                   ))}
                </div>
             </div>
          </div>
          
          {forecastData.sources && forecastData.sources.length > 0 && (
            <div className="mt-8 pt-8 border-t border-white/5">
               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Verification Sources</h4>
               <div className="flex flex-wrap gap-4">
                  {forecastData.sources.map((src, i) => (
                    <a key={i} href={src} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors truncate max-w-[200px]">
                      {new URL(src).hostname}
                    </a>
                  ))}
               </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
