import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Transactions from './Transactions';
import BracketManager from './BracketManager';
import StatsManager from './StatsManager'; 
import TournamentChat from '../components/TournamentChat'; 

// --- GAME DATA CONSTANT ---
const GAME_DATA = {
  "BGMI": {
    maps: ["Erangel", "Livik", "Miramar", "Sanhok", "Vikendi", "Karakin", "Nusa", "Warehouse (TDM)", "Ruins (TDM)"],
    modes: [
      "Battle Royale (Squad)", "Battle Royale (Duo)", "Battle Royale (Solo)",
      "Ultimate Arena (4v4)", "Royale Arena: Assault", "Team Deathmatch (4v4)", 
      "Domination", "Gun Game", "WoW Mode"
    ]
  },
  "Free Fire": {
    maps: ["Bermuda", "Bermuda Remastered", "Purgatory", "Kalahari", "Alpine", "NeXTerra", "Iron Dome (Lone Wolf)"],
    modes: [
      "Battle Royale (Squad)", "Battle Royale (Duo)", "Battle Royale (Solo)",
      "Clash Squad (4v4)", "Lone Wolf (1v1)", "Lone Wolf (2v2)", 
      "Bomb Squad (5v5)", "Team Deathmatch", "Big Head", "Zombie Hunt"
    ]
  },
  "COD Mobile": {
    maps: [
      "Isolated (BR)", "Blackout (BR)", "Alcatraz (Tournament)", "Krai (BR)", 
      "Nuketown", "Crash", "Crossfire", "Standoff", "Raid", "Firing Range", "Terminal", "Coastal"
    ],
    modes: [
      "Battle Royale (Squad)", "Battle Royale (Duo)", "Battle Royale (Solo)",
      "Search & Destroy (5v5)", "Payout S&D", "Team Deathmatch", 
      "Frontline", "Domination", "Hardpoint"
    ]
  }
};

