// client/src/pages/BracketManager.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import confetti from "canvas-confetti";
import "../App.css";

function BracketManager() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [bracket, setBracket] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if(Array.isArray(bracket) && bracket.length > 0) {
        const maxRound = Math.max(...bracket.map(m => m.round));
        const finalMatch = bracket.find(m => m.round === maxRound);
        
        if(finalMatch && finalMatch.winner) {
             confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
             });
        }
    }
  }, [bracket]);

  const fetchTournaments = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tournaments`);
      setTournaments(Array.isArray(res.data) ? res.data : []);
    } catch (err) { alert("Error fetching tournaments"); }
  };

  const handleSelectTournament = (t) => {
    setSelectedTournament(t);
    setBracket(t.bracket || []);
  };

  const generateBracket = async () => {
    if (!selectedTournament) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/generate-bracket`, {
        tournamentId: selectedTournament.id,
      });
      alert("Bracket Generated!");
      const res = await axios.get(`${API_URL}/api/tournaments`);
      const updated = res.data.find(x => x.id === selectedTournament.id);
      handleSelectTournament(updated);
    } catch (err) {
      alert("Failed: " + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  const setWinner = async (matchId, winnerName) => {
    if (!window.confirm(`Declare ${winnerName} as winner?`)) return;
    try {
      await axios.post(`${API_URL}/api/update-match`, {
        tournamentId: selectedTournament.id,
        matchId: matchId,
        winner: winnerName
      });
      refreshTournament();
    } catch (err) { alert("Update failed"); }
  };

  const refreshTournament = async () => {
      const res = await axios.get(`${API_URL}/api/tournaments`);
      const updated = res.data.find(x => x.id === selectedTournament.id);
      handleSelectTournament(updated);
  };

  const setBattleRoyaleWinner = async (winnerName) => {
      if(!window.confirm(`Declare ${winnerName} as the GRAND WINNER of the Lobby?`)) return;
      try {
          await axios.post(`${API_URL}/api/set-tournament-winner`, {
              tournamentId: selectedTournament.id,
              winnerName: winnerName
          });
          
          confetti({ particleCount: 200, spread: 200, origin: { y: 0.6 } });
          refreshTournament();
          alert("Winner Declared!");
      } catch (err) { alert("Failed to set lobby winner"); }
  }

  const isBattleRoyale = selectedTournament && (
      (selectedTournament.game === "Free Fire" && selectedTournament.format !== "Clash Squad (4v4)") ||
      (selectedTournament.game === "BGMI" && !selectedTournament.format.includes("Arena") && !selectedTournament.format.includes("TDM")) ||
      (selectedTournament.game === "COD Mobile" && selectedTournament.format.includes("Battle Royale"))
  );

  // Group matches by round for Tree Visualization
  const rounds = Array.isArray(bracket) ? bracket.reduce((acc, match) => {
    acc[match.round] = acc[match.round] || [];
    acc[match.round].push(match);
    return acc;
  }, {}) : {};

  return (
    <div className="animate-fade-in relative z-10 w-full min-h-screen">
      <header className="mb-8">
        <h2 className="text-3xl font-black text-white tracking-tight">Tournament <span className="text-violet-500">Brackets</span></h2>
        <p className="text-slate-400">Visualize match-ups and manage results.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Tournament Selector Sidebar */}
        <div className="lg:col-span-1 space-y-4">
             <div className="bg-[#15151e] border border-white/10 rounded-2xl p-4 shadow-xl">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                   <span className="text-orange-500">🏆</span> Select Event
                </h3>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {tournaments.map(t => (
                        <button 
                         key={t.id} 
                         onClick={() => handleSelectTournament(t)}
                         className={`w-full text-left p-3 rounded-xl border transition-all ${
                             selectedTournament?.id === t.id 
                             ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/20' 
                             : 'bg-black/40 border-white/5 text-slate-400 hover:text-white hover:border-white/20'
                         }`}
                        >
                            <div className="font-bold text-sm truncate">{t.title}</div>
                            <div className="text-[10px] uppercase font-bold mt-1 opacity-70 flex justify-between">
                                <span>{t.game}</span>
                                <span>{t.format}</span>
                            </div>
                        </button>
                    ))}
                </div>
             </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
             {selectedTournament ? (
                 <div className="bg-[#15151e] border border-white/10 rounded-2xl p-6 shadow-xl min-h-[60vh] relative overflow-hidden">
                     {/* Decorative Elements */}
                     <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/5 rounded-full blur-[100px] pointer-events-none"></div>

                     <div className="flex justify-between items-center mb-8 relative z-10">
                        <div>
                            <h3 className="text-2xl font-black text-white">{selectedTournament.title}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                                    isBattleRoyale ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                }`}>
                                    {isBattleRoyale ? 'Lobby / Battle Royale' : 'Elimination Bracket'}
                                </span>
                                {selectedTournament.status === 'Completed' && (
                                    <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">Completed</span>
                                )}
                            </div>
                        </div>

                        {!isBattleRoyale && bracket.length === 0 && (
                             <button onClick={generateBracket} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">
                                 {loading ? 'Generating...' : '🛠 Generate Bracket'}
                             </button>
                        )}
                     </div>

                     {/* BATTLE ROYALE VIEW */}
                     {isBattleRoyale && (
                        <div className="animate-fade-in relative z-10">
                            <div className="text-center p-6 bg-black/40 rounded-xl border border-white/5 mb-6">
                                <h4 className="text-slate-400 text-sm uppercase font-bold mb-2">Victory Stand</h4>
                                {selectedTournament.winner ? (
                                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse">
                                        👑 {selectedTournament.winner} 👑
                                    </div>
                                ) : (
                                    <div className="text-xl text-slate-600 font-bold italic">Winner Undecided</div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Array.isArray(selectedTournament.participants) && selectedTournament.participants.map((p, idx) => {
                                    const pName = typeof p === 'object' ? p.teamName : p;
                                    const isWinner = selectedTournament.winner === pName;
                                    return (
                                        <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${
                                            isWinner 
                                            ? 'bg-yellow-500/10 border-yellow-500/50 shadow-yellow-900/20 shadow-lg' 
                                            : 'bg-black/40 border-white/5 hover:border-white/20'
                                        }`}>
                                            <span className={`font-bold ${isWinner ? 'text-yellow-400' : 'text-white'}`}>{pName}</span>
                                            {!isWinner && !selectedTournament.winner && (
                                                <button onClick={() => setBattleRoyaleWinner(pName)} className="text-xs bg-white/5 hover:bg-emerald-600 hover:text-white text-slate-400 px-3 py-1.5 rounded-lg border border-white/10 transition-all">
                                                    Win
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                     )}

                     {/* BRACKET TREE VIEW */}
                     {!isBattleRoyale && (
                         <div className="flex gap-12 overflow-x-auto pb-8 pt-4 custom-scrollbar relative z-10">
                            {Object.keys(rounds).map((roundNum) => (
                                <div key={roundNum} className="flex flex-col justify-around min-w-[280px] space-y-8">
                                    <div className="text-center text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">
                                        {parseInt(roundNum) === Math.max(...Object.keys(rounds).map(Number)) ? 'Grand Final' : `Round ${roundNum}`}
                                    </div>
                                    {rounds[roundNum].map((match) => (
                                        <div key={match.id} className="relative group">
                                            {/* Connector Lines Logic could be added here later */}
                                            <div className="bg-[#0a0a0f] border border-white/10 rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-[1.02] hover:border-violet-500/30">
                                                <div className="p-3 border-b border-white/5 flex justify-between items-center bg-black/20">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Match {match.id}</span>
                                                    {match.winner && <span className="text-[10px] text-emerald-500 font-bold">Ended</span>}
                                                </div>
                                                <div className="p-2 space-y-1">
                                                    <div 
                                                        onClick={() => !match.winner && setWinner(match.id, match.player1)}
                                                        className={`p-3 rounded-lg flex justify-between items-center cursor-pointer transition-colors ${
                                                            match.winner === match.player1 
                                                            ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/20' 
                                                            : match.player1 === 'BYE'
                                                            ? 'text-slate-600 italic pointer-events-none'
                                                            : 'bg-white/5 hover:bg-white/10 text-slate-300'
                                                        }`}
                                                    >
                                                        <span>{match.player1 || 'TBD'}</span>
                                                        {match.winner === match.player1 && <span>🏆</span>}
                                                    </div>
                                                    
                                                    <div 
                                                        onClick={() => !match.winner && setWinner(match.id, match.player2)}
                                                        className={`p-3 rounded-lg flex justify-between items-center cursor-pointer transition-colors ${
                                                            match.winner === match.player2 
                                                            ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/20' 
                                                            : match.player2 === 'BYE'
                                                            ? 'text-slate-600 italic pointer-events-none'
                                                            : 'bg-white/5 hover:bg-white/10 text-slate-300'
                                                        }`}
                                                    >
                                                        <span>{match.player2 || 'TBD'}</span>
                                                        {match.winner === match.player2 && <span>🏆</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                            {Object.keys(rounds).length === 0 && (
                                <div className="text-center text-slate-500 italic w-full py-20 flex flex-col items-center">
                                    <div className="text-5xl opacity-20 mb-4">⚖</div>
                                    No bracket data. Generate one to start.
                                </div>
                            )}
                         </div>
                     )}

                 </div>
             ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 bg-[#15151e] rounded-2xl border border-white/5 p-10 dashed-border">
                     <div className="text-6xl opacity-20">👈</div>
                     <p className="font-medium text-lg">Select a tournament from the left to manage brackets.</p>
                 </div>
             )}
        </div>

      </div>
    </div>
  );
}

export default BracketManager;
