import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginView.css';
import logoSrc from '../assets/images/logo.png';
import { loginUser, storeAuthToken } from '../services/authService';
import Toast from '../components/Toast';

export default function LoginView() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setToastMessage('Please enter both email and password');
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await loginUser(email, password);
      
      if (result.success) {
        // Store the access token from the response
        if (result.data.access_token) {
          console.log('🚀 LOGIN SUCCESS - STORING TOKEN:', {
            '✅ Login Successful': true,
            '🔑 Access Token': result.data.access_token,
            '📏 Token Length': result.data.access_token?.length,
            '🔍 Token Preview': result.data.access_token ? `${result.data.access_token.substring(0, 20)}...${result.data.access_token.substring(result.data.access_token.length - 10)}` : 'No token',
            '📧 Email': email,
            '⏰ Login Time': new Date().toISOString()
          });
          
          storeAuthToken(result.data.access_token);
        }
        navigate('/dashboard');
      } else {
        setToastMessage(result.error || 'Login failed. Please try again.');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('An unexpected error occurred. Please try again.');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const closeToast = () => {
    setShowToast(false);
    setToastMessage('');
  };

  return (
    <div className="login-page">
      <div className="left-panel">
        <div className="top-logo">
          <img src={logoSrc} alt="QGlide Logo" className="logo" />
        </div>
        <div className="left-copy">
          <h1>Streamline Your<br/>Operations.</h1>
          <p>Efficiently manage rides, drivers, and
            analytics from one central hub.</p>
        </div>
        <div className="cityline" />
      </div>

      <div className="right-panel">
        <div className="lang-theme">
          <button className="chip active">EN</button>
          <button className="chip">AR</button>
          <button className="icon-btn" aria-label="toggle theme">☾</button>
        </div>

        <form className="card" onSubmit={handleLogin}>
          <h2>Admin Portal Login</h2>
          <p className="subtitle">Welcome back! Please enter your details.</p>

          <label className="label">Email Address</label>
          <div className="input with-icon">
            <span className="icon material-symbols-outlined">mail</span>
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <label className="label">Password</label>
          <div className="input with-icon">
            <span className="icon material-symbols-outlined">lock</span>
            <input 
              type={showPassword ? 'text' : 'password'} 
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
            <button
              className="icon-btn material-symbols-outlined"
              type="button"
              aria-label="toggle password"
              onClick={() => setShowPassword(v => !v)}
              title={showPassword ? 'Hide password' : 'Show password'}
              disabled={isLoading}
            >
              {showPassword ? 'visibility_off' : 'visibility'}
            </button>
          </div>

          <div className="row between">
            <label className="checkbox">
              <input type="checkbox" disabled={isLoading} />
              <span>Remember Me</span>
            </label>
            <button className="link" type="button" disabled={isLoading}>Forgot Password?</button>
          </div>

          <button className="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <p className="footer">© 2025 QGlide. All Rights Reserved.</p>
        </form>
      </div>
      
      {showToast && (
        <Toast 
          message={toastMessage} 
          type="error" 
          onClose={closeToast}
        />
      )}
    </div>
  );
}
