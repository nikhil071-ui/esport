import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function StatsManager() {
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [inputStats, setInputStats] = useState({});
    const [loading, setLoading] = useState(false);
    
    // Auto-save feedback state
    const [lastSaved, setLastSaved] = useState(null);

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/tournaments`);
            setTournaments(res.data);
        } catch (error) { console.error("Failed to load tournaments"); }
    };

    const handleSelect = (t) => {
        setSelectedTournament(t);
        setInputStats({});
        setLastSaved(null);
    };

    const handleStatChange = (teamName, playerName, field, value) => {
        const key = `${teamName}-${playerName}`;
        setInputStats(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value,
                teamName,
                playerName
            }
        }));
    };

    const submitStats = async () => {
        const statsArray = Object.values(inputStats);
        if (statsArray.length === 0) return alert("All fields are empty.");

        setLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/update-stats`, {
                tournamentId: selectedTournament.id,
                stats: statsArray
            });
            setLastSaved(new Date().toLocaleTimeString());
            // Optional: reset inputs or keep them? Keeping them allows multiple rounds of edits.
            // setInputStats({}); 
            alert("✅ Stats Logged Successfully");
        } catch (err) {
            alert("Error saving stats");
        }
        setLoading(false);
    };

    return (
        <div className="animate-fade-in w-full min-h-[calc(100vh-4rem)]">
             <header className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Match <span className="text-violet-500">Statistics</span></h2>
                    <p className="text-slate-400">Log kills, damage, and performance data.</p>
                </div>
            </header>

            {!selectedTournament ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournaments.length === 0 && <div className="text-slate-500 italic col-span-full text-center py-20">No active tournaments found.</div>}
                    
                    {tournaments.map(t => (
                        <div key={t.id} onClick={() => handleSelect(t)} className="bg-[#15151e] group p-6 rounded-2xl border border-white/5 cursor-pointer hover:border-violet-500/50 hover:shadow-violet-900/20 hover:shadow-lg transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-violet-600/20 transition-all pointer-events-none"></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-10 w-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-xl">
                                        📊
                                    </div>
                                    <span className="text-[10px] font-bold uppercase bg-white/5 text-slate-400 px-2 py-1 rounded border border-white/5">{t.format}</span>
                                </div>
                                
                                <h3 className="font-bold text-white text-lg mb-1">{t.title}</h3>
                                <p className="text-xs text-violet-400 font-bold uppercase tracking-wider mb-4">{t.game}</p>
                                
                                <div className="flex items-center gap-3 text-xs text-slate-500 font-mono border-t border-white/5 pt-3">
                                    <span>👥 {t.participants?.length || 0} Teams</span>
                                    <span>🆔 {t.id.slice(0,6)}...</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="animate-slide-up">
                    {/* Header Bar */}
                    <div className="flex items-center justify-between mb-6 bg-[#15151e] p-4 rounded-2xl border border-white/10 sticky top-0 z-30 shadow-2xl backdrop-blur-md bg-opacity-90">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSelectedTournament(null)} className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all">
                                ←
                            </button>
                            <div>
                                <h3 className="font-bold text-white leading-tight">{selectedTournament.title}</h3>
                                <div className="text-xs text-slate-400">Data Entry Mode</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {lastSaved && <span className="text-emerald-500 text-xs font-bold animate-pulse">Saved at {lastSaved}</span>}
                            <button 
                                onClick={submitStats} 
                                disabled={loading}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                                {loading ? 'Saving...' : '💾 Save All Stats'}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 pb-20">
                        {selectedTournament.participants?.length === 0 && (
                            <div className="text-center py-20 bg-[#15151e] rounded-2xl border-2 border-dashed border-white/10">
                                <div className="text-4xl mb-4 opacity-20">👤</div>
                                <p className="text-slate-500">No participants in this tournament.</p>
                            </div>
                        )}

                        {selectedTournament.participants?.map((team, idx) => (
                            <div key={idx} className="bg-[#15151e] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
                                        {(team.teamName || team.email || '?').charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg">{team.teamName || team.email}</h4>
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Team ID: {idx + 1}</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {(team.players && team.players.length > 0 ? team.players : [team.email || "Player 1"]).map((p, pIdx) => {
                                        const pName = typeof p === 'string' ? p : p.name || `Player ${pIdx+1}`;
                                        const key = `${team.teamName}-${pName}`;
                                        const current = inputStats[key] || { kills: '', damage: '' };

                                        return (
                                            <div key={pIdx} className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                                                <div className="w-1/3 min-w-[80px]">
                                                    <div className="text-sm font-bold text-slate-300 truncate" title={pName}>{pName}</div>
                                                    <div className="text-[10px] text-slate-600 uppercase font-bold mt-1">Player {pIdx + 1}</div>
                                                </div>
                                                
                                                <div className="flex-1 space-y-2">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold uppercase">Kills</span>
                                                        <input 
                                                            type="number" 
                                                            className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg py-2 pl-12 pr-3 text-white text-sm font-bold focus:border-violet-500 outline-none transition-colors text-right"
                                                            placeholder="0"
                                                            value={current.kills}
                                                            onChange={(e) => handleStatChange(team.teamName, pName, 'kills', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold uppercase">Dmg</span>
                                                        <input 
                                                            type="number" 
                                                            className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg py-2 pl-12 pr-3 text-white text-sm font-bold focus:border-violet-500 outline-none transition-colors text-right"
                                                            placeholder="0"
                                                            value={current.damage}
                                                            onChange={(e) => handleStatChange(team.teamName, pName, 'damage', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default StatsManager;
