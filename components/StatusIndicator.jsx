import React, { useEffect, useState } from 'react';

/**
 * Component to show submission status with animations
 * @param {Object} props - Component props
 * @param {string} props.status - Current status (uploading, success, error)
 * @param {string} props.successMessage - Message to show on success
 * @param {string} props.errorMessage - Message to show on error
 * @param {number} props.autoHideDuration - Time in ms to automatically hide success/error messages (0 to disable)
 */
const StatusIndicator = ({ 
  status, 
  successMessage = "Your suggestion has been recorded. Review pending during next treasury unlock.",
  errorMessage = "Unable to submit your proposal. Please try again.",
  autoHideDuration = 5000
}) => {
  const [visible, setVisible] = useState(true);
  
  // Auto-hide the status after specified duration
  useEffect(() => {
    if (autoHideDuration && (status === 'success' || status === 'error')) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [status, autoHideDuration]);
  
  // Reset visibility when status changes
  useEffect(() => {
    setVisible(true);
  }, [status]);
  
  if (!visible) return null;
  
  // Different status displays
  const getStatusContent = () => {
    switch (status) {
      case 'uploading':
        return (
          <div className="status-uploading">
            <div className="upload-animation">
              <div className="upload-pulse"></div>
            </div>
            <p>Processing your proposal...</p>
          </div>
        );
        
      case 'success':
        return (
          <div className="status-success">
            <div className="status-icon">
              <div className="status-dot success"></div>
            </div>
            <p>{successMessage}</p>
          </div>
        );
        
      case 'error':
        return (
          <div className="status-error">
            <div className="status-icon">
              <div className="status-dot error"></div>
            </div>
            <p>{errorMessage}</p>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className={`status-indicator ${status}`}>
      {getStatusContent()}
    </div>
  );
};

export default StatusIndicator;