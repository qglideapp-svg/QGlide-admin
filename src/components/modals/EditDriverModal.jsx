import React, { useState, useEffect } from 'react';
import './EditDriverModal.css';
import { useLanguage } from '../../contexts/LanguageContext';

const EditDriverModal = ({ isOpen, onClose, onConfirm, driverData, isLoading }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_color: '',
    license_plate: ''
  });

  // Pre-populate form when driverData changes
  useEffect(() => {
    if (driverData && isOpen) {
      setFormData({
        full_name: driverData.name || '',
        phone: driverData.personalDetails?.phone || '',
        vehicle_model: driverData.vehicleDetails?.model || '',
        vehicle_year: driverData.vehicleDetails?.year || new Date().getFullYear(),
        vehicle_color: driverData.vehicleDetails?.color || '',
        license_plate: driverData.vehicleDetails?.licensePlate || ''
      });
    }
  }, [driverData, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.full_name.trim()) {
      onConfirm(formData);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      full_name: '',
      phone: '',
      vehicle_model: '',
      vehicle_year: '',
      vehicle_color: '',
      license_plate: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('modals.editDriverProfile')}</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
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
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">{t('modals.phoneNumber')}</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={t('modals.enterPhoneNumber')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="vehicle_model">{t('modals.vehicleModel')}</label>
                <input
                  type="text"
                  id="vehicle_model"
                  name="vehicle_model"
                  value={formData.vehicle_model}
                  onChange={handleInputChange}
                  placeholder={t('modals.enterVehicleModel')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="vehicle_year">{t('modals.vehicleYear')}</label>
                <input
                  type="number"
                  id="vehicle_year"
                  name="vehicle_year"
                  value={formData.vehicle_year}
                  onChange={handleInputChange}
                  placeholder={t('modals.enterVehicleYear')}
                  min="1990"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div className="form-group">
                <label htmlFor="vehicle_color">{t('modals.vehicleColor')}</label>
                <input
                  type="text"
                  id="vehicle_color"
                  name="vehicle_color"
                  value={formData.vehicle_color}
                  onChange={handleInputChange}
                  placeholder={t('modals.enterVehicleColor')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="license_plate">{t('modals.licensePlate')}</label>
                <input
                  type="text"
                  id="license_plate"
                  name="license_plate"
                  value={formData.license_plate}
                  onChange={handleInputChange}
                  placeholder={t('modals.enterLicensePlate')}
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-save" disabled={isLoading || !formData.full_name.trim()}>
              {isLoading ? t('modals.saving') : t('modals.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDriverModal;
