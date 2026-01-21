import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css'; // Reusing your existing styles

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // STEP 1: Check User & Send Code
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(randomCode);

      // Call our NEW backend route
      await axios.post(`${API_URL}/api/send-reset-code`, {
        email: email,
        code: randomCode
      });

      setStep(2); // Move to verification
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('No account found with this email.');
      } else {
        setError('Failed to send email. Server error.');
      }
    }
    setLoading(false);
  };

  // STEP 2: Verify Code
  const handleVerifyCode = (e) => {
    e.preventDefault();
    if (code === generatedCode) {
      setStep(3); // Move to password reset
      setError('');
    } else {
      setError('Invalid code. Please try again.');
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/reset-password`, {
        email: email,
        newPassword: newPassword
      });
      alert("Password updated! Please log in.");
      navigate('/login');
    } catch (err) {
      setError('Failed to update password.');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">RESET <span className="highlight">PASSWORD</span></h1>

        {error && <div style={{color: '#ff4444', marginBottom: '10px', background: 'rgba(255,0,0,0.1)', padding: '10px'}}>{error}</div>}

        {/* STEP 1: EMAIL */}
        {step === 1 && (
          <form onSubmit={handleSendCode} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <p className="login-subtitle">Enter your registered email</p>
            <input 
              type="email" 
              placeholder="Email Address" 
              className="gamer-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button disabled={loading} className="google-btn" style={{backgroundColor: '#bd00ff', color: 'white'}}>
              {loading ? 'CHECKING...' : 'SEND CODE'}
            </button>
          </form>
        )}

        {/* STEP 2: CODE */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <p className="login-subtitle">Enter code sent to {email}</p>
            <input 
              type="text" 
              placeholder="6-Digit Code" 
              className="gamer-input" 
              style={{textAlign: 'center', letterSpacing: '5px'}}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <button className="google-btn" style={{backgroundColor: '#00ff88', color: 'black'}}>
              VERIFY
            </button>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <p className="login-subtitle">Create new password</p>
            <input 
              type="password" 
              placeholder="New Password" 
              className="gamer-input" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button disabled={loading} className="google-btn" style={{backgroundColor: '#bd00ff', color: 'white'}}>
              CHANGE PASSWORD
            </button>
          </form>
        )}

        <div style={{marginTop: '20px'}}>
          <Link to="/login" style={{color: '#a0a0a0'}}>Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;