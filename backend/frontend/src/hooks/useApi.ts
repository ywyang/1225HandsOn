import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LoadingManager, 
  RealTimeUpdater, 
  ErrorNotificationManager, 
  ConnectionMonitor,
  ApiError 
} from '../services/api';

// Generic API hook for managing API calls with loading, error, and retry states
export function useApiCall<T>(
  apiFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    immediate?: boolean;
    retryOnError?: boolean;
    maxRetries?: number;
    retryDelay?: number;
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
  } = {}
) {
  const {
    immediate = true,
    retryOnError = true,
    maxRetries = 3,
    retryDelay = 1000,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (forceRetry = false) => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction();
      
      if (!abortControllerRef.current.signal.aborted) {
        setData(result);
        setRetryCount(0);
        onSuccess?.(result);
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        const apiError = err as ApiError;
        setError(apiError);
        onError?.(apiError);

        // Auto-retry logic
        if (retryOnError && retryCount < maxRetries && !forceRetry) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            execute(true);
          }, retryDelay * Math.pow(2, retryCount));
        }
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [apiFunction, retryOnError, maxRetries, retryDelay, retryCount, onSuccess, onError]);

  const retry = useCallback(() => {
    setRetryCount(0);
    execute();
  }, [execute]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setRetryCount(0);
    setLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies);

  return {
    data,
    loading,
    error,
    retryCount,
    execute,
    retry,
    reset,
    isRetrying: retryCount > 0 && loading
  };
}

// Hook for managing multiple API calls
export function useApiState() {
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());
  const [errors, setErrors] = useState<ApiError[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const loadingManager = LoadingManager.getInstance();
    const errorManager = ErrorNotificationManager.getInstance();
    const connectionMonitor = ConnectionMonitor.getInstance();

    const unsubscribeLoading = loadingManager.subscribe(setLoadingStates);
    const unsubscribeError = errorManager.subscribe((error) => {
      setErrors(prev => [...prev, error]);
    });
    const unsubscribeConnection = connectionMonitor.subscribe(setIsOnline);

    return () => {
      unsubscribeLoading();
      unsubscribeError();
      unsubscribeConnection();
    };
  }, []);

  const clearError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return loadingStates.get(key) || false;
    }
    return Array.from(loadingStates.values()).some(loading => loading);
  }, [loadingStates]);

  return {
    isLoading,
    errors,
    isOnline,
    clearError,
    clearAllErrors,
    hasErrors: errors.length > 0
  };
}

