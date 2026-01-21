import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

function Leaderboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState([]);
    const [type, setType] = useState('player'); // 'player' | 'team'
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // Current Month YYYY-MM
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLeaderboard();
    }, [type, month]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/leaderboard?type=${type}&month=${month}`);
            setStats(res.data || []);
        } catch (err) {
            console.error(err);
            setStats([]);
        }
        setLoading(false);
    };

    const top5 = stats.slice(0, 5);
    
    // Generate Month Options (Last 12 Months + Next 12 Months)
    const monthOptions = [];
    const d = new Date();
    d.setMonth(d.getMonth() - 6); // Start 6 months back
    for(let i=0; i<18; i++) {
        const val = d.toISOString().slice(0, 7);
        const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        monthOptions.push({ val, label });
        d.setMonth(d.getMonth() + 1);
    }

    return (
        <div className="flex flex-col h-screen bg-[#0a0a0f] text-white">
             {/* Header */}
             <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#15151e]">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white">← Back</button>
                    <h1 className="text-2xl font-black tracking-wide">🏆 LEADERBOARDS</h1>
                </div>
                
                <div className="flex gap-4">
                    <select 
                        value={month} 
                        onChange={(e) => setMonth(e.target.value)}
                        className="bg-black/50 border border-white/20 rounded px-4 py-2 text-sm outline-none"
                    >
                        {monthOptions.map(opt => (
                            <option key={opt.val} value={opt.val}>{opt.label}</option>
                        ))}
                    </select>

                    <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
                        <button 
                            onClick={() => setType('player')}
                            className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${type === 'player' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            PLAYERS
                        </button>
                        <button 
                             onClick={() => setType('team')}
                             className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${type === 'team' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            TEAMS
                        </button>
                    </div>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-8">
                 {/* CHARTS SECTION */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                     <div className="bg-[#15151e] p-6 rounded-2xl border border-white/5">
                         <h3 className="font-bold text-slate-400 mb-6 uppercase text-xs tracking-widest">Top Fraggers (Kills)</h3>
                         <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={top5}>
                                    <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} />
                                    <YAxis stroke="#666" fontSize={10} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="kills" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                                        {top5.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#8b5cf6'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                     </div>

                     <div className="bg-[#15151e] p-6 rounded-2xl border border-white/5">
                         <h3 className="font-bold text-slate-400 mb-6 uppercase text-xs tracking-widest">Top Damage Dealers</h3>
                         <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={top5}>
                                    <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} />
                                    <YAxis stroke="#666" fontSize={10} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="damage" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                     </div>
                 </div>

                 {/* DETAILED TABLE */}
                 <div className="bg-[#15151e] rounded-2xl border border-white/5 overflow-hidden">
                     <table className="w-full text-left border-collapse">
                         <thead>
                             <tr className="border-b border-white/10 text-xs text-slate-500 uppercase tracking-widest bg-black/20">
                                 <th className="p-4 font-bold">Rank</th>
                                 <th className="p-4 font-bold">Name</th>
                                 <th className="p-4 font-bold text-right">Matches</th>
                                 <th className="p-4 font-bold text-right">Kills</th>
                                 <th className="p-4 font-bold text-right">Damage</th>
                                 <th className="p-4 font-bold text-right">KD Ratio</th>
                             </tr>
                         </thead>
                         <tbody>
                             {stats.map((s, idx) => (
                                 <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                     <td className="p-4 font-mono text-slate-400">#{idx + 1}</td>
                                     <td className="p-4 font-bold text-white flex items-center gap-2">
                                         {idx === 0 && '👑'} 
                                         {s.name}
                                     </td>
                                     <td className="p-4 text-right text-slate-400">{s.matches}</td>
                                     <td className="p-4 text-right font-bold text-emerald-400">{s.kills}</td>
                                     <td className="p-4 text-right font-bold text-yellow-500">{s.damage}</td>
                                     <td className="p-4 text-right text-slate-400">
                                         {(s.kills / (s.matches || 1)).toFixed(1)}
                                     </td>
                                 </tr>
                             ))}
                             {stats.length === 0 && (
                                 <tr>
                                     <td colSpan="6" className="p-8 text-center text-slate-500">
                                         No stats available for this month.
                                     </td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                 </div>
             </div>
        </div>
    );
}

export default Leaderboard;