import React, { ReactNode, useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showSidebar?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function Layout({ 
  children, 
  title, 
  showSidebar = true,
  maxWidth = 'full'
}: LayoutProps) {
  const { state } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-none',
  };

  const shouldShowSidebar = showSidebar && state.isAuthenticated;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header 
        title={title} 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        showMenuButton={shouldShowSidebar}
      />
      
      <div className="flex relative">
        {shouldShowSidebar && (
          <>
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            
            <Sidebar 
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          </>
        )}
        
        <main className={`
          flex-1 transition-all duration-300 ease-in-out
          ${shouldShowSidebar ? 'lg:ml-64' : ''}
        `}>
          <div className={`
            container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8
            ${maxWidthClasses[maxWidth]}
          `}>
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}