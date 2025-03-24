import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  type: 'success' | 'error' | 'warning' | 'info';
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ 
  children, 
  type, 
  dismissible = false,
  onDismiss
}) => {
  const getAlertClasses = () => {
    const baseClasses = "p-4 mb-4 text-sm rounded-lg";
    
    switch (type) {
      case 'success':
        return `${baseClasses} text-green-800 bg-green-50 dark:bg-gray-800 dark:text-green-400`;
      case 'error':
        return `${baseClasses} text-red-800 bg-red-50 dark:bg-gray-800 dark:text-red-400`;
      case 'warning':
        return `${baseClasses} text-yellow-800 bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300`;
      case 'info':
      default:
        return `${baseClasses} text-blue-800 bg-blue-50 dark:bg-gray-800 dark:text-blue-400`;
    }
  };

  return (
    <div className={getAlertClasses()} role="alert">
      <div className="flex items-center justify-between">
        <div>{children}</div>
        {dismissible && onDismiss && (
          <button
            type="button"
            className="ml-auto -mx-1.5 -my-1.5 text-gray-500 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onDismiss}
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}; 