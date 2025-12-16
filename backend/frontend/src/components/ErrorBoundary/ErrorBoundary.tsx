import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { ErrorNotificationManager, ConnectionMonitor } from '../../services/api';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isOnline: boolean;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private connectionUnsubscribe?: () => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isOnline: navigator.onLine,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidMount() {
    // Subscribe to connection changes
    const connectionMonitor = ConnectionMonitor.getInstance();
    this.connectionUnsubscribe = connectionMonitor.subscribe((isOnline) => {
      this.setState({ isOnline });
      
      // Auto-retry if connection is restored and we had an error
      if (isOnline && this.state.hasError && this.state.retryCount < 3) {
        setTimeout(() => {
          this.handleRetry();
        }, 1000);
      }
    });
  }

  componentWillUnmount() {
    if (this.connectionUnsubscribe) {
      this.connectionUnsubscribe();
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Report to error notification system
    ErrorNotificationManager.getInstance().notifyError({
      message: error.message,
      details: { error, errorInfo }
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  private getErrorType = (): 'network' | 'api' | 'client' | 'unknown' => {
    if (!this.state.isOnline) return 'network';
    
    const error = this.state.error;
    if (!error) return 'unknown';
    
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'network';
    }
    
    if (error.message.includes('API') || error.message.includes('server')) {
      return 'api';
    }
    
    return 'client';
  };

  private getErrorMessage = (): string => {
    const errorType = this.getErrorType();
    
    switch (errorType) {
      case 'network':
        return 'Network connection issue. Please check your internet connection and try again.';
      case 'api':
        return 'Server error. Our team has been notified and is working on a fix.';
      case 'client':
        return 'Application error. Please try refreshing the page.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  private getErrorIcon = (): string => {
    const errorType = this.getErrorType();
    
    switch (errorType) {
      case 'network':
        return '📡';
      case 'api':
        return '🔧';
      case 'client':
        return '⚠️';
      default:
        return '❌';
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.getErrorMessage();
      const errorIcon = this.getErrorIcon();

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="max-w-lg w-full text-center" padding="lg">
            <div className="text-6xl mb-4">{errorIcon}</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              {errorMessage}
            </p>
            
            {!this.state.isOnline && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <div className="flex items-center justify-center text-red-800">
                  <span className="mr-2">🔴</span>
                  <span className="text-sm font-medium">No internet connection</span>
                </div>
              </div>
            )}
            
            {this.state.retryCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <div className="text-blue-800 text-sm">
                  Retry attempt: {this.state.retryCount}/3
                </div>
              </div>
            )}
            
            {(import.meta.env.DEV || this.props.showDetails) && this.state.error && (
              <details className="text-left mb-6 p-4 bg-gray-100 rounded-lg">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  Error Details {import.meta.env.DEV ? '(Development)' : ''}
                </summary>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="space-y-3">
              {this.state.retryCount < 3 && (
                <Button onClick={this.handleRetry} className="w-full">
                  Try Again
                </Button>
              )}
              <Button 
                variant="secondary" 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Refresh Page
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'} 
                className="w-full"
              >
                Go Home
              </Button>
            </div>
            
            <div className="mt-6 text-xs text-gray-400">
              Error ID: {Date.now().toString(36)}
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}