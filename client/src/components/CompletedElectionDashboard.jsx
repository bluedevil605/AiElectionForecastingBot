import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Share2, Lightbulb, X, ShieldCheck, Trophy, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';
import PartyLogo from './PartyLogo';

const getPartyColor = (party) => {
    const p = party?.toLowerCase() || '';
    if (p.includes('republican') || p === 'r') return '#ef4444';
    if (p.includes('democrat') || p === 'd') return '#3b82f6';
    return '#8b5cf6';
};

const getPartyColorFaded = (party) => {
    const p = party?.toLowerCase() || '';
    if (p.includes('republican') || p === 'r') return 'rgba(239, 68, 68, 0.05)';
    if (p.includes('democrat') || p === 'd') return 'rgba(59, 130, 246, 0.05)';
    return 'rgba(139, 92, 246, 0.05)';
};

// Unused historical sets stripped.

export default function CompletedElectionDashboard({ forecastData, query }) {
  const result = forecastData.actual_result;
  const rawCandidates = forecastData.candidates || [];
  
  const candidates = [...rawCandidates].sort((a, b) => {
    // Put the winner first
    const winnerName = result?.winner_name?.toLowerCase() || '';
    const winnerParty = result?.winner_party?.toLowerCase() || result?.winning_party?.toLowerCase() || '';
    
    const aIsWinner = (a.name?.toLowerCase() === winnerName) || (a.party?.toLowerCase() === winnerParty);
    const bIsWinner = (b.name?.toLowerCase() === winnerName) || (b.party?.toLowerCase() === winnerParty);
    
    if (aIsWinner && !bIsWinner) return -1;
    if (bIsWinner && !aIsWinner) return 1;
    
    // Otherwise sort by projected vote share
    const shareA = a.projected_vote_share ?? a.projectedVoteShare ?? 0;
    const shareB = b.projected_vote_share ?? b.projectedVoteShare ?? 0;
    return shareB - shareA;
  });
  
  const winnerColor = getPartyColor(result?.winner_party);
  const isGOP = result?.winner_party?.toLowerCase().includes('republican');

  const [voteCount, setVoteCount] = useState(0);
  const [marginCount, setMarginCount] = useState(0);
  const [electoralCount, setElectoralCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [showSticky, setShowSticky] = useState(true);
  
  const match = query?.match(/(\d{4})/);

  useEffect(() => {
     confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: isGOP ? ['#ef4444', '#f87171', '#ffffff'] : ['#3b82f6', '#60a5fa', '#ffffff'],
        disableForReducedMotion: true
     });

      let frame = 0;
      const animate = () => {
          frame++;
          const progress = Math.min(frame / 80, 1);
          setVoteCount(progress * (result?.vote_share || result?.voter_mandate || 0));
          setMarginCount(progress * (parseFloat(result?.margin) || parseFloat(result?.power_margin) || 0));
          
          let seatsWon = result?.seat_count?.won || result?.seat_count;
          let totalSeats = result?.seat_count?.total || 243;
          if (typeof seatsWon === 'object' && !seatsWon.won) {
              seatsWon = Object.values(seatsWon).reduce((a, b) => a + b, 0);
          }
          const rawElectoral = seatsWon || (isGOP ? 312 : 202);
          setElectoralCount(Math.floor(progress * rawElectoral));
          if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);

      const handleScroll = () => setScrolled(window.scrollY > 400);
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
   }, [result, isGOP]);

   const handleShare = () => {
       const text = `🗳️ ${query} Result\nWinner: ${result?.winner_name}\nVote Share: ${result?.vote_share}%\nSeats: ${electoralCount}\n#ElectIQ #ElectionResults`;
       navigator.clipboard.writeText(text);
       alert('Intel copied to neural link.');
   };

   const SectionHeader = ({ title, icon: Icon }) => (
       <h3 className="text-sm font-black text-slate-500 tracking-[0.3em] uppercase mb-8 flex items-center gap-2">
         {Icon && <Icon size={14} className="text-indigo-500" />} {title}
       </h3>
   );

   const displayYear = forecastData.election_date?.match(/\d{4}/)?.[0] || query?.match(/\d{4}/)?.[0] || '2024';

   return (
     <div className="flex flex-col gap-12 animate-fade-in pb-24 w-full relative">
       <AnimatePresence>
         {scrolled && showSticky && (
           <motion.div 
             initial={{ y: -100, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             exit={{ y: -100, opacity: 0 }}
             className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5 shadow-2xl"
           >
              <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center font-black text-white text-lg shadow-inner" style={{backgroundColor: winnerColor}}>
                         {result?.winner_name?.charAt(0) || result?.winner_party?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                         <span className="text-base font-black text-white tracking-tight leading-none mb-1 uppercase">{result?.winner_name} DOMINANCE</span>
                         <div className="flex items-center gap-3">
                             <span className="text-sm font-bold text-slate-400 tabular-nums">{result?.vote_share || result?.voter_mandate || '0.0'}% AGGREGATE</span>
                             <div className="w-1 h-1 bg-slate-700 rounded-full" />
                             <span className="text-sm font-bold text-slate-400 tabular-nums">{electoralCount} SEATS</span>
                         </div>
                      </div>
                  </div>
                  <button onClick={() => setShowSticky(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-500 transition-colors">
                     <X size={18} />
                  </button>
              </div>
           </motion.div>
         )}
       </AnimatePresence>

       <div className="flex justify-between items-end">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
             <div className="flex items-center gap-4 mb-2">
               <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{query} REPORT</h2>
               <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 text-sm font-black uppercase tracking-widest rounded-xl border border-emerald-500/20 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                 <ShieldCheck size={14} /> CERTIFIED INTELLIGENCE
               </div>
             </div>
             <p className="text-slate-500 font-bold text-sm uppercase tracking-[0.2em] ml-1">Archive Node: 0x9482-CERT</p>
          </motion.div>
          <div className="flex gap-3">
             <button className="px-5 py-2.5 flex items-center gap-2 bg-white/5 hover:bg-white/10 text-sm font-black uppercase tracking-widest text-white rounded-xl border border-white/5 transition-all" onClick={handleShare}>
                <Share2 size={14}/> EXPORT INTEL
             </button>
          </div>
       </div>

       {/* WINNER HERO BANNER */}
       <motion.div 
         initial={{ y: 30, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ delay: 0.2 }}
         className="relative overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl glass-panel-heavy"
       >
          <div className="absolute inset-0 opacity-20 bg-noise pointer-events-none" />
          <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${winnerColor} 0%, transparent 60%)`}} />
          
          <div className="relative p-10 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-12">
             <div className="flex flex-col md:flex-row items-center gap-10">
                 <motion.div 
                   initial={{ scale: 0.8 }}
                   animate={{ scale: 1 }}
                 >
                     <PartyLogo partyName={result?.winner_party} candidateInfo={candidates[0]} size="large" />
                 </motion.div>
                 <div className="text-center md:text-left">
                    <div className="flex flex-col gap-2 mb-4">
                       <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-indigo-400 text-sm font-black uppercase tracking-[0.5em] drop-shadow-md">Victory Secured</motion.span>
                       <h2 
                         className="text-6xl lg:text-8xl font-black tracking-tighter leading-none uppercase drop-shadow-[0_0_25px_rgba(255,255,255,0.3)] text-white"
                       >
                         {result?.winner_name}
                       </h2>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-3">
                       <span className="px-4 py-1.5 bg-white/5 text-white text-sm font-black uppercase tracking-[0.2em] rounded-xl border border-white/10 shadow-lg" style={{ color: winnerColor }}>
                         {result?.winner_party}
                       </span>
                       <div className="w-2 h-2 rounded-full bg-slate-800" />
                       <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">Election Cycle {displayYear}</span>
                    </div>
                 </div>
             </div>

             <div className="flex flex-col sm:flex-row gap-8 bg-black/40 p-8 lg:p-10 rounded-[2rem] border border-white/5 backdrop-blur-3xl shadow- inner shrink-0 min-w-[320px]">
                 <div className="text-center sm:text-left">
                    <p className="text-sm uppercase font-black text-slate-500 tracking-[0.2em] mb-2">Voter Mandate</p>
                    <p className="text-5xl font-black tabular-nums tracking-tighter" style={{ color: winnerColor }}>{voteCount.toFixed(1)}%</p>
                 </div>
                 <div className="w-px bg-white/5 hidden sm:block" />
                 <div className="text-center sm:text-left">
                    <p className="text-sm uppercase font-black text-slate-500 tracking-[0.2em] mb-2">Power Margin</p>
                    <p className="text-5xl font-black text-white tabular-nums tracking-tighter">+{marginCount.toFixed(1)}%</p>
                 </div>
                 <div className="w-px bg-white/5 hidden sm:block" />
                 <div className="text-center sm:text-left">
                    <p className="text-sm uppercase font-black text-slate-500 tracking-[0.2em] mb-2">Assembly Seats</p>
                    <p className="text-5xl font-black text-slate-200 tabular-nums tracking-tighter">
                        {Math.floor(electoralCount)}
                        <span className="text-sm text-slate-500 ml-2 font-black">/ {result?.seat_count?.total || 243}</span>
                    </p>
                 </div>
             </div>
         </div>
      </motion.div>

      {/* STAT CARDS & CHARTS STRIPPED */}

      {/* FINAL TABLE GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 w-full">
         <motion.div 
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.9 }}
           className="xl:col-span-8 bg-black/20 border border-white/5 rounded-[2rem] p-10 shadow-xl flex flex-col overflow-hidden"
         >
            <SectionHeader title="CERTIFIED SEGMENTATION ARCHIVE" icon={ShieldCheck} />
            <div className="overflow-x-auto">
               <table className="w-full text-left text-base border-collapse min-w-[800px]">
                  <thead>
                     <tr className="border-b border-white/5 text-xs tracking-[0.3em] uppercase text-slate-500">
                        <th className="py-5 pl-6 font-black w-14">Logo</th>
                        <th className="py-5 font-black">Entity</th>
                        <th className="py-5 font-black text-center">Node</th>
                        <th className="py-5 font-black text-right">Aggregate %</th>
                        <th className="py-5 font-black text-right">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {candidates.map((c, i) => {
                        const isWinner = i === 0;
                        return (
                           <tr key={i} className="group hover:bg-white/5 transition-all">
                              <td className="py-6 pl-6">
                                  <PartyLogo partyName={c.party} candidateInfo={c} size="small" />
                              </td>
                              <td className="py-6">
                                  <div className="flex items-center gap-4">
                                      <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: getPartyColor(c.party)}} />
                                      <span className="font-black text-white text-base tracking-tight uppercase">{c.name}</span>
                                  </div>
                              </td>
                              <td className="py-6 text-center">
                                  <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-xs font-black tracking-widest text-slate-400 group-hover:text-indigo-400 transition-colors uppercase">{c.party}</span>
                              </td>
                              <td className="py-6 font-black text-white text-right tabular-nums text-lg">{c.projectedVoteShare || c.projected_vote_share || '--'}%</td>
                              <td className="py-6 pr-6 text-right">
                                 {isWinner ? (
                                    <div className="flex justify-end">
                                        <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">VICTORY</div>
                                    </div>
                                 ) : (
                                    <div className="flex justify-end opacity-40">
                                        <div className="px-4 py-1.5 bg-slate-500/10 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/5">CONCEDED</div>
                                    </div>
                                 )}
                              </td>
                           </tr>
                        )
                     })}
                  </tbody>
               </table>
            </div>

            {/* Swing Regions Table */}
            <div className="mt-12 pt-8 border-t border-white/5">
               <SectionHeader title="KEY SWING SEGMENTS" icon={Layers} />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(forecastData.swing_factors || []).map((sf, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-4 flex justify-between items-center border border-white/5">
                       <span className="text-sm font-bold text-slate-300">{sf.factor}</span>
                       <span className="text-xs font-black text-indigo-400">IMPACT: {sf.impact}/10</span>
                    </div>
                  ))}
               </div>
            </div>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 1.0 }}
           className="xl:col-span-4 flex flex-col gap-6"
         >
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] p-8 shadow-xl flex-1 backdrop-blur-md">
               <h3 className="text-sm font-black text-indigo-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Lightbulb size={14} className="text-indigo-400" /> HISTORICAL ARCHIVE
               </h3>
               <div className="space-y-6">
                  <p className="text-sm font-bold text-indigo-200/70 leading-relaxed italic">
                     "{forecastData.historical_context || "No historical baseline retrieved for this node."}"
                  </p>
                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                     <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Primary Drivers</h4>
                     <ul className="space-y-2">
                        {(forecastData.key_issues || []).map((issue, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-300">
                             <div className="w-1 h-1 bg-indigo-500 rounded-full" /> {issue}
                          </li>
                        ))}
                     </ul>
                  </div>
               </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] shadow-2xl">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Neural Summary</h4>
                <p className="text-sm font-bold text-slate-300 leading-relaxed">
                   {forecastData.explanation?.summary || forecastData.forecast_summary}
                </p>
            </div>
         </motion.div>
      </div>

    </div>
  );
}
