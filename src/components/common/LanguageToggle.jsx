import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './LanguageToggle.css';

const LanguageToggle = ({ variant = 'header' }) => {
  const { language, setLanguage } = useLanguage();
  const activeClass = variant === 'login' ? 'active' : 'on';

  return (
    <div
      className={`language-toggle language-toggle--${variant}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        className={`chip ${language === 'english' ? activeClass : ''}`}
        onClick={() => setLanguage('english')}
        aria-pressed={language === 'english'}
      >
        EN
      </button>
      <button
        type="button"
        className={`chip ${language === 'arabic' ? activeClass : ''}`}
        onClick={() => setLanguage('arabic')}
        aria-pressed={language === 'arabic'}
      >
        AR
      </button>
    </div>
  );
};

export default LanguageToggle;
