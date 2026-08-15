import React, { useState } from 'react';
import './AddUserModal.css';
import './AddPartnerModal.css';
import { useLanguage } from '../../contexts/LanguageContext';
import { PARTNER_CATEGORIES } from '../../services/partnerService';

export default function AddPartnerModal({ isOpen, onClose, onConfirm, duplicateEmails = [] }) {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: 'restaurant',
    displayName: '',
    legalName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.category) {
      newErrors.category = t('partners.validationCategoryRequired');
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = t('partners.validationTradingNameRequired');
    }

    const email = formData.email.trim();
    if (!email) {
      newErrors.email = t('partners.validationEmailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('partners.validationEmail');
    } else if (duplicateEmails.includes(email.toLowerCase())) {
      newErrors.email = t('partners.duplicateEmail');
    }

    const pwd = formData.password;
    if (!pwd) {
      newErrors.password = t('partners.validationPasswordRequired');
    } else if (pwd.length < 8) {
      newErrors.password = t('partners.validationPassword');
    }

    if (formData.confirmPassword !== pwd) {
      newErrors.confirmPassword = t('partners.validationMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm({
        category: formData.category,
        displayName: formData.displayName.trim(),
        legalName: formData.legalName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      setFormData({
        category: 'restaurant',
        displayName: '',
        legalName: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      setErrors({});
      onClose();
    } catch {
      /* Parent shows error; keep form open */
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setFormData({
      category: 'restaurant',
      displayName: '',
      legalName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={isSubmitting ? undefined : handleClose}>
      <div
        className="modal-content add-user-modal-content add-partner-modal-content"
        role="dialog"
        aria-labelledby="add-partner-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="add-partner-title">{t('partners.modalTitle')}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="info-banner partner-modal-banner">
              <span className="info-icon">ℹ️</span>
              <p>{t('partners.modalSubtitle')}</p>
            </div>

            <div className="form-group">
              <label htmlFor="partner_category">{t('partners.category')}</label>
              <select
                id="partner_category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={errors.category ? 'error' : ''}
              >
                {PARTNER_CATEGORIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
              {errors.category && <span className="error-message">{errors.category}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="partner_trading_name">{t('partners.tradingName')}</label>
              <input
                type="text"
                id="partner_trading_name"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                placeholder={t('partners.tradingNamePlaceholder')}
                className={errors.displayName ? 'error' : ''}
              />
              {errors.displayName && <span className="error-message">{errors.displayName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="partner_legal_name">
                {t('partners.legalName')} <span className="optional">{t('partners.legalNameOptional')}</span>
              </label>
              <input
                type="text"
                id="partner_legal_name"
                name="legalName"
                value={formData.legalName}
                onChange={handleInputChange}
                placeholder={t('partners.legalNamePlaceholder')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="partner_email">{t('partners.email')}</label>
              <input
                type="email"
                id="partner_email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('partners.emailPlaceholder')}
                autoComplete="off"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="partner_password">{t('partners.password')}</label>
              <input
                type="password"
                id="partner_password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={t('partners.passwordPlaceholder')}
                autoComplete="new-password"
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="partner_confirm">{t('partners.confirmPassword')}</label>
              <input
                type="password"
                id="partner_confirm"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder={t('partners.confirmPasswordPlaceholder')}
                autoComplete="new-password"
                className={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose} disabled={isSubmitting}>
              {t('partners.cancel')}
            </button>
            <button type="submit" className="btn-create" disabled={isSubmitting}>
              {isSubmitting ? t('partners.creating') : t('partners.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
