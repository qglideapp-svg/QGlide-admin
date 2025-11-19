import React, { useState, useEffect } from 'react';
import './EditUserModal.css';

const EditUserModal = ({ isOpen, onClose, onConfirm, userData, isLoading }) => {
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
      newErrors.full_name = 'Full name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[0-9\s\-\(\)]+$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
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
          <h2>Edit User Profile</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="info-banner">
              <span className="info-icon">ℹ️</span>
              <p><strong>Information:</strong> Update the user's profile details below.</p>
            </div>
            <p>You are editing the profile for <strong>{userData?.name || 'Unknown User'}</strong>.</p>
            
            <div className="form-group">
              <label htmlFor="full_name">Full Name:</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Enter full name"
                required
                className={errors.full_name ? 'error' : ''}
              />
              {errors.full_name && <span className="error-message">{errors.full_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number:</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number (e.g., +974 5599 1234)"
                required
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                required
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
