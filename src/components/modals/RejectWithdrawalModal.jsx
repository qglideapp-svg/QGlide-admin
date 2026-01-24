import React, { useState, useEffect } from 'react';
import './RejectWithdrawalModal.css';

const RejectWithdrawalModal = ({ isOpen, onClose, onConfirm, withdrawalData, isLoading }) => {
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { value } = e.target;
    setReason(value);
    
    // Clear error when user starts typing
    if (errors.reason) {
      setErrors(prev => ({
        ...prev,
        reason: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!reason.trim()) {
      newErrors.reason = 'Rejection reason is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Call onConfirm with reason
    onConfirm(reason.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content reject-withdrawal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Reject Withdrawal Request</h3>
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
              <label htmlFor="rejection-reason">
                Rejection Reason <span className="required">*</span>
              </label>
              <textarea
                id="rejection-reason"
                name="reason"
                value={reason}
                onChange={handleInputChange}
                placeholder="Enter the reason for rejecting this withdrawal request"
                rows={4}
                className={errors.reason ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.reason && <span className="error-message">{errors.reason}</span>}
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
                className="btn-reject" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined">hourglass_empty</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">cancel</span>
                    Reject
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

export default RejectWithdrawalModal;
