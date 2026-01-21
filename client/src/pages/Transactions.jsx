import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('All'); 
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/transactions`);
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching transactions", error);
    }
    setLoading(false);
  };

  const handleVerify = async (t, action) => {
    if(!window.confirm(`${action} payment for ${t.teamName}?`)) return;

    try {
      await axios.post(`${API_URL}/api/verify-player`, {
        tournamentId: t.tournamentId,
        userEmail: t.email,
        transactionId: t.transactionId,
        action: action 
      });
      fetchTransactions(); 
    } catch (error) {
      alert("Action failed: " + error.message);
    }
  };

  const filteredData = transactions.filter(t => {
    const matchesFilter = filter === 'All' || 
                          (filter === 'Pending' ? t.status === 'Pending Verification' || t.status === 'Pending' : t.status === filter);
    
    // Safety check for properties
    const txId = t.transactionId || '';
    const email = t.email || '';
    const team = t.teamName || '';
    const searchLow = search.toLowerCase();
    
    const matchesSearch = txId.toLowerCase().includes(searchLow) || 
                          email.toLowerCase().includes(searchLow) ||
                          team.toLowerCase().includes(searchLow);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="animate-fade-in relative z-10">
      
      {/* HEADER & FILTERS */}
      <header className="mb-8">
        <h2 className="text-3xl font-black text-white tracking-tight">Financial <span className="text-violet-500">Log</span></h2>
        <p className="text-slate-400">Verify incomings and manage transaction disputes.</p>
      </header>

      <div className="bg-[#15151e] border border-white/10 rounded-2xl p-4 mb-6 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-4 w-full md:w-auto">
             <div className="relative w-full md:w-64">
                <input 
                    placeholder="Search TxID, Email, Team..." 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white outline-none focus:border-violet-500 font-medium placeholder-slate-600 transition-colors"
                    onChange={(e) => setSearch(e.target.value)}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
             </div>
             
             <div className="relative">
                <select 
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 cursor-pointer appearance-none pr-10 font-bold"
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▼</span>
             </div>
        </div>

        <button onClick={fetchTransactions} className="bg-white/5 hover:bg-white/10 p-3 rounded-xl text-white transition-all border border-white/5 hover:border-white/20 active:scale-95">
            🔄 Refresh
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-[#15151e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative min-h-[400px]">
        {loading && (
             <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center backdrop-blur-sm">
                 <div className="animate-spin text-4xl">🌀</div>
             </div>
        )}

        <table className="w-full text-left border-collapse">
          <thead className="bg-[#0a0a0f] text-slate-400 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="p-6">Tournament Context</th>
              <th className="p-6">Source (User/Team)</th>
              <th className="p-6">Transaction ID (UTR)</th>
              <th className="p-6">Status</th>
              <th className="p-6 text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {filteredData.length === 0 ? (
              <tr><td colSpan="5" className="p-12 text-center text-slate-500 italic">No transactions match your criteria.</td></tr>
            ) : (
              filteredData.map((t, index) => (
                <tr key={index} className="hover:bg-white/5 transition-colors group">
                  <td className="p-6">
                      <div className="text-white font-bold">{t.tournamentTitle || 'Unknown Event'}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {t.tournamentId?.slice(0,6)}...</div>
                  </td>
                  <td className="p-6">
                      <div className="text-white font-bold text-lg">{t.teamName || 'Solo Player'}</div>
                      <div className="text-xs text-slate-500">{t.email}</div>
                  </td>
                  <td className="p-6">
                      <div className="font-mono bg-black/30 px-3 py-1.5 rounded border border-white/10 text-slate-300 inline-flex items-center gap-2">
                          <span>💳</span> {t.transactionId}
                      </div>
                  </td>
                  <td className="p-6">
                      {t.status === 'Verified' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span>✔</span> Verified
                          </span>
                      ) : t.status === 'Rejected' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                              <span>✖</span> Rejected
                          </span>
                      ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
                              <span>⏳</span> Pending
                          </span>
                      )}
                  </td>
                  <td className="p-6 text-right">
                      {t.status !== 'Verified' && t.status !== 'Rejected' && (
                          <div className="flex justify-end gap-2 opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleVerify(t, 'Approve')} 
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleVerify(t, 'Reject')} 
                                className="bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/30 px-4 py-2 rounded-lg font-bold text-xs transition-all"
                              >
                                Reject
                              </button>
                          </div>
                      )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;
