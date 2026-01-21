import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="w-full bg-[#0a0a0f] border-t border-white/5 py-8 mt-12 bg-[#0a0a0f] relative z-20">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                    <h3 className="text-xl font-black text-white tracking-tighter">NEXUS<span className="text-violet-600">.</span></h3>
                    <p className="text-xs text-slate-500 mt-1">© {new Date().getFullYear()} Nexus Esports. All rights reserved.</p>
                </div>
                
                <div className="flex gap-6 text-sm font-medium text-slate-400">
                    <Link to="/about-us" className="hover:text-white transition-colors">About Us</Link>
                    <Link to="/contact-us" className="hover:text-white transition-colors">Contact</Link>
                    <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                </div>

                <div className="text-xs text-slate-600">
                    <a href="mailto:luckmatters199@gmail.com" className="hover:text-violet-400 transition-colors">luckmatters199@gmail.com</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;