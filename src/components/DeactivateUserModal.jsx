import React, { useState } from 'react';
import './DeactivateUserModal.css';

const DeactivateUserModal = ({ isOpen, onClose, onConfirm, userName, isLoading }) => {
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('suspended');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm(status, reason);
    }
  };

  const handleClose = () => {
    setReason('');
    setStatus('suspended');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content deactivate-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Update User Status</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="warning-banner">
              <span className="warning-icon">⚠️</span>
              <p><strong>Warning:</strong> This action will restrict the user's access to the platform!</p>
            </div>
            <p>You are about to update the status for <strong>{userName}</strong>.</p>
            
            <div className="form-group">
              <label htmlFor="status">Status:</label>
              <select 
                id="status"
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
                <option value="banned">Banned</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reason">Reason for deactivation:</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason (e.g., fraud check, policy violation, etc.)"
                required
                rows={4}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-deactivate" disabled={isLoading || !reason.trim()}>
              {isLoading ? 'Processing...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeactivateUserModal;
