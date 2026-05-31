import React, { createContext, useContext, useState, useEffect } from 'react';

const ConfirmationContext = createContext(null);

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};

export const ConfirmationProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // 'info' | 'warning' | 'danger' | 'success'
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    resolve: null,
  });

  const [isLoading, setIsLoading] = useState(false);

  const confirm = (options) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        type: options.type || 'info',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        onConfirm: options.onConfirm || null,
        resolve,
      });
      setIsLoading(false);
    });
  };

  const handleClose = (value) => {
    if (modalState.resolve) {
      modalState.resolve(value);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
    setIsLoading(false);
  };

  const handleConfirm = async () => {
    if (modalState.onConfirm) {
      setIsLoading(true);
      try {
        await modalState.onConfirm();
        handleClose(true);
      } catch (err) {
        console.error('Error in confirmation action:', err);
        alert(err.response?.data?.message || err.message || 'An error occurred during this action.');
        setIsLoading(false); // keep modal open so user can retry or cancel
      }
    } else {
      handleClose(true);
    }
  };

  // Keyboard accessibility: ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (modalState.isOpen && e.key === 'Escape' && !isLoading) {
        handleClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalState.isOpen, isLoading]);

  const getIcon = () => {
    switch (modalState.type) {
      case 'danger':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        );
      case 'warning':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      case 'success':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case 'info':
      default:
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
    }
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {modalState.isOpen && (
        <div 
          className="confirm-modal-overlay" 
          onClick={() => {
            if (!isLoading) handleClose(false);
          }}
        >
          <div 
            className="confirm-modal-card" 
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
          >
            <div className="confirm-modal-header">
              <div className={`confirm-modal-icon-wrap ${modalState.type}`}>
                {getIcon()}
              </div>
              <div className="confirm-modal-content">
                <h3 id="confirm-modal-title" className="confirm-modal-title">{modalState.title}</h3>
                <p className="confirm-modal-message">{modalState.message}</p>
              </div>
            </div>
            <div className="confirm-modal-actions">
              <button 
                type="button" 
                className="confirm-modal-btn cancel" 
                onClick={() => handleClose(false)}
                disabled={isLoading}
              >
                {modalState.cancelText}
              </button>
              <button 
                type="button" 
                className={`confirm-modal-btn confirm ${modalState.type}`} 
                onClick={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="confirm-modal-spinner"></span>
                    Processing...
                  </>
                ) : (
                  modalState.confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmationContext.Provider>
  );
};
