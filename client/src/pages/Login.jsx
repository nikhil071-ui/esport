import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const Login = () => {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { currentUser, login, loginWithGoogle } = useAuth(); // Get currentUser to auto-redirect
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fix: Redirect when currentUser is set (fixes the "login twice" issue)
  React.useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  async function handleManualLogin(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(emailRef.current.value, passwordRef.current.value);
      // Navigation is now handled by the useEffect above
    } catch (err) {
      setError('Failed to log in: ' + err.message);
      setLoading(false); // Only stop loading on error, otherwise wait for redirect
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0f] to-black">
      <div className="flex-grow flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_0_40px_-10px_rgba(139,92,246,0.3)] my-auto h-fit">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
            NEXUS <span className="text-violet-500">ESPORTS</span>
          </h1>
          <p className="text-slate-400 text-sm uppercase tracking-widest">Enter the Arena</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleManualLogin} className="space-y-4">
          <div>
            <input 
              type="email" 
              ref={emailRef} 
              placeholder="Email Address"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
              required
            />
          </div>
          <div>
            <input 
              type="password" 
              ref={passwordRef} 
              placeholder="Password"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
              required
            />
            <div className="text-right mt-2">
              <Link to="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                Forgot Password?
              </Link>
            </div>
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition-all shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'AUTHENTICATING...' : 'LOG IN'}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="px-4 text-xs text-slate-500 uppercase">Or continue with</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Google Login */}
        <button 
          onClick={loginWithGoogle} 
          className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="G" className="w-5 h-5" />
          Sign in with Google
        </button>

        <div className="mt-8 text-center text-sm text-slate-400">
          New Player? <Link to="/signup" className="text-violet-400 hover:text-white font-semibold transition-colors">Create Account</Link>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;