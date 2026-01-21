import React from 'react';
import { useNavigate } from 'react-router-dom';

const AboutUs = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-slate-300 p-8 md:p-16">
            <button onClick={() => navigate(-1)} className="mb-8 text-violet-500 hover:text-white transition-colors flex items-center gap-2">
                ← Back
            </button>
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="text-center mb-16">
                    <h1 className="text-5xl font-black text-white mb-4">About <span className="text-violet-500">Nexus</span></h1>
                    <p className="text-xl text-slate-500">The Ultimate Competitive Battleground</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <section className="bg-[#15151e] p-8 rounded-2xl border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
                        <p>
                            To provide a seamless, fair, and electrifying platform for gamers to compete, earn, and rise to glory. We believe every gamer deserves a stage to showcase their skills.
                        </p>
                    </section>
                    <section className="bg-[#15151e] p-8 rounded-2xl border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-4">What We Do</h2>
                        <p>
                            Nexus Esports organizes high-octane tournaments for the world's most popular mobile titles including BGMI, Free Fire, and COD Mobile. We ensure automated bracket management, secure payments, and instant verified results.
                        </p>
                    </section>
                </div>

                <section className="mt-12 text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">Why Choose Us?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4">
                            <div className="text-4xl mb-4">🛡️</div>
                            <h3 className="font-bold text-white mb-2">Fair Play</h3>
                            <p className="text-sm">Strict anti-cheat policies and admin verification.</p>
                        </div>
                        <div className="p-4">
                            <div className="text-4xl mb-4">⚡</div>
                            <h3 className="font-bold text-white mb-2">Instant Updates</h3>
                            <p className="text-sm">Real-time brackets and score tracking.</p>
                        </div>
                        <div className="p-4">
                            <div className="text-4xl mb-4">💰</div>
                            <h3 className="font-bold text-white mb-2">Secure Rewards</h3>
                            <p className="text-sm">Verified prize pool distribution.</p>
                        </div>
                    </div>
                </section>
                
                <section className="text-center pt-10 border-t border-white/10 mt-10">
                    <p>Powered by Passion. Built for Gamers.</p>
                    <p className="text-slate-500 text-sm mt-2">Contact: luckmatters199@gmail.com</p>
                </section>
            </div>
        </div>
    );
};

export default AboutUs;