import React, { useState, useEffect } from 'react';
import './ApproveWithdrawalModal.css';

const ApproveWithdrawalModal = ({ isOpen, onClose, onConfirm, withdrawalData, isLoading }) => {
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setNotes('');
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { value } = e.target;
    setNotes(value);
    
    // Clear error when user starts typing
    if (errors.notes) {
      setErrors(prev => ({
        ...prev,
        notes: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!notes.trim()) {
      newErrors.notes = 'Notes are required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Call onConfirm with notes
    onConfirm(notes.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content approve-withdrawal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Approve Withdrawal Request</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="modal-body">
          {withdrawalData && (
            <div className="withdrawal-info">
              <div className="info-row">
                <span className="info-label">Driver:</span>
                <span className="info-value">
                  {typeof withdrawalData.driver_name === 'string' 
                    ? withdrawalData.driver_name 
                    : (withdrawalData.driver_name?.name || 'Unknown Driver')}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Amount:</span>
                <span className="info-value">
                  {typeof withdrawalData.amount === 'number' 
                    ? `QAR ${withdrawalData.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : withdrawalData.amount}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Request Date:</span>
                <span className="info-value">{withdrawalData.request_date || 'N/A'}</span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="admin-notes">
                Admin Notes <span className="required">*</span>
              </label>
              <textarea
                id="admin-notes"
                name="notes"
                value={notes}
                onChange={handleInputChange}
                placeholder="Enter approval notes (e.g., Approved and processed)"
                rows={4}
                className={errors.notes ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.notes && <span className="error-message">{errors.notes}</span>}
            </div>
            
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-approve" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined">hourglass_empty</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    Approve
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApproveWithdrawalModal;
