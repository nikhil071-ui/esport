import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import axios from "axios";

const TournamentChat = ({ tournamentId, title }) => {
  const { currentUser, userRole } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const dummyDiv = useRef(null);

  useEffect(() => {
    if (!tournamentId) return;

    // Reference to the subcolleciton
    const messagesRef = collection(db, 'tournaments', tournamentId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [tournamentId]);

  // Auto-scroll to bottom
  useEffect(() => {
    dummyDiv.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
        const senderName = currentUser.displayName || currentUser.email.split('@')[0];

        await addDoc(collection(db, 'tournaments', tournamentId, 'messages'), {
            text: newMessage,
            senderId: currentUser.uid,
            senderName: senderName,
            role: userRole || 'user', // 'admin' or 'user'
            timestamp: serverTimestamp()
        });

        // Trigger Email Notification (Only if Admin to avoid spam)
        if (userRole === 'admin') {
            axios.post(`${import.meta.env.VITE_API_URL}/api/notify-chat`, {
                tournamentId,
                senderName,
                senderEmail: currentUser.email,
                message: newMessage
            }).catch(err => console.error("Email notify failed", err));
        }

      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Helper to format time
  const formatTime = (timestamp) => {
    if (!timestamp) return '...';
    // Firestore timestamp to JS Date
    const date = timestamp.toDate(); 
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[600px] bg-[#1a1a24] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-[#15151e] border-b border-white/10 flex justify-between items-center">
        <h3 className="font-bold text-white">💬 Tournament Chat</h3>
        <span className="text-xs text-slate-400">{title}</span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0f]">
        {messages.length === 0 && (
          <p className="text-center text-slate-500 text-sm mt-10">No messages yet. Say hello!</p>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.uid;
          const isAdmin = msg.role === 'admin';

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 relative ${
                isMe 
                  ? 'bg-violet-600 text-white rounded-tr-none' 
                  : isAdmin 
                    ? 'bg-amber-600/20 border border-amber-600/50 text-amber-200 rounded-tl-none'
                    : 'bg-[#2a2a35] text-slate-200 rounded-tl-none'
              }`}>
                {/* Sender Name */}
                {!isMe && (
                  <p className={`text-[10px] font-bold mb-1 ${isAdmin ? 'text-amber-500' : 'text-slate-400'}`}>
                    {msg.senderName} {isAdmin && '⭐ (Admin)'}
                  </p>
                )}
                
                <p className="text-sm leading-relaxed">{msg.text}</p>
                
                <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-violet-200' : 'text-slate-500'}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={dummyDiv}></div>
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="p-4 bg-[#15151e] border-t border-white/10 flex gap-2">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={userRole === 'admin' ? "Post an announcement..." : "Type your message..."}
          className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition-colors"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()}
          className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default TournamentChat;
