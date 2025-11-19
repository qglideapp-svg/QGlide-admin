import React, { useState } from 'react';
import './DeleteUserModal.css';

const DeleteUserModal = ({ isOpen, onClose, onConfirm, userName, isLoading }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm(reason);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content delete-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Delete User Account</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="danger-banner">
              <span className="danger-icon">🚨</span>
              <p><strong>Danger:</strong> This action will permanently delete the user account and cannot be undone!</p>
            </div>
            <p>You are about to permanently delete the account for <strong>{userName}</strong>.</p>
            
            <div className="form-group">
              <label htmlFor="reason">Reason for deletion:</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason (e.g., requested by user, policy violation, etc.)"
                required
                rows={4}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-delete" disabled={isLoading || !reason.trim()}>
              {isLoading ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteUserModal;
