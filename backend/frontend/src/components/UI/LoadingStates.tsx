import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

// Skeleton loading component for content placeholders
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave';
}

export function Skeleton({ 
  className = '', 
  width, 
  height, 
  variant = 'rectangular',
  animation = 'pulse'
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200';
  
  const variantClasses = {
    text: 'rounded h-4',
    rectangular: 'rounded-md',
    circular: 'rounded-full'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse' // Could be enhanced with wave animation
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

// Loading overlay component
interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  text?: string;
  className?: string;
  blur?: boolean;
}

export function LoadingOverlay({ 
  loading, 
  children, 
  text, 
  className = '',
  blur = false 
}: LoadingOverlayProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {loading && (
        <div className={`
          absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg
          ${blur ? 'backdrop-blur-sm' : ''}
        `}>
          <div className="text-center">
            <LoadingSpinner size="lg" />
            {text && <div className="mt-2 text-sm text-gray-600">{text}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// Inline loading state for buttons and small components
interface InlineLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function InlineLoading({ 
  loading, 
  children, 
  loadingText, 
  size = 'sm' 
}: InlineLoadingProps) {
  if (loading) {
    return (
      <div className="flex items-center">
        <LoadingSpinner size={size} variant="dots" />
        {loadingText && <span className="ml-2">{loadingText}</span>}
      </div>
    );
  }
  
  return <>{children}</>;
}

// Card skeleton for loading states
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center space-x-4 mb-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1">
            <Skeleton variant="text" width="60%" className="mb-2" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="90%" />
        </div>
        <div className="mt-4 flex space-x-2">
          <Skeleton variant="rectangular" width={80} height={32} />
          <Skeleton variant="rectangular" width={100} height={32} />
        </div>
      </div>
    </div>
  );
}

// Table skeleton for loading states
export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}: { 
  rows?: number; 
  columns?: number; 
  className?: string; 
}) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} variant="text" width="80%" />
            ))}
          </div>
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 border-b border-gray-200 last:border-b-0">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  variant="text" 
                  width={colIndex === 0 ? "90%" : "70%"} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stats skeleton for dashboard loading
export function StatsSkeleton({ count = 4, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${count} gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <Skeleton variant="circular" width={48} height={48} />
              <Skeleton variant="text" width="30%" />
            </div>
            <Skeleton variant="text" width="60%" className="mb-2" />
            <Skeleton variant="rectangular" width="100%" height={32} />
          </div>
        </div>
      ))}
    </div>
  );
}

// List skeleton for loading states
export function ListSkeleton({ 
  items = 5, 
  showAvatar = true, 
  className = '' 
}: { 
  items?: number; 
  showAvatar?: boolean; 
  className?: string; 
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="animate-pulse flex items-center space-x-4 w-full">
            {showAvatar && <Skeleton variant="circular" width={40} height={40} />}
            <div className="flex-1">
              <Skeleton variant="text" width="70%" className="mb-2" />
              <Skeleton variant="text" width="50%" />
            </div>
            <Skeleton variant="rectangular" width={80} height={24} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Progress skeleton
export function ProgressSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`${className}`}>
      <div className="animate-pulse">
        <div className="flex justify-between items-center mb-2">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="20%" />
        </div>
        <Skeleton variant="rectangular" width="100%" height={8} className="rounded-full" />
      </div>
    </div>
  );
}