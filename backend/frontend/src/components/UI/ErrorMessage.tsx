import { ReactNode } from 'react';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
  variant?: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ErrorMessage({ 
  message, 
  onDismiss, 
  className = '',
  variant = 'error',
  title,
  action
}: ErrorMessageProps) {
  const variantStyles = {
    error: {
      container: 'bg-danger-50 border-danger-200 text-danger-800',
      icon: '❌',
      iconBg: 'bg-danger-100',
      iconColor: 'text-danger-600',
      button: 'text-danger-500 hover:text-danger-700'
    },
    warning: {
      container: 'bg-warning-50 border-warning-200 text-warning-800',
      icon: '⚠️',
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-600',
      button: 'text-warning-500 hover:text-warning-700'
    },
    info: {
      container: 'bg-primary-50 border-primary-200 text-primary-800',
      icon: 'ℹ️',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      button: 'text-primary-500 hover:text-primary-700'
    },
    success: {
      container: 'bg-success-50 border-success-200 text-success-800',
      icon: '✅',
      iconBg: 'bg-success-100',
      iconColor: 'text-success-600',
      button: 'text-success-500 hover:text-success-700'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className={`
      ${styles.container} 
      border rounded-lg p-4 relative animate-slide-down
      ${className}
    `}>
      <div className="flex items-start space-x-3">
        <div className={`${styles.iconBg} rounded-full p-1 flex-shrink-0`}>
          <span className="text-sm">{styles.icon}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-medium mb-1">{title}</h4>
          )}
          <p className="text-sm">{message}</p>
          
          {action && (
            <button
              onClick={action.onClick}
              className={`
                mt-2 text-sm font-medium underline hover:no-underline
                ${styles.button}
              `}
            >
              {action.label}
            </button>
          )}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`
              ${styles.button} 
              flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors
              focus-visible-ring
            `}
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}