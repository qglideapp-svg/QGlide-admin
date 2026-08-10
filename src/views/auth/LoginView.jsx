import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginView.css';
import logoSrc from '../../assets/images/logo.png';
import { loginUser, storeAuthSession } from '../../services/authService';
import Toast from '../../components/common/Toast';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageToggle from '../../components/common/LanguageToggle';
import LazyLoader from '../../components/common/LazyLoader.jsx';

export default function LoginView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setToastMessage(t('auth.enterBothFields'));
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await loginUser(email, password);
      
      if (result.success) {
        if (result.data.access_token) {
          storeAuthSession(result.data);
        }
        navigate('/dashboard');
      } else {
        const message = result.error || t('auth.loginFailed');
        setToastMessage(
          message.includes('Admin credentials only') ? t('auth.adminAccessOnly') : message
        );
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage(t('auth.unexpectedError'));
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
          <h1>{t('auth.streamlineOperations')}</h1>
          <p>{t('auth.manageHub')}</p>
        </div>
        <div className="cityline" />
      </div>

      <div className="right-panel">
        <div className="lang-theme">
            <LanguageToggle variant="login" />
          <button className="icon-btn" aria-label="toggle theme">☾</button>
        </div>

        <form className="card" onSubmit={handleLogin}>
          <h2>{t('auth.adminPortalLogin')}</h2>
          <p className="subtitle">{t('auth.welcomeBack')}</p>

          <label className="label">{t('auth.email')}</label>
          <div className="input with-icon">
            <span className="icon material-symbols-outlined">mail</span>
            <input 
              type="email" 
              placeholder={t('auth.enterEmail')} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <label className="label">{t('auth.password')}</label>
          <div className="input with-icon">
            <span className="icon material-symbols-outlined">lock</span>
            <input 
              type={showPassword ? 'text' : 'password'} 
              placeholder={t('auth.enterPassword')}
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
              title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              disabled={isLoading}
            >
              {showPassword ? 'visibility_off' : 'visibility'}
            </button>
          </div>

          <div className="row between">
            <label className="checkbox">
              <input type="checkbox" disabled={isLoading} />
              <span>{t('auth.rememberMe')}</span>
            </label>
            <button className="link" type="button" disabled={isLoading}>{t('auth.forgotPassword')}</button>
          </div>

          <button className="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <LazyLoader variant="inline" size="sm" message={t('auth.signingIn')} />
            ) : (
              t('auth.login')
            )}
          </button>

          <p className="footer">{t('auth.copyright')}</p>
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
