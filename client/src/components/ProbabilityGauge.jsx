import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import PartyLogo from './PartyLogo';

export default function ProbabilityGauge({ candidates, margin }) {
  if (!candidates || candidates.length === 0) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-3 custom-scrollbar">
        {candidates.map((c, i) => {
          const isLeader = i === 0;
          const accentColor = i === 0 ? "rgba(16, 185, 129, 0.4)" : i === 1 ? "rgba(244, 63, 94, 0.4)" : "rgba(99, 102, 241, 0.4)";
          const barColor = i === 0 
            ? "bg-gradient-to-r from-emerald-600 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.6)]" 
            : i === 1 
            ? "bg-gradient-to-r from-rose-600 to-pink-400 shadow-[0_0_15px_rgba(244,63,94,0.6)]" 
            : "bg-gradient-to-r from-indigo-600 to-cyan-400 shadow-[0_0_15px_rgba(99,102,241,0.6)]";

          const rawProb = c.winProbability ?? c.win_probability;
          const prob = (rawProb !== null && rawProb !== undefined && !isNaN(parseFloat(rawProb)))
            ? parseFloat(rawProb) : null;

          const width = prob !== null ? Math.min(100, Math.max(0, prob)) : null;
          const hasData = width !== null;

          const rawVote = c.projectedVoteShare ?? c.projected_vote_share;
          const voteShare = (rawVote !== null && rawVote !== undefined && !isNaN(parseFloat(rawVote)))
            ? parseFloat(rawVote) : null;

          return (
            <motion.div 
              key={c.name}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="relative group"
            >
              <div 
                className="absolute -inset-0.5 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"
                style={{ backgroundColor: accentColor }}
              />
              <div className="relative bg-black/40 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <PartyLogo partyName={c.party} candidateInfo={c} size="small" />
                    <div>
                      <h4 className="text-white font-black text-xl tracking-tighter leading-none mb-1">{c.name}</h4>
                      <span className="text-sm font-black text-slate-500 uppercase tracking-widest">{c.party}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {hasData ? (
                      <div className="flex flex-col items-end">
                        <span className="text-3xl font-black text-white tracking-tighter tabular-nums">
                          {width.toFixed(1)}<span className="text-sm text-slate-500 ml-0.5">%</span>
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                          {c.momentum === 'rising' ? (
                            <div className="flex items-center gap-1 text-emerald-400 text-sm font-black uppercase tracking-widest">
                              <TrendingUp size={12} /> Gaining
                            </div>
                          ) : c.momentum === 'falling' ? (
                            <div className="flex items-center gap-1 text-rose-400 text-sm font-black uppercase tracking-widest">
                              <TrendingDown size={12} /> Receding
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-500 text-sm font-black uppercase tracking-widest">
                               <Minus size={12} /> Stable
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-base font-black italic uppercase tracking-widest">No Node Data</span>
                    )}
                  </div>
                </div>

                <div className="w-full bg-slate-900/80 rounded-full h-2.5 overflow-hidden shadow-inner border border-white/5">
                  {hasData ? (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 2, ease: "circOut" }}
                      className={`h-full rounded-full ${barColor} relative`}
                    >
                       <div className="absolute top-0 right-0 h-full w-2 bg-white/30 blur-[2px]" />
                    </motion.div>
                  ) : null}
                </div>

                <div className="mt-4 flex justify-between items-center">
                   <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                      Proj. Vote Share: {voteShare !== null ? <span className="text-slate-300 ml-1">{voteShare}%</span> : <span className="text-slate-700 italic ml-1">N/A</span>}
                   </div>
                   {isLeader && (
                      <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                        Projected Front-runner
                      </div>
                   )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {margin && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center"
        >
          <span className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Estimated Victory Gap</span>
          <div className="flex items-center gap-3">
             <div className="h-1 w-12 bg-indigo-500/20 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ x: [-48, 48] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="h-full w-full bg-indigo-500/40"
                />
             </div>
             <strong className="text-white text-xl font-black tracking-tighter">{margin}</strong>
          </div>
        </motion.div>
      )}
    </div>
  );
}
