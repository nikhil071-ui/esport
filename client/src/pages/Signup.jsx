import React, { useState } from 'react'; // Removed useRef
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from '../components/Footer';
import './Login.css';

const Signup = () => {
  // We use State now, so data isn't lost when switching steps
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [verificationCode, setVerificationCode] = useState(''); // User's input code
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  // App State
  const [step, setStep] = useState(1);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- STEP 1: SEND EMAIL ---
  async function handleSendCode(e) {
    e.preventDefault();
    const { email, password, confirmPassword } = formData;

    if (password !== confirmPassword) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');

    try {
      setError('');
      setLoading(true);

      // 1. Generate Code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);

      // 2. Send Email
      await axios.post(`${import.meta.env.VITE_API_URL}/api/send-code`, {
        email: email,
        code: code
      });

      // 3. Move to Step 2
      setStep(2);
      
    } catch (err) {
      console.error(err);
      setError('Failed to send email. Check if server is running.');
    }
    setLoading(false);
  }

  // --- STEP 2: VERIFY & CREATE ACCOUNT ---
  async function handleVerifyAndSignup(e) {
    e.preventDefault();

    if (verificationCode !== generatedCode) {
      return setError('Invalid Code. Please check your email.');
    }

    try {
      setError('');
      setLoading(true);
      
      // NOW this works because we are reading from State, not the hidden input ref
      await signup(formData.email, formData.password);
      navigate('/');
      
    } catch (err) {
      setError('Failed to create account: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="login-container" style={{flexDirection: 'column', height: 'auto', minHeight: '100vh', justifyContent: 'space-between'}}>
      <div style={{flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '2rem 0'}}>
      <div className="login-card">
        <h1 className="login-title">CREATE <span className="highlight">ACCOUNT</span></h1>
        
        {error && <div style={{color: '#ff4444', marginBottom: '10px', background: 'rgba(255,0,0,0.1)', padding: '10px', borderRadius: '5px'}}>{error}</div>}

        {step === 1 && (
          /* --- STEP 1 FORM --- */
          <form onSubmit={handleSendCode} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <p className="login-subtitle">Step 1: Account Details</p>
            
            <input 
              name="email"
              type="email" 
              placeholder="Email Address" 
              value={formData.email}
              onChange={handleChange}
              required 
              className="gamer-input" 
            />
            <input 
              name="password"
              type="password" 
              placeholder="Password" 
              value={formData.password}
              onChange={handleChange}
              required 
              className="gamer-input" 
            />
            <input 
              name="confirmPassword"
              type="password" 
              placeholder="Confirm Password" 
              value={formData.confirmPassword}
              onChange={handleChange}
              required 
              className="gamer-input" 
            />
            
            <button disabled={loading} type="submit" className="google-btn" style={{backgroundColor: '#bd00ff', color: 'white'}}>
              {loading ? 'SENDING CODE...' : 'VERIFY EMAIL'}
            </button>
          </form>
        )}

        {step === 2 && (
          /* --- STEP 2 FORM --- */
          <form onSubmit={handleVerifyAndSignup} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <p className="login-subtitle">Step 2: Enter Verification Code</p>
            <div style={{color: '#aaa', fontSize: '0.9rem', marginBottom: '10px'}}>
              We sent a code to <b>{formData.email}</b>
            </div>
            
            <input 
              type="text" 
              placeholder="Enter 6-Digit Code" 
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required 
              className="gamer-input" 
              style={{textAlign: 'center', letterSpacing: '5px', fontSize: '1.2rem'}}
            />
            
            <button disabled={loading} type="submit" className="google-btn" style={{backgroundColor: '#00ff88', color: '#000'}}>
              COMPLETE SIGNUP
            </button>
            
            <button type="button" onClick={() => setStep(1)} style={{background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', marginTop: '10px'}}>
              Back to Details
            </button>
          </form>
        )}

        <div style={{marginTop: '20px', color: '#a0a0a0'}}>
          Already have an account? <Link to="/login" style={{color: '#bd00ff'}}>Log In</Link>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default Signup;