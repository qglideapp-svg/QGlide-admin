import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import enTranslations from '../locales/en.json';
import arTranslations from '../locales/ar.json';
import {
  formatApiDate,
  formatCurrency as formatCurrencyValue,
  formatDate as formatDateValue,
  formatDateTime as formatDateTimeValue,
  formatNumber as formatNumberValue,
  formatPercentage as formatPercentageValue,
  formatTime as formatTimeValue,
  getLocaleCode,
  normalizeApiKey,
} from '../utils/localeFormat';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to 'english'
    const savedLanguage = localStorage.getItem('appLanguage');
    return savedLanguage || 'english';
  });

  const translations = {
    english: enTranslations,
    arabic: arTranslations
  };

  // Translation function
  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        value = translations.english;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key;
          }
        }
        break;
      }
    }

    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match;
      });
    }

    return typeof value === 'string' ? value : key;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('appLanguage', language);
    document.documentElement.lang = language === 'arabic' ? 'ar' : 'en';
    document.documentElement.dir = language === 'arabic' ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl-mode', language === 'arabic');
  }, [language]);

  const setLanguageMode = (lang) => {
    if (lang === 'english' || lang === 'arabic') {
      setLanguage(lang);
    }
  };

  const locale = getLocaleCode(language);

  const translateApiLabel = useCallback((value) => {
    const key = normalizeApiKey(value);
    if (!key) return '';

    const commonKey = `common.${key}`;
    const commonTranslation = t(commonKey);
    if (commonTranslation !== commonKey) return commonTranslation;

    const apiKey = `apiValues.${key}`;
    const apiTranslation = t(apiKey);
    if (apiTranslation !== apiKey) return apiTranslation;

    return String(value);
  }, [language, t]);

  const formatNumber = useCallback(
    (value, options) => formatNumberValue(value, language, options),
    [language]
  );

  const formatCurrency = useCallback(
    (amount, currencyLabel) => formatCurrencyValue(amount, language, currencyLabel),
    [language]
  );

  const formatDate = useCallback(
    (value, options) => formatDateValue(value, language, options),
    [language]
  );

  const formatDateTime = useCallback(
    (value, options) => formatDateTimeValue(value, language, options),
    [language]
  );

  const formatTime = useCallback(
    (value, options) => formatTimeValue(value, language, options),
    [language]
  );

  const formatPercentage = useCallback(
    (value) => formatPercentageValue(value, language),
    [language]
  );

  const formatApiDateTime = useCallback(
    (value) => formatApiDate(value, language, formatDateTimeValue),
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      locale,
      setLanguage: setLanguageMode,
      t,
      translateApiLabel,
      formatNumber,
      formatCurrency,
      formatDate,
      formatDateTime,
      formatTime,
      formatPercentage,
      formatApiDateTime,
    }),
    [
      language,
      locale,
      t,
      translateApiLabel,
      formatNumber,
      formatCurrency,
      formatDate,
      formatDateTime,
      formatTime,
      formatPercentage,
      formatApiDateTime,
    ]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};
