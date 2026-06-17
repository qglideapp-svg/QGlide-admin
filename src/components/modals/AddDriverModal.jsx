import React, { useState } from 'react';
import './AddDriverModal.css';
import { useLanguage } from '../../contexts/LanguageContext';

const initialFormData = {
  full_name: '',
  phone: '',
  vehicle_model: '',
  vehicle_year: new Date().getFullYear(),
  vehicle_color: '',
  license_plate: ''
};

const AddDriverModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState(initialFormData);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      return;
    }
    onConfirm(formData);
  };

  const handleClose = () => {
    setFormData(initialFormData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content add-modal-content"
        style={{ width: 'min(96vw, 1200px)', maxWidth: '1200px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{t('drivers.addDriver')}</h2>
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
              {isLoading ? t('modals.creatingDriver') : t('modals.createDriver')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDriverModal;
