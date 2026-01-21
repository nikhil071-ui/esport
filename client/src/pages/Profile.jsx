import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ displayName: '', gameId: '', bio: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch existing profile data
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/${currentUser.email}`);
        setFormData({
            displayName: res.data.displayName || '',
            gameId: res.data.gameId || '',
            bio: res.data.bio || ''
        });
      } catch (err) { console.error(err); }
    };
    fetchProfile();
  }, [currentUser]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // We pass empty string for avatarUrl to effectivley "remove" it or keep it unused
      await axios.post(`${import.meta.env.VITE_API_URL}/api/user/update`, { ...formData, email: currentUser.email, avatarUrl: '' });
      alert("Profile Updated Successfully!");
    } catch (err) { alert("Failed to update."); }
    setLoading(false);
  };

  // Helper to get initials
  const getInitials = (name) => {
    if (!name) return currentUser.email[0].toUpperCase();
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="h-screen bg-[#0a0a0f] text-white p-4 md:p-8 flex items-center justify-center overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#15151e] border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors flex items-center gap-2 font-bold z-20">
             ← Back
        </button>

        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -trangray-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row gap-10">
            
          {/* Left: Avatar Section */}
          <div className="flex flex-col items-center gap-4 md:w-1/3">
             <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-xl border-4 border-[#15151e] ring-2 ring-violet-500/50">
                    {getInitials(formData.displayName)}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold transition-all cursor-default">
                    {formData.displayName || 'Player'}
                </div>
             </div>
             <div className="text-center">
                 <p className="text-slate-400 text-sm font-mono">{currentUser.email}</p>
                 <span className="inline-block mt-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full border border-emerald-500/20">
                    Verified Gamer
                 </span>
             </div>
          </div>

          {/* Right: Form Section */}
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-1">Player <span className="text-violet-500">Profile</span></h2>
            <p className="text-slate-400 text-sm mb-8">Update your identity in the arena.</p>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Display Name</label>
                  <input 
                    value={formData.displayName} 
                    onChange={e => setFormData({...formData, displayName: e.target.value})} 
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-4 text-white focus:border-violet-500 outline-none transition-all placeholder:text-slate-700"
                    placeholder="e.g. Ninja"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">In-Game ID</label>
                  <input 
                    value={formData.gameId} 
                    onChange={e => setFormData({...formData, gameId: e.target.value})} 
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-4 text-white focus:border-violet-500 outline-none transition-all placeholder:text-slate-700" 
                    placeholder="e.g. 512345678" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bio / Legend</label>
                <textarea 
                    value={formData.bio} 
                    onChange={e => setFormData({...formData, bio: e.target.value})} 
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-4 text-white focus:border-violet-500 outline-none transition-all h-32 resize-none placeholder:text-slate-700 leading-relaxed" 
                    placeholder="Tell us about your gaming journey, achievements, and playstyle..." 
                />
              </div>

              <div className="pt-4">
                  <button 
                    disabled={loading} 
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-violet-900/20 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? 'SYNCING DATA...' : 'SAVE CHANGES'}
                  </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;