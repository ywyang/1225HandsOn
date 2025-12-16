import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ErrorNotificationManager, ApiError, ConnectionMonitor } from '../../services/api';
import { ErrorMessage } from '../UI/ErrorMessage';

interface Notification {
  id: string;
  type: 'error' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!notification.persistent && notification.duration !== 0) {
      const duration = notification.duration || 5000;
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration, notification.persistent]);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  }, [notification.id, onDismiss]);

  const getIcon = () => {
    switch (notification.type) {
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out mb-3
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className={`
        p-4 rounded-lg border shadow-lg max-w-sm w-full
        ${getColorClasses()}
      `}>
        <div className="flex items-start">
          <span className="text-lg mr-3 flex-shrink-0">{getIcon()}</span>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">{notification.title}</div>
            <div className="text-sm mt-1 opacity-90">{notification.message}</div>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-3 flex-shrink-0 text-lg opacity-60 hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const connectionMonitor = ConnectionMonitor.getInstance();
    
    const unsubscribe = connectionMonitor.subscribe((online) => {
      setIsOnline(online);
      if (!online) {
        setShowOfflineMessage(true);
      } else if (showOfflineMessage) {
        // Show reconnected message briefly
        setTimeout(() => setShowOfflineMessage(false), 3000);
      }
    });

    return unsubscribe;
  }, [showOfflineMessage]);

  if (isOnline && !showOfflineMessage) {
    return null;
  }

  return (
    <div className={`
      fixed top-0 left-0 right-0 z-50 p-3 text-center text-white font-medium
      ${isOnline ? 'bg-green-600' : 'bg-red-600'}
    `}>
      {isOnline ? (
        <>🟢 Connection restored</>
      ) : (
        <>🔴 No internet connection - Some features may not work</>
      )}
    </div>
  );
}

export function NotificationManager() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const errorManager = ErrorNotificationManager.getInstance();
    
    const unsubscribe = errorManager.subscribe((error: ApiError) => {
      addNotification({
        type: 'error',
        title: 'API Error',
        message: error.message,
        persistent: error.status === 401 || error.status === 403,
        duration: error.status === 401 || error.status === 403 ? 0 : 8000
      });
    });

    return unsubscribe;
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Expose global notification functions
  useEffect(() => {
    (window as any).showNotification = addNotification;
    return () => {
      delete (window as any).showNotification;
    };
  }, [addNotification]);

  const notificationContainer = (
    <>
      <ConnectionStatus />
      <div className="fixed top-4 right-4 z-40 max-w-sm">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={removeNotification}
          />
        ))}
      </div>
    </>
  );

  return createPortal(notificationContainer, document.body);
}

// Global notification functions
export const showNotification = (notification: Omit<Notification, 'id'>) => {
  if ((window as any).showNotification) {
    (window as any).showNotification(notification);
  }
};

export const showSuccess = (title: string, message: string, duration?: number) => {
  showNotification({ type: 'success', title, message, duration });
};

export const showError = (title: string, message: string, persistent?: boolean) => {
  showNotification({ type: 'error', title, message, persistent, duration: persistent ? 0 : 8000 });
};

export const showWarning = (title: string, message: string, duration?: number) => {
  showNotification({ type: 'warning', title, message, duration });
};

export const showInfo = (title: string, message: string, duration?: number) => {
  showNotification({ type: 'info', title, message, duration });
};