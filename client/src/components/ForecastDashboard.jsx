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
    if (forecastData.election_status === 'completed') return activeCandidates;

    return activeCandidates.map(c => {
      const rawProb = c.winProbability ?? c.win_probability;
      const base = (rawProb !== null && rawProb !== undefined && !isNaN(parseFloat(rawProb)))
        ? parseFloat(rawProb) : null;
      return { ...c, winProbability: base };
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
            Analysis Ver. 4.2.0 • Pulse Check: {new Date(forecastData.lastUpdated).toLocaleTimeString()}
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

      {/* Clean Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-6 glass-panel p-8 rounded-[2rem] min-h-[400px]">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <PieChart size={18} />
             </div>
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Candidates & Probability</h3>
          </div>
          <ProbabilityGauge candidates={adjustedCandidates} margin={forecastData.marginOfVictoryEstimate}/>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-6 glass-panel p-8 rounded-[2rem] min-h-[400px]">
           <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Zap size={18} />
             </div>
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Sentiment Vector</h3>
          </div>
          <SentimentMeter candidates={adjustedCandidates} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <motion.div variants={itemVariants} className="glass-panel p-8 rounded-[2rem]">
           <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                <Cpu size={18} />
             </div>
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Key AI Takeaways</h3>
          </div>
          <AIExplanation explanation={forecastData.explanation} confidence={forecastData.confidenceLevel} sources={forecastData.sources}/>
        </motion.div>
      </div>
    </motion.div>
  );
}
