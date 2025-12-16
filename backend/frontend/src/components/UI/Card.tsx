import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  gradient?: boolean;
  glass?: boolean;
}

export function Card({ 
  children, 
  title, 
  subtitle,
  className = '', 
  padding = 'md',
  hover = false,
  gradient = false,
  glass = false
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const baseClasses = 'rounded-xl border transition-all duration-300';
  
  const backgroundClasses = glass 
    ? 'glass' 
    : gradient 
    ? 'bg-gradient-to-br from-white to-gray-50' 
    : 'bg-white';

  const shadowClasses = hover 
    ? 'shadow-soft hover:shadow-medium border-gray-200' 
    : 'shadow-soft border-gray-200';

  return (
    <div className={`${baseClasses} ${backgroundClasses} ${shadowClasses} ${hover ? 'hover:scale-[1.02]' : ''} ${className}`}>
      {(title || subtitle) && (
        <div className="border-b border-gray-100 px-6 py-4 bg-gray-50/50 rounded-t-xl">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      )}
      <div className={paddingClasses[padding]}>
        {children}
      </div>
    </div>
  );
}