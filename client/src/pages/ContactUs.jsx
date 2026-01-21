import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ContactUs = () => {
    const navigate = useNavigate();
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const formData = {
            name: e.target.name.value,
            email: e.target.email.value,
            subject: e.target.subject.value,
            message: e.target.message.value
        };

        try {
            await axios.post(`${API_URL}/api/contact`, formData);
            setSubmitted(true);
        } catch (error) {
            alert("Failed to send message: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-slate-300 p-8 md:p-16 flex flex-col items-center">
            <div className="w-full max-w-4xl">
                 <button onClick={() => navigate(-1)} className="mb-8 text-violet-500 hover:text-white transition-colors flex items-center gap-2">
                    ← Back
                </button>
            </div>
           
            <div className="max-w-xl w-full bg-[#15151e] p-10 rounded-3xl border border-white/10 shadow-2xl">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-black text-white mb-2">Contact Support</h1>
                    <p className="text-slate-500">Have an issue? We're here to help.</p>
                </header>

                {submitted ? (
                    <div className="text-center py-10 animate-fade-in">
                        <div className="text-6xl mb-4">✅</div>
                        <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                        <p className="text-slate-400">We will get back to you at <strong>luckmatters199@gmail.com</strong> shortly.</p>
                        <button onClick={() => setSubmitted(false)} className="mt-6 text-violet-500 font-bold hover:underline">Send another message</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Your Name</label>
                            <input name="name" type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none" required placeholder="John Doe" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
                            <input name="email" type="email" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none" required placeholder="name@example.com" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subject</label>
                            <select name="subject" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none">
                                <option>General Inquiry</option>
                                <option>Payment Issue</option>
                                <option>Report a Player</option>
                                <option>Tournament Help</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Message</label>
                            <textarea name="message" rows="5" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-violet-500 outline-none resize-none" required placeholder="Describe your issue..."></textarea>
                        </div>
                        
                        <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl font-bold text-white hover:shadow-lg hover:shadow-violet-600/20 transition-all disabled:opacity-50">
                            {loading ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                )}

                <div className="mt-8 pt-8 border-t border-white/10 text-center">
                    <p className="text-sm text-slate-500">Direct Email Support:</p>
                    <a href="mailto:luckmatters199@gmail.com" className="text-violet-400 font-bold text-lg hover:text-white transition-colors">luckmatters199@gmail.com</a>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;