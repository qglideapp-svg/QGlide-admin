import React, { useState } from 'react';
import './AddUserModal.css';
import './AddMarketerModal.css';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AddMarketerModal({ isOpen, onClose, onConfirm, duplicateEmails = [] }) {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
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
    const email = formData.email.trim();
    if (!email) {
      newErrors.email = t('marketers.validationEmailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('marketers.validationEmail');
    } else if (duplicateEmails.includes(email.toLowerCase())) {
      newErrors.email = t('marketers.duplicateEmail');
    }

    const pwd = formData.password;
    if (!pwd) {
      newErrors.password = t('marketers.validationPasswordRequired');
    } else if (pwd.length < 8) {
      newErrors.password = t('marketers.validationPassword');
    }

    if (formData.confirmPassword !== pwd) {
      newErrors.confirmPassword = t('marketers.validationMatch');
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
        displayName: formData.displayName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      setFormData({ displayName: '', email: '', password: '', confirmPassword: '' });
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
    setFormData({ displayName: '', email: '', password: '', confirmPassword: '' });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={isSubmitting ? undefined : handleClose}>
      <div
        className="modal-content add-user-modal-content add-marketer-modal-content"
        role="dialog"
        aria-labelledby="add-marketer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="add-marketer-title">{t('marketers.modalTitle')}</h2>
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
            <div className="info-banner marketer-modal-banner">
              <span className="info-icon">ℹ️</span>
              <p>{t('marketers.modalSubtitle')}</p>
            </div>

            <div className="form-group">
              <label htmlFor="marketer_display_name">
                {t('marketers.displayName')} <span className="optional">{t('marketers.displayNameOptional')}</span>
              </label>
              <input
                type="text"
                id="marketer_display_name"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                placeholder={t('marketers.displayNamePlaceholder')}
                className={errors.displayName ? 'error' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="marketer_email">{t('marketers.email')}</label>
              <input
                type="email"
                id="marketer_email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('marketers.emailPlaceholder')}
                autoComplete="off"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="marketer_password">{t('marketers.password')}</label>
              <input
                type="password"
                id="marketer_password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={t('marketers.passwordPlaceholder')}
                autoComplete="new-password"
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="marketer_confirm">{t('marketers.confirmPassword')}</label>
              <input
                type="password"
                id="marketer_confirm"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder={t('marketers.confirmPasswordPlaceholder')}
                autoComplete="new-password"
                className={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose} disabled={isSubmitting}>
              {t('marketers.cancel')}
            </button>
            <button type="submit" className="btn-create" disabled={isSubmitting}>
              {isSubmitting ? t('marketers.creating') : t('marketers.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
