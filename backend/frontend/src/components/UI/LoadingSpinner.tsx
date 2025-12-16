import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'spinner' | 'dots' | 'pulse';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  centered?: boolean;
}

export function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  variant = 'spinner',
  color = 'primary',
  centered = true
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colorClasses = {
    primary: 'border-primary-600',
    secondary: 'border-gray-600',
    success: 'border-success-600',
    warning: 'border-warning-600',
    danger: 'border-danger-600',
  };

  const containerClasses = centered ? 'flex justify-center items-center' : '';

  if (variant === 'dots') {
    const dotSizeClasses = {
      xs: 'w-1 h-1',
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4',
    };

    const dotColorClasses = {
      primary: 'bg-primary-600',
      secondary: 'bg-gray-600',
      success: 'bg-success-600',
      warning: 'bg-warning-600',
      danger: 'bg-danger-600',
    };

    return (
      <div className={`${containerClasses} ${className}`}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${dotSizeClasses[size]} ${dotColorClasses[color]} rounded-full animate-pulse`}
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'pulse') {
    const pulseColorClasses = {
      primary: 'bg-primary-600',
      secondary: 'bg-gray-600',
      success: 'bg-success-600',
      warning: 'bg-warning-600',
      danger: 'bg-danger-600',
    };

    return (
      <div className={`${containerClasses} ${className}`}>
        <div className={`${sizeClasses[size]} ${pulseColorClasses[color]} rounded-full animate-pulse opacity-75`} />
      </div>
    );
  }

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className={`${sizeClasses[size]} border-4 border-gray-200 ${colorClasses[color]} border-t-current rounded-full animate-spin`} />
    </div>
  );
}