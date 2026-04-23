import { AlertCircle, FileText, Activity, ShieldCheck, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AIExplanation({ explanation, confidence, sources }) {
  if (!explanation) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
           <ShieldCheck size={14} className="text-indigo-500" /> Intelligence Synthesis
        </h3>
        {confidence && (
          <motion.span 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`px-3 py-1 text-sm uppercase tracking-widest font-black rounded-lg border backdrop-blur-md ${
              confidence === 'high' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 
              confidence === 'low' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 
              'text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
            }`}
          >
            {confidence} Reliability
          </motion.span>
        )}
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto pr-3 custom-scrollbar">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group lg:pt-2"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000" />
          <div className="relative bg-black/40 border border-white/5 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
             <p className="text-slate-300 text-base leading-relaxed font-medium">
               {explanation.summary}
             </p>
          </div>
        </motion.div>

        {explanation.topDecisiveFactors && explanation.topDecisiveFactors.length > 0 && (
          <div>
            <h4 className="text-sm font-black text-indigo-400/80 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Activity size={12} /> Strategic Pivot Points
            </h4>
            <div className="space-y-3">
               {explanation.topDecisiveFactors.map((f, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.1 }}
                   className="flex items-center justify-between gap-4 bg-white/5 p-3 px-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors"
                 >
                    <span className="text-sm font-bold text-slate-300 uppercase tracking-wide leading-tight">{f.factor}</span>
                    <div className="flex items-center gap-3 shrink-0">
                       <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${f.impact * 10}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-indigo-500"
                          />
                       </div>
                       <span className="text-sm font-black text-white tabular-nums bg-indigo-500/20 px-1.5 py-0.5 rounded-md min-w-[32px] text-center">
                         {f.impact}
                       </span>
                    </div>
                 </motion.div>
               ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-t border-white/5">
           {explanation.historicalComparison && (
             <div className="space-y-2">
               <h4 className="text-sm font-black text-slate-600 uppercase tracking-widest">Temporal Vector</h4>
               <p className="text-sm text-slate-400 leading-relaxed font-medium border-l-2 border-indigo-500/30 pl-4 py-1 italic">
                 "{explanation.historicalComparison}"
               </p>
             </div>
           )}
           {explanation.riskFactors && explanation.riskFactors.length > 0 && (
             <div className="space-y-2">
               <h4 className="text-sm font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                 <AlertCircle size={10} /> Disruption Risks
               </h4>
               <ul className="space-y-1.5">
                 {explanation.riskFactors.map((r, i) => (
                    <li key={i} className="text-sm text-slate-400 font-medium flex items-start gap-2">
                        <span className="w-1 h-1 bg-rose-500/50 rounded-full mt-1.5 shrink-0" />
                        {r}
                    </li>
                 ))}
               </ul>
             </div>
           )}
        </div>
        
        {sources && sources.length > 0 && (
            <div className="pt-6 border-t border-white/5">
               <h4 className="text-sm font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Neural Grounding Sources</h4>
               <div className="flex flex-wrap gap-2">
                 {sources.slice(0, 6).map((src, i) => {
                    let domain = 'Intelligence Edge';
                    try { domain = new URL(src).hostname.replace('www.','').toUpperCase(); } catch(e){}
                    return (
                      <motion.a 
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(99, 102, 241, 0.15)" }}
                        key={i} 
                        href={src} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-2 text-indigo-400/80 bg-indigo-500/5 border border-indigo-500/10 px-3 py-1.5 rounded-lg text-xs font-black tracking-tighter hover:text-indigo-300 transition-all"
                      >
                        <ExternalLink size={10} /> {domain}
                      </motion.a>
                    )
                 })}
               </div>
            </div>
        )}
      </div>
    </div>
  );
}
