import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QRCode from "react-qr-code"; 
import Footer from '../components/Footer';

const GAME_ASSETS = {
  "BGMI": {
    color: "from-yellow-600 to-orange-600",
    banner: "/bgmi.jpg", 
    icon: "🔫"
  },
  "Free Fire": {
    color: "from-orange-600 to-red-600",
    banner: "/freefire.jpg",
    icon: "🔥"
  },
  "COD Mobile": {
    color: "from-slate-700 to-slate-900",
    banner: "/cod.jpg",
    icon: "🪖"
  }
};

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // Data State
  const [tournaments, setTournaments] = useState([]);
  const [selectedGame, setSelectedGame] = useState('All');
  
  // Modal State
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  
  // Form State
  const [teamName, setTeamName] = useState('');
  const [teamSize, setTeamSize] = useState('Solo');
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [playerNames, setPlayerNames] = useState(["", "", "", ""]); // Max 4
  
  const currentTournament = tournaments.find(t => t.id === selectedTournamentId);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tournaments`);
      setTournaments(Array.isArray(res.data) ? res.data : []);
    } catch (error) { 
      console.error("Failed to fetch tournaments:", error); 
      setTournaments([]);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const openJoinModal = (tId) => {
    const t = tournaments.find(x => x.id === tId);
    setSelectedTournamentId(tId);
    setTeamName(''); 
    // Auto-set team size based on tournament format if possible, or default to Solo
    const formatSize = t.format.includes('Squad') ? 'Squad' : t.format.includes('Duo') ? 'Duo' : 'Solo';
    setTeamSize(formatSize);
    
    setTransactionId('');
    setPlayerNames([currentUser?.displayName || '', '', '', '']); // Auto-fill captain
    setJoinModalOpen(true);
  };

  const submitJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate empty player names for team size
    const requiredSlots = teamSize === 'Solo' ? 1 : teamSize === 'Duo' ? 2 : 4;
    const finalPlayers = playerNames.slice(0, requiredSlots);
    if (finalPlayers.some(p => !p.trim())) {
        alert(`Please fill in all ${requiredSlots} player names.`);
        setLoading(false);
        return;
    }

    try {
      await axios.post(`${API_URL}/api/join-tournament`, {
        tournamentId: selectedTournamentId,
        userEmail: currentUser.email,
        teamName: teamName,
        teamSize: teamSize,
        transactionId: transactionId,
        players: finalPlayers
      });
      
      alert("Registration Successful! Good luck, Commander.");
      setJoinModalOpen(false);
      fetchTournaments(); // Refresh data
    } catch (error) {
      alert("Failed to join: " + error.message);
    }
    setLoading(false);
  };

  // Filter Logic
  const filteredTournaments = selectedGame === 'All' 
    ? tournaments 
    : tournaments.filter(t => t.game === selectedGame);

  return (
    <div className="flex h-screen bg-[#0a0a0f] font-sans text-white overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#15151e] border-r border-white/5 flex flex-col p-6 hidden md:flex z-20 shadow-2xl">
        <div className="mb-10 flex items-center gap-3">
          <div className="h-8 w-1 bg-violet-600 rounded-full"></div>
          <h1 className="text-2xl font-black tracking-widest">NEXUS<span className="text-violet-600">.</span></h1>
        </div>
        <nav className="flex-1 space-y-2">
          <button onClick={() => navigate('/')} className="w-full text-left px-4 py-3 rounded-xl bg-violet-600/10 text-violet-400 border border-violet-600/20 font-bold transition-all">⚔️ Arena</button>
          <button onClick={() => navigate('/leaderboard')} className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-slate-400 hover:text-white">🏆 Leaderboard</button>
          <button onClick={() => navigate('/profile')} className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-slate-400 hover:text-white">👤 My Profile</button>
        </nav>
        <div className="pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white border-2 border-violet-500 shadow-lg">
                {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{currentUser?.displayName || 'Gamer'}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full py-2 border border-violet-500/30 text-violet-400 rounded-xl hover:bg-violet-600 hover:text-white transition-all text-sm font-bold">LOGOUT</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-0 md:p-8 overflow-y-auto relative scroll-smooth">
        
        {/* TOP NAV / TABS */}
        <div className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl py-4 md:py-6 border-b border-white/5 mb-6">
            <div className="flex items-center gap-3 overflow-x-auto px-4 md:px-0 no-scrollbar">
                <button 
                  onClick={() => setSelectedGame('All')} 
                  className={`relative h-11 px-6 rounded-xl font-bold text-sm tracking-wide whitespace-nowrap transition-all duration-300 border flex items-center justify-center gap-2 ${
                    selectedGame === 'All' 
                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                    : 'bg-[#15151e] text-slate-400 border-white/5 hover:bg-[#1e1e2a] hover:border-white/10 hover:text-white'
                  }`}
                >
                    ALL GAMES
                </button>
                
                {Object.keys(GAME_ASSETS).map(game => (
                    <button 
                      key={game} 
                      onClick={() => setSelectedGame(game)} 
                      className={`relative h-11 px-6 rounded-xl font-bold text-sm tracking-wide whitespace-nowrap transition-all duration-300 border flex items-center justify-center gap-2 overflow-hidden ${
                        selectedGame === game 
                        ? 'text-white border-transparent shadow-lg' 
                        : 'bg-[#15151e] text-slate-400 border-white/5 hover:bg-[#1e1e2a] hover:border-white/10 hover:text-white'
                      }`}
                    >
                        {selectedGame === game && (
                            <div className={`absolute inset-0 bg-gradient-to-r ${GAME_ASSETS[game].color}`}></div>
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                             <span className="text-lg leading-none">{GAME_ASSETS[game].icon}</span> {game}
                        </span>
                    </button>
                ))}
            </div>
        </div>

        <div className="p-4 md:p-0">
            {/* GAME BANNER SECTION */}
            {selectedGame !== 'All' && (
                <div className="w-full relative rounded-2xl overflow-hidden mb-8 group shadow-2xl animate-fade-in border border-white/10 bg-[#15151e]">
                    <div className="relative w-full h-[200px] md:h-[320px]">
                        {/* Placeholder for real image: In production, user will put bgmi.png etc in public folder */}
                        <img 
                        src={GAME_ASSETS[selectedGame].banner} 
                        onError={(e) => {e.target.style.display='none'}} // Hide if not found
                        className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" 
                        alt={selectedGame} 
                        />
                        
                        {/* Gradient Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${GAME_ASSETS[selectedGame].color} opacity-10 mix-blend-overlay`}></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent"></div>
                    </div>
                    
                    {/* Text Content */}
                    <div className="absolute bottom-6 left-6 md:left-10 z-10 w-full pr-10">
                        <div className="flex items-center gap-2 mb-2">
                             <span className="bg-white/20 backdrop-blur px-3 py-1 rounded text-xs font-bold uppercase tracking-widest text-white border border-white/20">Official Tournaments</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-2xl">
                            {selectedGame} <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Series</span>
                        </h2>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <header className="mb-6 flex justify-between items-end">
              <div>
                 <h2 className="text-2xl font-bold">{selectedGame === 'All' ? 'Trending' : selectedGame} <span className="text-violet-500">Events</span></h2>
                 <p className="text-slate-400 text-sm">Join the battle and prove your worth.</p>
              </div>
              <div className="text-xs font-bold bg-white/5 px-3 py-1 rounded text-slate-400 border border-white/5">
                  {filteredTournaments.length} Active Events
              </div>
            </header>

            {/* TOURNAMENT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {filteredTournaments.length > 0 ? filteredTournaments.map((t) => {
                // Handle multiple entries (e.g. Rejected then Pending)
                const myParticipations = t.participants?.filter(p => p.email === currentUser.email) || [];
                const myParticipation = myParticipations.find(p => p.paymentStatus === 'Verified') 
                                     || myParticipations.find(p => p.paymentStatus === 'Pending Verification')
                                     || myParticipations.find(p => p.paymentStatus === 'Rejected');

                const isJoined = !!myParticipation;
                const isPending = myParticipation?.paymentStatus === "Pending Verification";
                const isRejected = myParticipation?.paymentStatus === "Rejected";
                const validParticipantCount = t.participants?.filter(p => p.paymentStatus !== "Rejected")?.length || 0;
                const isFull = validParticipantCount >= parseInt(t.maxSlots || 100);

                return (
                <div key={t.id} className="group relative bg-[#15151e] border border-white/5 rounded-2xl overflow-hidden hover:border-violet-500/50 transition-all hover:shadow-violet-900/20 hover:shadow-lg flex flex-col">
                    <div className={`h-32 bg-gradient-to-br ${GAME_ASSETS[t.game]?.color || 'from-slate-700 to-slate-900'} relative`}>
                        <div className="absolute inset-0 bg-black/20"></div> {/* Darken pattern */}
                        <span className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs font-bold border border-white/10 uppercase tracking-wider">{t.game}</span>
                        <span className="absolute top-4 right-4 text-emerald-400 font-mono font-bold bg-black/80 px-2 py-1 rounded border border-emerald-500/30 shadow-lg shadow-emerald-900/20">₹{t.prize}</span>
                        
                        {/* Map Badge */}
                        <div className="absolute bottom-4 left-4 flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-white/10 backdrop-blur px-2 py-0.5 rounded text-white border border-white/10">{t.map}</span>
                            <span className="text-[10px] font-bold bg-white/10 backdrop-blur px-2 py-0.5 rounded text-white border border-white/10">{t.format}</span>
                        </div>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors line-clamp-1">{t.title}</h3>
                        
                        <div className="flex justify-between items-center text-sm text-slate-400 mb-6 bg-black/20 p-3 rounded-lg border border-white/5">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-slate-500">Kickoff</span>
                                <span className="font-bold text-slate-300">{t.date} @ {t.time}</span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] uppercase font-bold text-slate-500">Slots</span>
                                <span className={`font-bold ${isFull ? 'text-red-500' : 'text-slate-300'}`}>
                                    {validParticipantCount} / {t.maxSlots}
                                </span>
                            </div>
                        </div>

                        <div className="mt-auto space-y-2">
                            {isJoined ? (
                                <button 
                                  disabled={!isRejected} 
                                  onClick={isRejected ? () => openJoinModal(t.id) : undefined}
                                  className={`w-full py-3 rounded-xl font-bold border flex items-center justify-center gap-2 ${
                                  isPending 
                                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50 cursor-default' 
                                      : isRejected 
                                        ? 'bg-red-500/10 text-red-500 border-red-500/50 hover:bg-red-500/20 cursor-pointer'
                                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50 cursor-default'
                                  }`}
                                >
                                {isPending ? <span>⏳ Verifying...</span> : isRejected ? <span>❌ REJECTED (Re-apply)</span> : <span>✓ REGISTERED</span>}
                                </button>
                            ) : (
                                <button 
                                onClick={() => isFull ? alert("Tournament Full!") : openJoinModal(t.id)}
                                disabled={isFull}
                                className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${
                                    isFull 
                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20 cursor-not-allowed shadow-none'
                                    : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-900/20'
                                }`}
                                >
                                {isFull ? '🚫 FULL' : '⚔ JOIN NOW'}
                                </button>
                            )}
                            
                            <button 
                                onClick={() => navigate(`/tournament/${t.id}`)}
                                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold transition-all text-xs uppercase tracking-wider border border-white/5 hover:border-white/20"
                            >
                                View Details / Brackets
                            </button>
                        </div>
                    </div>
                </div>
                );
            }) : (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                    <div className="text-5xl mb-4 opacity-20">🎮</div>
                    <h3 className="text-xl font-bold text-slate-300">No Tournaments Found</h3>
                    <p className="text-slate-500 mt-2">There are no active {selectedGame} events right now.</p>
                </div>
            )}
            </div>
        </div>

        {/* --- PAYMENT & REGISTRATION MODAL --- */}
        {joinModalOpen && currentTournament && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-[#15151e] border border-violet-500/30 w-full max-w-lg rounded-2xl p-0 shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col">
              
              <div className="p-6 border-b border-white/10 bg-black/20">
                  <h3 className="text-2xl font-black text-white">Join <span className="text-violet-500">Events</span></h3>
                  <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mt-1">{currentTournament.title}</p>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form onSubmit={submitJoin} className="space-y-6">

                    {/* Payment Section */}
                    {currentTournament.entryFee && currentTournament.entryFee !== 'Free' && (
                    <div className="bg-gradient-to-br from-indigo-900/20 to-violet-900/20 p-6 rounded-2xl border border-violet-500/30 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-violet-300 uppercase mb-4 tracking-widest">Entry Fee Required</p>

                            {/* QR Code Display */}
                            <div className="bg-white p-3 rounded-xl mx-auto w-fit mb-4 shadow-xl shadow-black/50">
                            <QRCode 
                                value={`upi://pay?pa=nikhilchaudhary386@okhdfcbank&pn=NexusEsports&am=${currentTournament.entryFee.replace(/\D/g,'')}&cu=INR`}
                                size={140}
                            />
                            </div>
                            
                            <p className="text-sm text-slate-300 mb-2">Scan & Pay <span className="text-white font-black text-lg">₹{currentTournament.entryFee.replace(/\D/g,'')}</span></p>
                            
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <span className="bg-black/40 px-3 py-1 rounded text-xs text-slate-400 font-mono border border-white/10 select-all">nikhilchaudhary386@okhdfcbank</span>
                            </div>

                            <div className="text-left bg-black/40 p-3 rounded-xl border border-white/10">
                                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Transaction ID (UTR)</label>
                                <input 
                                    type="text" 
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    placeholder="Enter 12-digit UTR..."
                                    className="w-full bg-transparent text-white outline-none font-mono text-sm font-bold placeholder-slate-600"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    )}

                    {/* Team Details */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-1 ml-1">Team Name</label>
                            <input 
                                type="text" 
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="e.g. Phoenix Squad"
                                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-violet-500 outline-none transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-1 ml-1">Roster Details</label>
                            <div className="space-y-2">
                                {Array.from({ length: teamSize === 'Solo' ? 1 : teamSize === 'Duo' ? 2 : 4 }).map((_, i) => (
                                    <div key={i} className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-bold">P{i+1}</span>
                                        <input 
                                            type="text"
                                            value={playerNames[i]}
                                            onChange={(e) => {
                                                const newP = [...playerNames];
                                                newP[i] = e.target.value;
                                                setPlayerNames(newP);
                                            }}
                                            placeholder={i === 0 ? "Captain (You)" : "Player Username"}
                                            className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-violet-500 outline-none transition-colors"
                                            required
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-1 ml-1">Format Selection</label>
                            <div className="grid grid-cols-3 gap-2 bg-[#0a0a0f] p-1 rounded-xl border border-white/10">
                                {['Solo', 'Duo', 'Squad'].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setTeamSize(type)}
                                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                                    teamSize === type 
                                        ? 'bg-violet-600 text-white shadow-lg' 
                                        : 'text-slate-500 hover:text-white'
                                    }`}
                                >
                                    {type}
                                </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={() => setJoinModalOpen(false)}
                            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold border border-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-violet-900/20 active:scale-95 transition-all"
                        >
                            {loading ? 'Processing...' : 'Confirm Registration'}
                        </button>
                    </div>

                </form>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
};

export default Dashboard;