const AdminPanel = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // Robust API URL with fallback
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [activeTab, setActiveTab] = useState('tournaments');
  const [tournaments, setTournaments] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [chatTournament, setChatTournament] = useState(null);

  // Initial Form State
  const [formData, setFormData] = useState({ 
    title: '', game: 'BGMI', map: 'Erangel', format: 'Battle Royale (Squad)', 
    prize: '', entryFee: 'Free', date: '', time: '', 
    maxSlots: 100, discordLink: '', qrCodeUrl: '' 
  });

  useEffect(() => {
    fetchTournaments();
    fetchUsers();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/tournaments`);
      setTournaments(Array.isArray(res.data) ? res.data : []);
    } catch (error) { console.error(error); }
  };

  const fetchUsers = async () => {
    try {
      console.log("Fetching users from:", `${API_URL}/api/users`);
      const res = await axios.get(`${API_URL}/api/users`);
      if (Array.isArray(res.data)) {
         setUsers(res.data);
      } else {
         console.warn("API returned non-array for users:", res.data);
      }
    } catch (error) { 
      console.error("Fetch Users Failed:", error); 
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleGameChange = (e) => {
    const selectedGame = e.target.value;
    const defaultMap = GAME_DATA[selectedGame].maps[0];
    const defaultMode = GAME_DATA[selectedGame].modes[0];
    
    setFormData({
      ...formData,
      game: selectedGame,
      map: defaultMap,
      format: defaultMode
    });
  };

  const createTournament = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/create-tournament`, formData);
      setShowForm(false);
      setFormData({ 
        title: '', game: 'BGMI', map: 'Erangel', format: 'Battle Royale (Squad)', 
        prize: '', entryFee: 'Free', date: '', time: '', 
        maxSlots: 100, discordLink: '', qrCodeUrl: '' 
      });
      fetchTournaments();
    } catch (error) { alert("Error creating tournament"); }
    setLoading(false);
  };

  const deleteTournament = async (id) => {
    if(!window.confirm("Delete this tournament permanently?")) return;
    try {
      await axios.delete(`${API_URL}/api/tournament/${id}`);
      fetchTournaments();
    } catch (error) { console.error(error); }
  };

  const verifyPayment = async (participant, action) => {
    if(!selectedTournament) return;
    if(!window.confirm(`${action} payment for ${participant.email}?`)) return;

    try {
        await axios.post(`${API_URL}/api/verify-player`, { 
            tournamentId: selectedTournament.id,
            userEmail: participant.email,
            transactionId: participant.transactionId,
            action 
        });
        alert(`Request ${action === 'Approve' ? 'Approved' : 'Rejected'} Successfully!`);
        
        // Optimistic UI Update
        let updatedParticipants;
        if (action === 'Reject') {
           // Remove from list
           updatedParticipants = selectedTournament.participants.filter(p => p.transactionId !== participant.transactionId);
        } else {
           // Update Status
           updatedParticipants = selectedTournament.participants.map(p => {
              if (p.transactionId === participant.transactionId) {
                  return { ...p, paymentStatus: 'Verified' };
              }
              return p;
           });
        }

        setSelectedTournament({ ...selectedTournament, participants: updatedParticipants });
        fetchTournaments();
    } catch (e) {
        console.error(e);
        alert("Action Failed");
    }
  };

  const NavItem = ({ label, id, icon }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full text-left px-4 py-3 rounded-xl mb-2 flex items-center gap-3 transition-all font-medium relative overflow-hidden group ${
        activeTab === id 
        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/20' 
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className="relative z-10 text-lg">{icon}</span>
      <span className="relative z-10 font-bold tracking-wide text-sm">{label}</span>
      {activeTab === id && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity"></div>}
    </button>
  );

  return (
    <div className="flex h-screen bg-[#0a0a0f] font-sans text-slate-200 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#15151e] border-r border-white/5 flex flex-col p-6 shadow-2xl z-20">
        <div className="mb-10 flex items-center gap-3 px-2">
           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg ring-2 ring-violet-500/30">N</div>
           <div>
              <h1 className="text-xl font-black text-white tracking-widest leading-none">NEXUS</h1>
              <p className="text-[10px] uppercase font-bold text-violet-500 tracking-[0.2em]">Admin Console</p>
           </div>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem id="dashboard" label="Overview" icon="📊" />
          <NavItem id="tournaments" label="Tournaments" icon="🏆" />
          <NavItem id="brackets" label="Brackets" icon="⚔️" />
          <NavItem id="stats" label="Match Stats" icon="📈" />
          <NavItem id="transactions" label="Payments" icon="💳" />
          <NavItem id="users" label="User Base" icon="👥" />
        </nav>

        <div className="pt-6 border-t border-white/5 mt-auto">
          <button onClick={handleLogout} className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all text-sm font-bold flex items-center justify-center gap-2">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto relative scroll-smooth">
        {/* Decorative BG */}
        <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent pointer-events-none"></div>
        
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in space-y-8 relative z-10">
             <header>
               <h2 className="text-3xl font-black text-white tracking-tight">Dashboard <span className="text-violet-500">Overview</span></h2>
               <p className="text-slate-400">Welcome back, Commander.</p>
             </header>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                 { label: 'Total Users', value: users.length, icon: '👥', color: 'bg-blue-500' },
                 { label: 'Active Events', value: tournaments.length, icon: '🔥', color: 'bg-orange-500' },
                 { label: 'System Health', value: '100%', icon: '❤️', color: 'bg-emerald-500' }
               ].map((stat, idx) => (
                 <div key={idx} className="bg-[#15151e] p-6 rounded-2xl border border-white/5 shadow-xl hover:translate-y-[-2px] transition-transform">
                   <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-xl ${stat.color}/20 flex items-center justify-center text-2xl`}>{stat.icon}</div>
                      <span className="text-xs font-bold bg-white/5 px-2 py-1 rounded text-slate-400">Today</span>
                   </div>
                   <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</h3>
                   <p className="text-4xl font-black text-white">{stat.value}</p>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="animate-fade-in relative z-10">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-black text-white">Tournaments</h2>
                <p className="text-slate-400 text-sm">Manage competitive events and brackets</p>
              </div>
              <button onClick={() => setShowForm(!showForm)} className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-violet-900/20 active:scale-95 flex items-center gap-2">
                {showForm ? '✖ Cancel' : '➕ Create New'}
              </button>
            </div>

            {/* DYNAMIC FORM */}
            {showForm && (
              <div className="bg-[#15151e] border border-white/10 rounded-2xl p-8 mb-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-violet-500">🚀</span> Launch New Event
                </h3>
                
                <form onSubmit={createTournament} className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                  
                  {/* Game Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Game Title</label>
                    <div className="relative">
                        <select 
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none appearance-none" 
                        onChange={handleGameChange} 
                        value={formData.game}
                        >
                        {Object.keys(GAME_DATA).map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▼</div>
                    </div>
                  </div>

                  {/* Map Selection (Dynamic) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Map Selection</label>
                    <div className="relative">
                        <select 
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none appearance-none" 
                        onChange={e => setFormData({...formData, map: e.target.value})}
                        value={formData.map}
                        >
                        {GAME_DATA[formData.game].maps.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▼</div>
                    </div>
                  </div>

                  {/* Format/Mode Selection (Dynamic) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Game Mode</label>
                    <div className="relative">
                        <select 
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none appearance-none" 
                        onChange={e => setFormData({...formData, format: e.target.value})}
                        value={formData.format}
                        >
                        {GAME_DATA[formData.game].modes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▼</div>
                    </div>
                  </div>

                  {/* Other Inputs */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Tournament Title</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none placeholder-slate-700" placeholder="e.g. Winter Championship Series" onChange={e => setFormData({...formData, title: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Max Slots</label>
                    <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none placeholder-slate-700" placeholder="100" onChange={e => setFormData({...formData, maxSlots: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Prize Pool</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none placeholder-slate-700" placeholder="₹5000" onChange={e => setFormData({...formData, prize: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Entry Fee</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none placeholder-slate-700" placeholder="Free / ₹500" onChange={e => setFormData({...formData, entryFee: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                    <input type="date" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none" onChange={e => setFormData({...formData, date: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Time</label>
                    <input type="time" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none" onChange={e => setFormData({...formData, time: e.target.value})} required />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">QR Code URL (Payment)</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none placeholder-slate-700" placeholder="https://imgur.com/..." onChange={e => setFormData({...formData, qrCodeUrl: e.target.value})} />
                  </div>
                  
                  <div className="md:col-span-3 pt-4">
                    <button disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.99] uppercase tracking-widest text-sm">
                      {loading ? '🚀 Deploying...' : '🚀 Publish Event'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TOURNAMENT LIST */}
            <div className="bg-[#15151e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-black/40 text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-6">Game Info</th>
                    <th className="p-6">Details</th>
                    <th className="p-6">Format</th>
                    <th className="p-6 text-right">Control Center</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {tournaments.map((t) => (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-violet-900/30 flex items-center justify-center text-xl border border-violet-500/30 text-violet-400">
                                🎮
                            </div>
                            <div>
                                <div className="text-white font-bold text-lg">{t.game}</div>
                                <div className="text-xs text-slate-500 font-mono bg-black/30 px-2 py-0.5 rounded inline-block mt-1 border border-white/5">{t.map}</div>
                            </div>
                        </div>
                      </td>
                      <td className="p-6">
                          <div className="font-bold text-white text-lg">{t.title}</div>
                          <div className="text-slate-500 text-xs mt-1">ID: {t.id}</div>
                      </td>
                      <td className="p-6">
                          <span className="text-emerald-400 font-mono font-bold bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/20">{t.format}</span>
                      </td>
                      <td className="p-6 text-right space-x-2">
                        <button onClick={() => setChatTournament(t)} className="bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white px-4 py-2 rounded-lg font-bold text-xs transition-all border border-violet-600/20">Chat</button>
                        <button onClick={() => setSelectedTournament(t)} className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white px-4 py-2 rounded-lg font-bold text-xs transition-all border border-blue-600/20">Participants</button>
                        <button onClick={() => deleteTournament(t.id)} className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2 rounded-lg font-bold text-xs transition-all border border-red-600/20">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CHAT MODAL */}
            {chatTournament && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
                <div className="w-full max-w-2xl relative bg-[#15151e] rounded-2xl border border-white/10 shadow-2xl p-1">
                    <button 
                      onClick={() => setChatTournament(null)} 
                      className="absolute -top-12 right-0 text-white hover:text-red-400 font-bold text-sm bg-white/10 px-4 py-2 rounded-full backdrop-blur transition-all"
                    >
                      CLOSE ✕
                    </button>
                    <TournamentChat tournamentId={chatTournament.id} title={chatTournament.title} />
                </div>
              </div>
            )}

            {/* Players Modal */}
            {selectedTournament && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-[#15151e] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-blue-500">👥</span> Participants</h3>
                    <button onClick={() => setSelectedTournament(null)} className="text-slate-400 hover:text-white text-2xl font-bold">×</button>
                  </div>
                  <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {Array.isArray(selectedTournament.participants) && selectedTournament.participants.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {selectedTournament.participants.map((p, idx) => (
                          <div key={idx} className="p-4 bg-black/40 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-center group hover:border-violet-500/30 transition-all">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="w-10 h-10 rounded-full bg-violet-900/50 flex items-center justify-center font-bold text-violet-300 border border-violet-500/30">
                                    {(typeof p === 'object' ? p.teamName : 'U').charAt(0)}
                                </div>
                                <div>
                                    <span className="font-bold text-white block text-lg">{typeof p === 'object' ? p.teamName : 'Unknown'}</span>
                                    <div className="text-xs text-slate-500 font-mono">{typeof p === 'object' ? p.email : p}</div>
                                </div>
                            </div>
                            
                            <div className="mt-3 md:mt-0 flex items-center gap-3 w-full md:w-auto justify-end">
                                <span className="text-xs font-bold px-3 py-1 bg-white/5 text-slate-300 rounded-full border border-white/10 uppercase tracking-wider">
                                  {typeof p === 'object' ? p.teamSize : 'User'}
                                </span>
                                
                                {typeof p === 'object' && p.paymentStatus === 'Pending Verification' && (
                                  <div className="flex items-center gap-2">
                                     <span className="text-amber-500 font-mono text-xs bg-amber-900/10 px-2 py-1 rounded border border-amber-500/20">
                                       ⏳ {p.transactionId}
                                     </span>
                                     <button 
                                       onClick={() => verifyPayment(p, 'Approve')} 
                                       className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all shadow-emerald-900/20"
                                     >
                                       Verify
                                     </button>
                                     <button 
                                       onClick={() => verifyPayment(p, 'Reject')} 
                                       className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all shadow-red-900/20"
                                     >
                                       Reject
                                     </button>
                                  </div>
                                )}
                                {typeof p === 'object' && p.paymentStatus === 'Verified' && (
                                   <div className="flex items-center gap-2">
                                     <span className="text-emerald-500 font-bold text-xs bg-emerald-900/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                                       <span>✔</span> PAID
                                     </span>
                                     <button onClick={() => verifyPayment(p, 'Reject')} className="text-red-500 text-xs hover:text-red-400 font-bold" title="Revoke Payment">(Kick)</button>
                                   </div>
                                )}
                                {typeof p === 'object' && p.paymentStatus === 'Rejected' && (
                                   <div className="flex items-center gap-2">
                                     <span className="text-red-500 font-bold text-xs bg-red-900/10 px-3 py-1 rounded-full border border-red-500/20 flex items-center gap-1">
                                       <span>✖</span> REJECTED
                                     </span>
                                   </div>
                                )}
                                {typeof p === 'object' && (p.paymentStatus === 'Verified' || !p.paymentStatus) && p.transactionId === 'Free Entry' && (
                                   <span className="text-slate-500 text-xs px-3 py-1 bg-slate-800 rounded-full">Free</span>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                          <div className="text-4xl mb-4 opacity-20">👻</div>
                          <p className="text-slate-500 italic">No warriors have joined this arena yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: BRACKETS */}
        {activeTab === 'brackets' && <BracketManager />}

        {/* VIEW: STATS */}
        {activeTab === 'stats' && <StatsManager />}

        {/* VIEW: TRANSACTIONS */}
        {activeTab === 'transactions' && <Transactions />}

        {/* USERS TAB */}
        {activeTab === 'users' && (
           <div className="animate-fade-in relative z-10">
             <header className="mb-8">
                <h2 className="text-3xl font-black text-white">United <span className="text-violet-500">Nations</span></h2>
                <p className="text-slate-400">Database of all registered operatives.</p>
             </header>

             <div className="bg-[#15151e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <button 
                  onClick={fetchUsers} 
                  className="m-4 px-4 py-2 bg-violet-600 rounded text-sm text-white hover:bg-violet-500 transition-all font-bold"
                >
                  🔄 Refresh User List
                </button>
                <table className="w-full text-left border-collapse">
                  <thead className="bg-black/40 text-slate-400 text-xs uppercase font-bold tracking-wider">
                    <tr><th className="p-6">User Identity</th><th className="p-6">Clearance Level</th><th className="p-6">System ID</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-6">
                            <div className="font-bold text-white text-lg">{u.email}</div>
                            <div className="text-xs text-slate-500 mt-1">Joined: {new Date().toLocaleDateString()}</div>
                        </td>
                        <td className="p-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                u.role === 'admin' 
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                                : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            }`}>
                                {u.role}
                            </span>
                        </td>
                        <td className="p-6 text-slate-500 text-xs font-mono">{u.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
           </div>
        )}

      </main>
    </div>
  );
};

export default AdminPanel;