// Hook for real-time data updates
export function useRealTimeData<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  options: {
    enabled?: boolean;
    interval?: number;
    onUpdate?: (data: T) => void;
    onError?: (error: ApiError) => void;
  } = {}
) {
  const {
    enabled = true,
    interval = 30000,
    onUpdate,
    onError
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Use refs to avoid recreating updateData on every render
  const onUpdateRef = useRef(onUpdate);
  const onErrorRef = useRef(onError);
  
  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onErrorRef.current = onError;
  }, [onUpdate, onError]);

  const updateData = useCallback(async () => {
    try {
      const result = await fetchFunction();
      setData(result);
      setLastUpdated(new Date());
      onUpdateRef.current?.(result);
    } catch (error) {
      onErrorRef.current?.(error as ApiError);
    }
  }, [fetchFunction]);

  useEffect(() => {
    if (!enabled) return;

    const realTimeUpdater = RealTimeUpdater.getInstance();
    
    // Initial fetch
    updateData();
    
    // Start polling
    realTimeUpdater.startPolling(key, updateData, interval);

    return () => {
      realTimeUpdater.stopPolling(key);
    };
  }, [key, enabled, interval, updateData]);

  const forceUpdate = useCallback(() => {
    updateData();
  }, [updateData]);

  return {
    data,
    lastUpdated,
    forceUpdate
  };
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>(
  initialData: T | null,
  updateFunction: (data: T) => Promise<T>
) {
  const [data, setData] = useState<T | null>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const update = useCallback(async (optimisticData: T) => {
    const previousData = data;
    
    try {
      setIsUpdating(true);
      setError(null);
      
      // Apply optimistic update immediately
      setData(optimisticData);
      
      // Perform actual update
      const result = await updateFunction(optimisticData);
      setData(result);
      return result;
    } catch (err) {
      // Revert on error
      setData(previousData);
      setError(err as ApiError);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [data, updateFunction]);

  return {
    data,
    isUpdating,
    error,
    update
  };
}

// Hook for managing form submissions with API integration
export function useApiForm<T>(
  submitFunction: (data: T) => Promise<any>,
  options: {
    onSuccess?: (result: any) => void;
    onError?: (error: ApiError) => void;
    resetOnSuccess?: boolean;
    showSuccessNotification?: boolean;
    showErrorNotification?: boolean;
  } = {}
) {
  const {
    onSuccess,
    onError,
    resetOnSuccess = false,
    showSuccessNotification = true,
    showErrorNotification = true
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = useCallback(async (data: T) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

      const result = await submitFunction(data);
      
      setSuccess(true);
      onSuccess?.(result);
      
      if (showSuccessNotification && (window as any).showNotification) {
        (window as any).showNotification({
          type: 'success',
          title: 'Success',
          message: 'Operation completed successfully',
          duration: 3000
        });
      }
      
      if (resetOnSuccess) {
        setTimeout(() => setSuccess(false), 3000);
      }
      
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      onError?.(apiError);
      
      if (showErrorNotification && (window as any).showNotification) {
        (window as any).showNotification({
          type: 'error',
          title: 'Error',
          message: apiError.message,
          duration: 8000
        });
      }
      
      throw apiError;
    } finally {
      setIsSubmitting(false);
    }
  }, [submitFunction, onSuccess, onError, resetOnSuccess, showSuccessNotification, showErrorNotification]);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
    setIsSubmitting(false);
  }, []);

  return {
    submit,
    isSubmitting,
    error,
    success,
    reset
  };
}

// Hook for batch API operations
export function useBatchApi<T>(
  operations: (() => Promise<T>)[],
  options: {
    onComplete?: (results: T[]) => void;
    onError?: (errors: ApiError[]) => void;
    stopOnFirstError?: boolean;
  } = {}
) {
  const {
    onComplete,
    onError,
    stopOnFirstError = false
  } = options;

  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<T[]>([]);
  const [errors, setErrors] = useState<ApiError[]>([]);

  const execute = useCallback(async () => {
    setIsExecuting(true);
    setProgress(0);
    setResults([]);
    setErrors([]);

    const batchResults: T[] = [];
    const batchErrors: ApiError[] = [];

    for (let i = 0; i < operations.length; i++) {
      try {
        const result = await operations[i]();
        batchResults.push(result);
        setProgress(((i + 1) / operations.length) * 100);
      } catch (err) {
        const apiError = err as ApiError;
        batchErrors.push(apiError);
        
        if (stopOnFirstError) {
          break;
        }
      }
    }

    setResults(batchResults);
    setErrors(batchErrors);
    setIsExecuting(false);

    if (batchErrors.length > 0) {
      onError?.(batchErrors);
    } else {
      onComplete?.(batchResults);
    }
  }, [operations, onComplete, onError, stopOnFirstError]);

  return {
    execute,
    isExecuting,
    progress,
    results,
    errors,
    hasErrors: errors.length > 0
  };
}

// Hook for API caching
export function useApiCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  options: {
    ttl?: number; // Time to live in milliseconds
    staleWhileRevalidate?: boolean;
  } = {}
) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    staleWhileRevalidate = true
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const isStale = useCallback(() => {
    if (!lastFetched) return true;
    return Date.now() - lastFetched.getTime() > ttl;
  }, [lastFetched, ttl]);

  const fetch = useCallback(async (force = false) => {
    if (!force && !isStale() && data) {
      return data;
    }

    try {
      if (!staleWhileRevalidate || !data) {
        setLoading(true);
      }
      setError(null);

      const result = await fetchFunction();
      setData(result);
      setLastFetched(new Date());
      
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, isStale, data, staleWhileRevalidate]);

  const invalidate = useCallback(() => {
    setLastFetched(null);
    setData(null);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    data,
    loading,
    error,
    fetch,
    invalidate,
    isStale: isStale(),
    lastFetched
  };
}