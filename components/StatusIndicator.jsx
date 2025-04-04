const React = require('react');
const { useState, useEffect } = React;

function StatusIndicator({ 
  status, 
  successMessage = "Your suggestion has been recorded. Review pending during next treasury unlock.",
  errorMessage = "Unable to submit your proposal. Please try again.",
  autoHideDuration = 5000
}) {
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
        return React.createElement('div', { className: 'status-uploading' }, [
          React.createElement('div', { key: 'spinner', className: 'upload-animation' }, 
            React.createElement('div', { className: 'upload-pulse' })
          ),
          React.createElement('p', { key: 'message' }, 'Processing your proposal...')
        ]);
      case 'success':
        return React.createElement('div', { className: 'status-success' }, [
          React.createElement('div', { key: 'icon', className: 'status-icon' },
            React.createElement('div', { className: 'status-dot success' })
          ),
          React.createElement('p', { key: 'message' }, successMessage)
        ]);
      case 'error':
        return React.createElement('div', { className: 'status-error' }, [
          React.createElement('div', { key: 'icon', className: 'status-icon' },
            React.createElement('div', { className: 'status-dot error' })
          ),
          React.createElement('p', { key: 'message' }, errorMessage)
        ]);
      default:
        return null;
    }
  };
  
  return React.createElement('div', { className: `status-indicator ${status}` }, getStatusContent());
}

module.exports = StatusIndicator;