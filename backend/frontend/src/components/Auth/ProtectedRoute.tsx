import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../UI/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'student';
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/' 
}: ProtectedRouteProps) {
  const { state } = useAuth();

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredRole && state.user?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    const userDashboard = state.user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
    return <Navigate to={userDashboard} replace />;
  }

  return <>{children}</>;
}