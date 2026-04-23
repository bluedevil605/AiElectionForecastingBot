import { motion } from 'framer-motion';
import { Smile, Frown, Meh } from 'lucide-react';
import PartyLogo from './PartyLogo';

export default function SentimentMeter({ candidates }) {
  if (!candidates || candidates.length === 0) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
         {candidates.slice(0, 4).map((c, i) => {
            const score = c.sentimentScore || 50;
            const positive = Math.max(0, score - 15);
            const negative = Math.max(0, 100 - score - 15);
            const neutral = 100 - positive - negative;

            return (
              <motion.div 
                key={c.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-black/30 rounded-2xl p-5 flex flex-col justify-center border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors shadow-inner"
              >
                 <div className="flex justify-between items-center mb-4">
                     <div className="flex items-center gap-2">
                        <PartyLogo partyName={c.party} candidateInfo={c} className="w-5 h-5 text-[8px]" />
                        <div className="flex flex-col">
                           <span className="text-white font-black tracking-tight text-lg leading-none mb-1">{c.name}</span>
                           <span className="text-sm font-black text-slate-600 uppercase tracking-widest leading-none">News Momentum</span>
                        </div>
                     </div>
                    <div className={`px-2.5 py-1 rounded-lg font-black text-base tabular-nums border ${score >= 60 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : score <= 40 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]' : 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]'}`}>
                      {score}
                    </div>
                 </div>
                 
                 <div className="w-full h-1.5 flex rounded-full overflow-hidden bg-slate-900 shadow-inner mb-4 ring-1 ring-white/5 ring-inset">
                    <motion.div initial={{width:0}} animate={{width:`${positive}%`}} className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 relative shadow-[0_0_10px_rgba(16,185,129,0.5)]" transition={{duration: 1.5, ease: "circOut"}}>
                       <div className="absolute top-0 right-0 h-full w-[2px] bg-white/40 blur-[1px]" />
                    </motion.div>
                    <motion.div initial={{width:0}} animate={{width:`${neutral}%`}} className="h-full bg-gradient-to-r from-slate-700 to-slate-600" transition={{duration: 1.5, delay: 0.2, ease: "circOut"}}/>
                    <motion.div initial={{width:0}} animate={{width:`${negative}%`}} className="h-full bg-gradient-to-r from-pink-500 to-rose-600 relative shadow-[0_0_10px_rgba(244,63,94,0.5)]" transition={{duration: 1.5, delay: 0.4, ease: "circOut"}}>
                       <div className="absolute top-0 left-0 h-full w-[2px] bg-white/40 blur-[1px]" />
                    </motion.div>
                 </div>
                 
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-emerald-500 text-sm font-black uppercase tracking-widest opacity-80">
                        <Smile size={12} /> {positive.toFixed(0)}%
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm font-black uppercase tracking-widest opacity-80">
                        <Meh size={12} /> {neutral.toFixed(0)}%
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-500 text-sm font-black uppercase tracking-widest opacity-80">
                        <Frown size={12} /> {negative.toFixed(0)}%
                    </div>
                 </div>
              </motion.div>
            )
         })}
      </div>
    </div>
  );
}
