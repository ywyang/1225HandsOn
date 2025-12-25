import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const { state } = useAuth();

  if (!state.user) return null;

  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊', description: 'Overview & Analytics' },
    { path: '/admin/exercises', label: 'Exercise Management', icon: '📝', description: 'Create & Manage' },
    { path: '/admin/exercise1-stats', label: 'Exercise KIRO Stats', icon: '📋', description: 'Exercise KIRO Analysis' },
    { path: '/admin/exercise1-stats-enhanced', label: 'Exercise KIRO Stats Pro', icon: '✨', description: 'Enhanced Dashboard' },
    { path: '/admin/quicksuite-stats', label: 'Quick Suite Stats', icon: '🚀', description: 'Company Reports' },
    { path: '/admin/statistics', label: 'Statistics', icon: '📈', description: 'Detailed Reports' },
    // { path: '/admin/rankings', label: 'Rankings', icon: '🏆', description: 'Student Leaderboard' },
    { path: '/admin/sql-query', label: 'SQL Query', icon: '🗄️', description: 'Database Console' },
  ];

  const studentNavItems = [
    { path: '/student/dashboard', label: 'Dashboard', icon: '🏠', description: 'Your Overview' },
    { path: '/student/exercises', label: 'Exercises', icon: '📚', description: 'Available Tasks' },
    { path: '/student/results', label: 'My Results', icon: '📊', description: 'Progress & Scores' },
    { path: '/student/profile', label: 'Profile', icon: '👤', description: 'Account Settings' },
  ];

  const navItems = state.user.role === 'admin' ? adminNavItems : studentNavItems;

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      <aside className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-strong border-r border-gray-200 z-20
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Navigation Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Navigation
              </h2>
              <button
                onClick={onClose}
                className="lg:hidden p-1 rounded-md hover:bg-gray-200 focus-visible-ring"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 overflow-y-auto scrollbar-hide">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `group flex items-start space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 shadow-sm border-l-4 border-primary-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</div>
                    </div>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Info Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-semibold">
                  {state.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {state.user.name}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {state.user.role}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}