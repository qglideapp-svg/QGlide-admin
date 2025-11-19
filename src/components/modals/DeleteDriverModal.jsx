import React, { useState } from 'react';
import './DeleteDriverModal.css';

const DeleteDriverModal = ({ isOpen, onClose, onConfirm, driverName, isLoading }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm(reason);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content delete-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Delete Driver</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="warning-banner">
              <span className="warning-icon">⚠️</span>
              <p><strong>Warning:</strong> This action cannot be undone!</p>
            </div>
            <p>You are about to permanently delete <strong>{driverName}</strong> from the system.</p>
            <label>Reason for deletion:</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason (e.g., Account closure request, Policy violation, etc.)"
              required
              rows={4}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-delete-confirm" disabled={isLoading || !reason.trim()}>
              {isLoading ? 'Deleting...' : 'Delete Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteDriverModal;
