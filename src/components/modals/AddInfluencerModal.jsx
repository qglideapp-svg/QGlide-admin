import React, { useState } from 'react';
import './AddUserModal.css';
import './AddInfluencerModal.css';
import { useLanguage } from '../../contexts/LanguageContext';

const AddInfluencerModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.display_name.trim()) {
      newErrors.display_name = t('influencers.validationDisplayNameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('influencers.validationEmailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = t('influencers.validationEmail');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('influencers.validationPhoneRequired');
    } else if (!/^[\+]?[0-9\s\-\(\)]+$/.test(formData.phone.trim())) {
      newErrors.phone = t('influencers.validationPhone');
    }

    if (!formData.password.trim()) {
      newErrors.password = t('influencers.validationPasswordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('influencers.validationPassword');
    }

    if (!formData.confirm_password.trim()) {
      newErrors.confirm_password = t('influencers.validationConfirmPasswordRequired');
    } else if (formData.confirm_password !== formData.password) {
      newErrors.confirm_password = t('influencers.validationMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onConfirm({
        display_name: formData.display_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        confirm_password: formData.confirm_password,
      });
    }
  };

  const handleClose = () => {
    setFormData({
      display_name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content add-user-modal-content add-influencer-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('influencers.modalTitle')}</h2>
          <button type="button" className="modal-close" onClick={handleClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="info-banner">
              <span className="info-icon">ℹ️</span>
              <p>{t('influencers.modalSubtitle')}</p>
            </div>

            <div className="form-group">
              <label htmlFor="influencer_display_name">{t('influencers.displayName')}</label>
              <input
                type="text"
                id="influencer_display_name"
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
                placeholder={t('influencers.displayNamePlaceholder')}
                required
                className={errors.display_name ? 'error' : ''}
              />
              {errors.display_name && <span className="error-message">{errors.display_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="influencer_email">{t('influencers.email')}</label>
              <input
                type="email"
                id="influencer_email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('influencers.emailPlaceholder')}
                autoComplete="off"
                required
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="influencer_phone">{t('influencers.phone')}</label>
              <input
                type="tel"
                id="influencer_phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder={t('influencers.phonePlaceholder')}
                required
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="influencer_password">{t('influencers.password')}</label>
              <input
                type="password"
                id="influencer_password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={t('influencers.passwordPlaceholder')}
                autoComplete="new-password"
                required
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="influencer_confirm_password">{t('influencers.confirmPassword')}</label>
              <input
                type="password"
                id="influencer_confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleInputChange}
                placeholder={t('influencers.confirmPasswordPlaceholder')}
                autoComplete="new-password"
                required
                className={errors.confirm_password ? 'error' : ''}
              />
              {errors.confirm_password && <span className="error-message">{errors.confirm_password}</span>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-create" disabled={isLoading}>
              {isLoading ? t('influencers.creating') : t('influencers.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInfluencerModal;
