import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, AlertCircle, Link } from 'lucide-react';
import ReactToPrint from 'react-to-print';
import PartyLogo from './PartyLogo';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b'];

export default function Dashboard({ query, forecast, dashboardRef }) {
  
  if (!forecast) return null;

  const confidenceColor = {
    low: 'text-red-400 bg-red-400/10 border-red-500/20',
    medium: 'text-amber-400 bg-amber-400/10 border-amber-500/20',
    high: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20'
  }[forecast.confidenceLevel?.toLowerCase() || 'medium'];

  return (
    <div className="glass-panel p-6 flex flex-col h-full bg-slate-900 border-slate-700 shadow-2xlprint-dashboard w-full">
      
      <div className="flex justify-between items-start mb-8 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight capitalize">{query} Results</h2>
          <p className="text-slate-400 text-base mt-1">Autonomous Real-Time Web Search Forecast</p>
        </div>
        <ReactToPrint
          trigger={() => (
            <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-base font-medium text-slate-300 hover:text-white transition-colors">
              <Download size={16} /> Export PDF
            </button>
          )}
          content={() => dashboardRef.current}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {forecast.candidates?.map((c, i) => (
          <div key={c.name} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 shadow-inner relative overflow-hidden flex flex-col items-center text-center">
             <div className="absolute top-0 left-0 w-1 h-full" style={{backgroundColor: COLORS[i % COLORS.length]}}/>
             <PartyLogo partyName={c.party} candidateInfo={c} size="medium" className="mb-3" />
             <h4 className="text-base text-slate-400 font-medium mb-1">{c.name}</h4>
             <div className="flex items-end gap-2 mt-2">
               <span className="text-3xl font-bold text-white">{c.winProbability}%</span>
               <span className="text-sm text-slate-500 mb-1 font-medium tracking-wider uppercase">Win Prob</span>
             </div>
             <div className="mt-2 text-base text-slate-300">
               Projected Vote: <strong className="text-white">{c.projectedVoteShare}%</strong>
             </div>
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-[300px] mb-8 relative">
        <h3 className="text-base font-medium tracking-widest text-slate-500 uppercase mb-4">Win Probability Distribution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={forecast.candidates} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} width={150} />
            <Tooltip 
              cursor={{fill: 'rgba(255,255,255,0.05)'}}
              contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px'}}
              itemStyle={{color: '#f8fafc'}}
            />
            <Bar dataKey="winProbability" radius={[0, 6, 6, 0]} barSize={32}>
              {forecast.candidates?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-950/50 p-5 rounded-xl border border-slate-800/50">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h4 className="flex items-center gap-2 text-base font-semibold text-indigo-300 uppercase tracking-wider mb-2">
              <AlertCircle size={16} /> AI Summary
            </h4>
            <p className="text-slate-300 text-base leading-relaxed">
              {forecast.forecastSummary}
            </p>
          </div>
          
          {/* Sources Section */}
          {forecast.sources && forecast.sources.length > 0 && (
            <div className="pt-4 border-t border-slate-800/50">
               <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                 <Link size={14} /> Sources Verified
               </h4>
               <ul className="text-sm text-indigo-400 space-y-1 w-full truncate">
                 {forecast.sources.map((src, i) => (
                   <li key={i} className="truncate">
                     <a href={src} target="_blank" rel="noreferrer" className="hover:underline">{src}</a>
                   </li>
                 ))}
               </ul>
            </div>
          )}
        </div>
        
        <div className="border-t lg:border-t-0 lg:border-l border-slate-800/50 pt-4 lg:pt-0 lg:pl-6 space-y-4">
          <div>
            <span className="block text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Confidence</span>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border capitalize ${confidenceColor}`}>
              {forecast.confidenceLevel}
            </span>
          </div>
          <div>
            <span className="block text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Est. Margin</span>
            <span className="text-lg font-bold text-slate-200">{forecast.marginOfVictoryEstimate}</span>
          </div>
          {forecast.keySwingFactors?.length > 0 && (
            <div>
              <span className="block text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Key Drivers</span>
              <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside bg-slate-900/50 p-2 rounded">
                {forecast.keySwingFactors.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
