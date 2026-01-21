import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';
import TournamentChat from '../components/TournamentChat'; // Import Chat Component

const TournamentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    axios.get(`${API_URL}/api/tournament/${id}`)
      .then(res => setTournament(res.data))
      .catch(err => console.error(err));
  }, [id]);

  // 🎉 Confetti Effect for Winner
  useEffect(() => {
    let hasWinner = false;
    if (tournament) {
        if (tournament.winner) {
            hasWinner = true;
        } else if (tournament.bracket && tournament.bracket.length > 0) {
            const maxRound = Math.max(...tournament.bracket.map(m => m.round));
            const finalMatch = tournament.bracket.find(m => m.round === maxRound);
            if (finalMatch && finalMatch.winner) hasWinner = true;
        }
    }

    if(hasWinner) {
            // Fire multiple bursts
            const count = 200;
            const defaults = { origin: { y: 0.7 } };

            function fire(particleRatio, opts) {
                confetti(Object.assign({}, defaults, opts, {
                    particleCount: Math.floor(count * particleRatio)
                }));
            }

            fire(0.25, { spread: 26, startVelocity: 55 });
            fire(0.2, { spread: 60 });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
            fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
            fire(0.1, { spread: 120, startVelocity: 45 });
        }
  }, [tournament]);

  // Helper to detect if this is a Battle Royale style tournament
  const isBattleRoyale = tournament && (
     (tournament.game === "Free Fire" && tournament.format !== "Clash Squad (4v4)") ||
     (tournament.game === "BGMI" && !tournament.format.includes("Arena") && !tournament.format.includes("TDM")) ||
     (tournament.game === "COD Mobile" && tournament.format.includes("Battle Royale"))
  );

  if (!tournament) return <div className="h-screen bg-[#0a0a0f] text-white p-10">Loading Arena...</div>;

  const validParticipants = tournament.participants?.filter(p => p.paymentStatus !== 'Rejected') || [];

  return (
    <div className="h-screen bg-[#0a0a0f] text-white p-8 overflow-y-auto">
      <button onClick={() => navigate('/')} className="mb-6 text-slate-400 hover:text-white">← Back to Dashboard</button>
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-900 to-black rounded-3xl p-10 mb-8 border border-white/10 relative overflow-hidden">
        <h1 className="text-5xl font-black relative z-10">{tournament.title}</h1>
        <p className="text-xl text-violet-300 mt-2 relative z-10">{tournament.game} • {tournament.date}</p>
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-6 py-3 rounded-xl border border-emerald-500/50">
          <p className="text-sm text-slate-400 uppercase">Prize Pool</p>
          <p className="text-3xl font-bold text-emerald-400">₹{tournament.prize}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Info & Rules */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-[#15151e] p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-bold mb-4 text-violet-400">📜 Rules & Format</h3>
            <ul className="list-disc list-inside text-slate-400 space-y-2 text-sm">
              <li>Map: Erangel / Bermuda</li>
              <li>Team Size: Squad (4 Players)</li>
              <li>No Emulators Allowed</li>
              <li>Screenshots required for proof</li>
            </ul>
          </div>
          
          <div className="bg-[#15151e] p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-bold mb-4 text-blue-400">👥 Registered Teams</h3>
            <div className="space-y-2">
              {validParticipants.map((p, i) => (
                <div key={i} className="bg-black/30 p-3 rounded flex justify-between">
                  <span className="font-bold">{p.teamName || 'Unknown'}</span>
                  <span className="text-xs bg-slate-800 px-2 py-1 rounded">{p.teamSize}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CHAT SYSTEM */}
          <TournamentChat tournamentId={id} title={tournament.title} />

        </div>

        {/* Right Column: Bracket System */}
        <div className="lg:col-span-2">
          {isBattleRoyale ? (
             <div className="bg-[#15151e] p-6 rounded-2xl border border-white/10 h-full">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-yellow-400">🪂 Battle Royale Lobby</h3>
                    {tournament.winner && <span className="text-emerald-400 font-bold border border-emerald-500/50 px-3 py-1 rounded bg-emerald-900/20">Winner Declared</span>}
                 </div>

                 {tournament.winner ? (
                     <div className="flex flex-col items-center justify-center py-10 animate-fade-in-up">
                         <div className="text-6xl mb-4">👑</div>
                         <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 mb-2">
                             {tournament.winner}
                         </h2>
                         <p className="text-slate-400 uppercase tracking-widest text-sm">Grand Winner</p>
                         <div className="mt-8 p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-center">
                             <p className="text-xs text-slate-500">Congratulations to the champions!</p>
                         </div>
                     </div>
                 ) : (
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                         {validParticipants.map((p, i) => (
                             <div key={i} className="bg-black/40 border border-slate-800 rounded p-4 text-center">
                                 <div className="font-bold text-white mb-1">{p.teamName || p.email}</div>
                                 <div className="text-xs text-slate-500">Ready to Drop</div>
                             </div>
                         ))}
                     </div>
                 )}
             </div>
          ) : (
          <div className="bg-[#15151e] p-6 rounded-2xl border border-white/10 h-full overflow-x-auto">
            <h3 className="text-xl font-bold mb-6 text-red-400">🏆 Tournament Bracket</h3>
            
            {!tournament.bracket || tournament.bracket.length === 0 ? (
                <div className="flex justify-center items-center h-48 text-slate-500">
                    <p>Bracket has not been generated yet.</p>
                </div>
            ) : (
                <div className="flex gap-12 pb-4 items-center" style={{minWidth: "max-content"}}>
                    {/* Dynamically Render Rounds */}
                    {[...new Set(tournament.bracket.map(m => m.round))].sort((a,b) => a-b).map(round => {
                        const roundMatches = tournament.bracket.filter(m => m.round === round).sort((a,b) => a.id - b.id);
                        return (
                            <div key={round} className="flex flex-col justify-around min-w-[220px]">
                                <h4 className="text-center text-slate-500 text-xs font-bold uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">Round {round}</h4>
                                <div className="flex flex-col justify-center gap-10">
                                    {roundMatches.map(m => (
                                        <div key={m.id} className="relative group">
                                            {/* Connector Dot */}
                                            <div className="absolute -left-3 top-1/2 w-1.5 h-1.5 bg-slate-700 rounded-full un-translate-y-1/2"></div>
                                            
                                            <div className={`bg-[#0a0a0f] border rounded-lg overflow-hidden transition-all duration-300 ${m.winner ? 'border-slate-700 shadow-md' : 'border-slate-800 opacity-80'}`}>
                                               
                                               {/* Player 1 */}
                                               <div className={`flex justify-between items-center px-3 py-2.5 ${m.winner === m.player1 ? 'bg-gradient-to-r from-emerald-900/40 to-transparent' : ''}`}>
                                                   <span className={`text-sm font-medium ${m.winner === m.player1 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                       {m.player1 || <span className="text-slate-600 italic text-xs">Waiting...</span>}
                                                   </span>
                                                   {m.winner === m.player1 && <span className="text-emerald-500 text-xs">✔</span>}
                                               </div>
                                               
                                               <div className="h-px bg-slate-800 w-full"></div>
                                               
                                               {/* Player 2 */}
                                               <div className={`flex justify-between items-center px-3 py-2.5 ${m.winner === m.player2 ? 'bg-gradient-to-r from-emerald-900/40 to-transparent' : ''}`}>
                                                   <span className={`text-sm font-medium ${m.winner === m.player2 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                       {m.player2 || <span className="text-slate-600 italic text-xs">Waiting...</span>}
                                                   </span>
                                                   {m.winner === m.player2 && <span className="text-emerald-500 text-xs">✔</span>}
                                               </div>
                                               
                                            </div>
                                            
                                            {/* Right Connector */}
                                            <div className={`absolute -right-3 top-1/2 w-1.5 h-1.5 rounded-full transform -translate-y-1/2 ${m.winner ? 'bg-emerald-600' : 'bg-slate-700'}`}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}

                    {/* 🏆 CHAMPION COLUMN 🏆 */}
                    {(() => {
                         const maxRound = Math.max(...tournament.bracket.map(m => m.round));
                         const finalMatch = tournament.bracket.find(m => m.round === maxRound);
                         if (finalMatch && finalMatch.winner) {
                             return (
                                 <div className="flex flex-col justify-center items-center min-w-[250px] animate-pulse-slow">
                                     <h4 className="text-center text-yellow-500 text-xs font-bold uppercase tracking-widest mb-6">🏆 CHAMPION</h4>
                                     <div className="bg-gradient-to-b from-yellow-900/20 to-black border border-yellow-500/50 p-6 rounded-xl text-center transform scale-110 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                                         <div className="text-4xl mb-2">👑</div>
                                         <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600">
                                             {finalMatch.winner}
                                         </div>
                                         <div className="text-[10px] text-yellow-500/80 mt-2 uppercase tracking-[0.2em] font-bold">
                                             Grand Winner
                                         </div>
                                     </div>
                                 </div>
                             )
                         }
                         return (
                            <div className="flex flex-col justify-center items-center min-w-[200px] opacity-20">
                                <div className="border border-dashed border-slate-600 p-6 rounded-xl text-center">
                                    <div className="text-2xl mb-2">❓</div>
                                    <div className="text-sm font-bold text-slate-500">TBD</div>
                                </div>
                            </div>
                         );
                    })()}
                </div>
            )}
          </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TournamentDetails;