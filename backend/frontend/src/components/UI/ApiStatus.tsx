import React, { useState, useEffect } from 'react';
import { ConnectionMonitor, LoadingManager } from '../../services/api';
import { Badge } from './Badge';
import { LoadingSpinner } from './LoadingSpinner';

interface ApiStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function ApiStatus({ className = '', showDetails = false }: ApiStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());
  const [lastApiCall, setLastApiCall] = useState<Date | null>(null);
  const [apiHealth, setApiHealth] = useState<'healthy' | 'degraded' | 'down'>('healthy');

  useEffect(() => {
    const connectionMonitor = ConnectionMonitor.getInstance();
    const loadingManager = LoadingManager.getInstance();

    const unsubscribeConnection = connectionMonitor.subscribe(setIsOnline);
    const unsubscribeLoading = loadingManager.subscribe((states) => {
      setLoadingStates(new Map(states));
      if (Array.from(states.values()).some(loading => loading)) {
        setLastApiCall(new Date());
      }
    });

    // Simulate API health monitoring
    const healthCheck = setInterval(() => {
      if (isOnline) {
        // Simple health check based on recent activity and connection
        const now = new Date();
        const timeSinceLastCall = lastApiCall ? now.getTime() - lastApiCall.getTime() : 0;
        
        if (timeSinceLastCall > 5 * 60 * 1000) { // 5 minutes
          setApiHealth('degraded');
        } else {
          setApiHealth('healthy');
        }
      } else {
        setApiHealth('down');
      }
    }, 30000); // Check every 30 seconds

    return () => {
      unsubscribeConnection();
      unsubscribeLoading();
      clearInterval(healthCheck);
    };
  }, [isOnline, lastApiCall]);

  const hasActiveRequests = Array.from(loadingStates.values()).some(loading => loading);
  const activeRequestCount = Array.from(loadingStates.values()).filter(loading => loading).length;

  const getStatusColor = () => {
    if (!isOnline) return 'danger';
    if (apiHealth === 'down') return 'danger';
    if (apiHealth === 'degraded') return 'warning';
    return 'success';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (apiHealth === 'down') return 'API Down';
    if (apiHealth === 'degraded') return 'API Degraded';
    return 'Online';
  };

  const getStatusIcon = () => {
    if (!isOnline) return '🔴';
    if (apiHealth === 'down') return '🔴';
    if (apiHealth === 'degraded') return '🟡';
    return '🟢';
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-sm">{getStatusIcon()}</span>
        {hasActiveRequests && <LoadingSpinner size="xs" />}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Badge variant={getStatusColor()} className="flex items-center space-x-1">
        <span>{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
      </Badge>
      
      {hasActiveRequests && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <LoadingSpinner size="xs" />
          <span>{activeRequestCount} active request{activeRequestCount !== 1 ? 's' : ''}</span>
        </div>
      )}
      
      {lastApiCall && (
        <span className="text-xs text-gray-500">
          Last activity: {lastApiCall.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

// Compact status indicator for headers/footers
export function ApiStatusIndicator({ className = '' }: { className?: string }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasActiveRequests, setHasActiveRequests] = useState(false);

  useEffect(() => {
    const connectionMonitor = ConnectionMonitor.getInstance();
    const loadingManager = LoadingManager.getInstance();

    const unsubscribeConnection = connectionMonitor.subscribe(setIsOnline);
    const unsubscribeLoading = loadingManager.subscribe((states) => {
      setHasActiveRequests(Array.from(states.values()).some(loading => loading));
    });

    return () => {
      unsubscribeConnection();
      unsubscribeLoading();
    };
  }, []);

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-400' : 'bg-red-400'
        } ${hasActiveRequests ? 'animate-pulse' : ''}`}
        title={isOnline ? 'Connected' : 'Disconnected'}
      />
      {hasActiveRequests && (
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" title="Loading..." />
      )}
    </div>
  );
}