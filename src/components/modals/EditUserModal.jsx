import React, { useState, useEffect } from 'react';
import './EditUserModal.css';
import { useLanguage } from '../../contexts/LanguageContext';

const EditUserModal = ({ isOpen, onClose, onConfirm, userData, isLoading }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState({});

  // Pre-populate form with current user data
  useEffect(() => {
    if (userData && isOpen) {
      setFormData({
        full_name: userData.name || '',
        phone: userData.phone || '',
        email: userData.email || ''
      });
      setErrors({});
    }
  }, [userData, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = t('modals.fullNameRequired');
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = t('modals.phoneRequired');
    } else if (!/^[\+]?[0-9\s\-\(\)]+$/.test(formData.phone.trim())) {
      newErrors.phone = t('modals.validPhone');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('modals.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = t('modals.validEmail');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onConfirm(formData);
    }
  };

  const handleClose = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('modals.editUserProfile')}</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="info-banner">
              <span className="info-icon">ℹ️</span>
              <p><strong>{t('modals.information')}:</strong> {t('modals.updateUserDetails')}</p>
            </div>
            <p>{t('modals.editingProfileFor')} <strong>{userData?.name || t('modals.unknownUser')}</strong>.</p>
            
            <div className="form-group">
              <label htmlFor="full_name">{t('modals.fullName')}</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder={t('modals.enterFullName')}
                required
                className={errors.full_name ? 'error' : ''}
              />
              {errors.full_name && <span className="error-message">{errors.full_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">{t('modals.phoneNumber')}</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder={t('modals.enterPhoneExample2')}
                required
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('modals.email')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('modals.enterEmail')}
                required
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-save" disabled={isLoading}>
              {isLoading ? t('modals.saving') : t('modals.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
