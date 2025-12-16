import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  dot = false
}: BadgeProps) {
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800 border-primary-200',
    secondary: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-success-100 text-success-800 border-success-200',
    warning: 'bg-warning-100 text-warning-800 border-warning-200',
    danger: 'bg-danger-100 text-danger-800 border-danger-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const dotColors = {
    primary: 'bg-primary-600',
    secondary: 'bg-gray-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600',
    info: 'bg-blue-600',
  };

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full border
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `}>
      {dot && (
        <span className={`
          w-2 h-2 rounded-full mr-1.5
          ${dotColors[variant]}
        `} />
      )}
      {children}
    </span>
  );
}