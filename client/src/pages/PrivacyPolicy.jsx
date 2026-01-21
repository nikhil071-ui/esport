import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-slate-300 p-8 md:p-16">
            <button onClick={() => navigate(-1)} className="mb-8 text-violet-500 hover:text-white transition-colors flex items-center gap-2">
                ← Back
            </button>
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-4xl font-black text-white mb-4">Privacy Policy</h1>
                <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

                <section>
                    <h2 className="text-xl font-bold text-white mb-2">1. Introduction</h2>
                    <p>Welcome to Nexus Esports. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-2">2. Data We Collect</h2>
                    <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                        <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                        <li><strong>Contact Data:</strong> includes email address and discord ID.</li>
                        <li><strong>Financial Data:</strong> includes transaction IDs uploaded for tournament verification (we do not store credit card details directly).</li>
                        <li><strong>Usage Data:</strong> includes information about how you use our website and services.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-2">3. How We Use Your Data</h2>
                    <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                        <li>To register you as a new customer.</li>
                        <li>To manage your participation in tournaments and verify payments.</li>
                        <li>To manage our relationship with you including notifying you about changes to our terms or privacy policy.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-2">4. Data Security</h2>
                    <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.</p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-2">5. Contact Details</h2>
                    <p>If you have any questions about this privacy policy or our privacy practices, please contact us at:</p>
                    <p className="mt-2 text-violet-400 font-bold">luckmatters199@gmail.com</p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;