import React, { useState } from 'react';
import './SuspendDriverModal.css';

const SuspendDriverModal = ({ isOpen, onClose, onConfirm, driverName, isLoading }) => {
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Suspend Driver</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p>You are about to suspend <strong>{driverName}</strong></p>
            <label>Reason for suspension:</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason (e.g., Policy violation, Safety concerns, etc.)"
              required
              rows={4}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-suspend-confirm" disabled={isLoading || !reason.trim()}>
              {isLoading ? 'Suspending...' : 'Suspend Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuspendDriverModal;
