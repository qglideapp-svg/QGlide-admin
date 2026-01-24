import React, { useState, useEffect } from 'react';
import './AdminWithdrawModal.css';

const AdminWithdrawModal = ({ isOpen, onClose, onConfirm, availableBalance, isLoading }) => {
  const [formData, setFormData] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        amount: '',
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        notes: ''
      });
      setErrors({});
    }
  }, [isOpen]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    
    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Please enter a valid amount';
      } else if (availableBalance && amount > availableBalance) {
        newErrors.amount = 'Amount cannot exceed available balance';
      }
    }
    
    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }
    
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    }
    
    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Call onConfirm with form data
    onConfirm({
      amount: parseFloat(formData.amount),
      bankName: formData.bankName.trim(),
      accountNumber: formData.accountNumber.trim(),
      accountHolderName: formData.accountHolderName.trim(),
      notes: formData.notes.trim()
    });
  };

  if (!isOpen) return null;

  const availableBalanceNum = typeof availableBalance === 'number' 
    ? availableBalance 
    : (typeof availableBalance === 'object' && availableBalance?.value !== undefined
      ? (typeof availableBalance.value === 'number' ? availableBalance.value : parseFloat(availableBalance.value))
      : 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content admin-withdraw-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Admin Withdraw</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="modal-body">
          {availableBalanceNum > 0 && (
            <div className="balance-info">
              <div className="balance-label">Available Balance</div>
              <div className="balance-value">
                QAR {availableBalanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="withdraw-amount">
                Withdrawal Amount (QAR) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="withdraw-amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter amount"
                step="0.01"
                min="0"
                max={availableBalanceNum || undefined}
                className={errors.amount ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.amount && <span className="error-message">{errors.amount}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="bank-name">
                Bank Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="bank-name"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                placeholder="Enter bank name"
                className={errors.bankName ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.bankName && <span className="error-message">{errors.bankName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="account-number">
                Account Number <span className="required">*</span>
              </label>
              <input
                type="text"
                id="account-number"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                placeholder="Enter account number"
                className={errors.accountNumber ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.accountNumber && <span className="error-message">{errors.accountNumber}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="account-holder">
                Account Holder Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="account-holder"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleInputChange}
                placeholder="Enter account holder name"
                className={errors.accountHolderName ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.accountHolderName && <span className="error-message">{errors.accountHolderName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="withdraw-notes">
                Notes (Optional)
              </label>
              <textarea
                id="withdraw-notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes (optional)"
                rows={3}
                disabled={isLoading}
              />
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
                className="btn-submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined">hourglass_empty</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                    Submit Withdrawal
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

export default AdminWithdrawModal;
