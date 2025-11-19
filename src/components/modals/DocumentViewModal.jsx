import React from 'react';
import './DocumentViewModal.css';

const DocumentViewModal = ({ isOpen, onClose, document }) => {
  if (!isOpen || !document) return null;

  const handleClose = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay document-modal-overlay" onClick={handleClose}>
      <div className="modal-content document-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Document Viewer</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="document-info">
            <h3 className="document-title">{document.name}</h3>
            <div className="document-meta">
              <span className={`document-status ${document.status?.toLowerCase()}`}>
                {document.status}
              </span>
              {document.uploadDate && (
                <span className="document-date">
                  Uploaded: {new Date(document.uploadDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
            </div>
          </div>

          <div className="document-viewer">
            {document.url ? (
              <img 
                src={document.url} 
                alt={document.name}
                className="document-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            
            <div className="document-placeholder" style={{ display: document.url ? 'none' : 'flex' }}>
              <div className="placeholder-content">
                <span className="material-symbols-outlined placeholder-icon">description</span>
                <p className="placeholder-text">Document not available</p>
                <p className="placeholder-subtext">
                  {document.url ? 'Failed to load document' : 'No document URL provided'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-close" onClick={onClose}>
            Close
          </button>
          {document.url && (
            <button 
              className="btn-download" 
              onClick={() => window.open(document.url, '_blank')}
            >
              <span className="material-symbols-outlined">download</span>
              Download
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewModal;
