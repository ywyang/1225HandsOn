import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { Exercise, Submission, StudentRanking } from '../contexts/AppContext';
import { User } from '../contexts/AuthContext';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const DEFAULT_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Enhanced error types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

// Loading state management
export class LoadingManager {
  private static instance: LoadingManager;
  private loadingStates = new Map<string, boolean>();
  private listeners = new Set<(states: Map<string, boolean>) => void>();

  static getInstance(): LoadingManager {
    if (!LoadingManager.instance) {
      LoadingManager.instance = new LoadingManager();
    }
    return LoadingManager.instance;
  }

  setLoading(key: string, loading: boolean) {
    this.loadingStates.set(key, loading);
    this.notifyListeners();
  }

  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }

  subscribe(listener: (states: Map<string, boolean>) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(new Map(this.loadingStates)));
  }
}

// Retry utility function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain error types
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        if (status === 401 || status === 403 || status === 404 || status === 422) {
          throw error;
        }
      }
      
      if (attempt < maxRetries) {
        await sleep(delay * Math.pow(2, attempt)); // Exponential backoff
      }
    }
  }
  
  throw lastError!;
};

// Enhanced error handler
const handleApiError = (error: any): ApiError => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    const code = error.response?.data?.code || error.code;
    
    return {
      message: message || 'An unexpected error occurred',
      status,
      code,
      details: error.response?.data
    };
  }
  
  return {
    message: error.message || 'An unexpected error occurred',
    details: error
  };
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and loading state
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Set loading state based on request URL
    const loadingKey = `${config.method?.toUpperCase()}_${config.url}`;
    LoadingManager.getInstance().setLoading(loadingKey, true);
    
    return config;
  },
  (error) => {
    return Promise.reject(handleApiError(error));
  }
);

// Response interceptor for error handling and loading state cleanup
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Clear loading state
    const loadingKey = `${response.config.method?.toUpperCase()}_${response.config.url}`;
    LoadingManager.getInstance().setLoading(loadingKey, false);
    
    return response;
  },
  (error) => {
    // Clear loading state
    if (error.config) {
      const loadingKey = `${error.config.method?.toUpperCase()}_${error.config.url}`;
      LoadingManager.getInstance().setLoading(loadingKey, false);
    }
    
    const apiError = handleApiError(error);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      ErrorNotificationManager.getInstance().notifyError({
        ...apiError,
        message: 'Session expired. Please log in again.'
      });
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } else if (error.response?.status >= 500) {
      // Server errors
      ErrorNotificationManager.getInstance().notifyError({
        ...apiError,
        message: 'Server error. Please try again later.'
      });
    } else if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      // Network errors
      ErrorNotificationManager.getInstance().notifyError({
        ...apiError,
        message: 'Network error. Please check your connection.'
      });
    } else {
      // Other errors
      ErrorNotificationManager.getInstance().notifyError(apiError);
    }
    
    return Promise.reject(apiError);
  }
);

// API Types
interface LoginResponse {
  user: User;
  token: string;
}

interface StudentRegistrationResponse {
  student: User;
  accessKey: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Enhanced API wrapper with retry logic
const apiRequest = async <T>(requestFn: () => Promise<AxiosResponse<ApiResponse<T>>>): Promise<T> => {
  try {
    const response = await retryRequest(requestFn);
    return response.data.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Authentication API
export const authAPI = {
  // Admin login
  adminLogin: async (username: string, password: string): Promise<LoginResponse> => {
    return apiRequest(() => 
      apiClient.post<ApiResponse<LoginResponse>>('/auth/admin/login', {
        username,
        password,
      })
    );
  },

  // Student registration
  studentRegister: async (name: string): Promise<StudentRegistrationResponse> => {
    return apiRequest(() =>
      apiClient.post<ApiResponse<StudentRegistrationResponse>>('/auth/student/register', {
        name,
      })
    );
  },

  // Student access key lookup
  studentLookup: async (name: string): Promise<{ accessKey: string }> => {
    return apiRequest(() =>
      apiClient.get<ApiResponse<{ accessKey: string }>>(`/auth/student/lookup/${encodeURIComponent(name)}`)
    );
  },
};

// Exercise API
export const exerciseAPI = {
  // Get all exercises (filtered by role)
  getExercises: async (): Promise<Exercise[]> => {
    return apiRequest(() =>
      apiClient.get<ApiResponse<Exercise[]>>('/exercises')
    );
  },

  // Create exercise (admin only)
  createExercise: async (exercise: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>): Promise<Exercise> => {
    return apiRequest(() =>
      apiClient.post<ApiResponse<Exercise>>('/exercises', exercise)
    );
  },

  // Update exercise (admin only)
  updateExercise: async (id: string, exercise: Partial<Exercise>): Promise<Exercise> => {
    return apiRequest(() =>
      apiClient.put<ApiResponse<Exercise>>(`/exercises/${id}`, exercise)
    );
  },

  // Delete exercise (admin only)
  deleteExercise: async (id: string): Promise<void> => {
    try {
      await retryRequest(() => apiClient.delete(`/exercises/${id}`));
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Publish exercise (admin only)
  publishExercise: async (id: string): Promise<Exercise> => {
    return apiRequest(() =>
      apiClient.put<ApiResponse<Exercise>>(`/exercises/${id}/publish`)
    );
  },

  // Unpublish exercise (admin only)
  unpublishExercise: async (id: string): Promise<Exercise> => {
    return apiRequest(() =>
      apiClient.put<ApiResponse<Exercise>>(`/exercises/${id}/unpublish`)
    );
  },
};

// Submission API
export const submissionAPI = {
  // Submit exercise completion data
  submitExercise: async (submissionData: {
    studentName: string;
    accessKey: string;
    exerciseId: string;
    ec2InstanceInfo: {
      operatingSystem: string;
      amiId: string;
      internalIpAddress: string;
      instanceType: string;
    };
  }): Promise<Submission> => {
    return apiRequest(() =>
      apiClient.post<ApiResponse<Submission>>('/submissions', submissionData)
    );
  },

  // Get student submissions
  getStudentSubmissions: async (accessKey: string): Promise<Submission[]> => {
    return apiRequest(() =>
      apiClient.get<ApiResponse<Submission[]>>(`/submissions/student/${accessKey}`)
    );
  },

  // Get exercise submissions (admin only)
  getExerciseSubmissions: async (exerciseId: string): Promise<Submission[]> => {
    return apiRequest(() =>
      apiClient.get<ApiResponse<Submission[]>>(`/submissions/exercise/${exerciseId}`)
    );
  },
};

// Statistics API
export const statisticsAPI = {
  // Get student rankings
  getRankings: async (): Promise<StudentRanking[]> => {
    return apiRequest(() =>
      apiClient.get<ApiResponse<StudentRanking[]>>('/statistics/rankings')
    );
  },

  // Get completion statistics
  getProgress: async (): Promise<any> => {
    return apiRequest(() =>
      apiClient.get<ApiResponse<any>>('/statistics/progress')
    );
  },

  // Get individual student stats
  getStudentStats: async (accessKey: string): Promise<any> => {
    return apiRequest(() =>
      apiClient.get<ApiResponse<any>>(`/statistics/student/${accessKey}`)
    );
  },
};

// Real-time updates using polling (can be enhanced with WebSockets later)
export class RealTimeUpdater {
  private static instance: RealTimeUpdater;
  private intervals = new Map<string, NodeJS.Timeout>();
  private callbacks = new Map<string, () => Promise<void>>();

  static getInstance(): RealTimeUpdater {
    if (!RealTimeUpdater.instance) {
      RealTimeUpdater.instance = new RealTimeUpdater();
    }
    return RealTimeUpdater.instance;
  }

  startPolling(key: string, callback: () => Promise<void>, intervalMs: number = 30000) {
    this.stopPolling(key);
    this.callbacks.set(key, callback);
    
    const interval = setInterval(async () => {
      try {
        await callback();
      } catch (error) {
        console.warn(`Real-time update failed for ${key}:`, error);
      }
    }, intervalMs);
    
    this.intervals.set(key, interval);
  }

  stopPolling(key: string) {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
      this.callbacks.delete(key);
    }
  }

  stopAllPolling() {
    this.intervals.forEach((interval, key) => {
      clearInterval(interval);
    });
    this.intervals.clear();
    this.callbacks.clear();
  }
}

// Enhanced error notification system
export class ErrorNotificationManager {
  private static instance: ErrorNotificationManager;
  private listeners = new Set<(error: ApiError) => void>();
  private errorHistory = new Map<string, { count: number; lastSeen: Date }>();

  static getInstance(): ErrorNotificationManager {
    if (!ErrorNotificationManager.instance) {
      ErrorNotificationManager.instance = new ErrorNotificationManager();
    }
    return ErrorNotificationManager.instance;
  }

  notifyError(error: ApiError) {
    // Prevent spam of identical errors
    const errorKey = `${error.status}_${error.message}`;
    const now = new Date();
    const existing = this.errorHistory.get(errorKey);
    
    if (existing && now.getTime() - existing.lastSeen.getTime() < 5000) {
      // Don't notify if same error occurred within 5 seconds
      existing.count++;
      return;
    }
    
    this.errorHistory.set(errorKey, { count: 1, lastSeen: now });
    this.listeners.forEach(listener => listener(error));
  }

  subscribe(listener: (error: ApiError) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  clearHistory() {
    this.errorHistory.clear();
  }
}

// Connection status monitor
export class ConnectionMonitor {
  private static instance: ConnectionMonitor;
  private isOnline = navigator.onLine;
  private listeners = new Set<(online: boolean) => void>();

  static getInstance(): ConnectionMonitor {
    if (!ConnectionMonitor.instance) {
      ConnectionMonitor.instance = new ConnectionMonitor();
      ConnectionMonitor.instance.init();
    }
    return ConnectionMonitor.instance;
  }

  private init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  getStatus(): boolean {
    return this.isOnline;
  }

  subscribe(listener: (online: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }
}

// SQL Query API
export const sqlAPI = {
  // Execute SQL query
  executeQuery: async (query: string): Promise<{
    rows: any[];
    rowCount: number;
    fields: any[];
    executionTime: string;
    query: string;
  }> => {
    return apiRequest(() =>
      apiClient.post<ApiResponse<{
        rows: any[];
        rowCount: number;
        fields: any[];
        executionTime: string;
        query: string;
      }>>('/sql/execute', { query })
    );
  },

  // Get database schema
  getSchema: async (): Promise<{
    tables: Array<{
      name: string;
      type: string;
      columns: Array<{
        name: string;
        dataType: string;
        nullable: boolean;
        defaultValue: string | null;
        position: number;
      }>;
    }>;
    totalTables: number;
  }> => {
    return apiRequest(() =>
      apiClient.get<ApiResponse<{
        tables: Array<{
          name: string;
          type: string;
          columns: Array<{
            name: string;
            dataType: string;
            nullable: boolean;
            defaultValue: string | null;
            position: number;
          }>;
        }>;
        totalTables: number;
      }>>('/sql/schema')
    );
  },

  // Get sample queries
  getSampleQueries: async (): Promise<Array<{
    name: string;
    description: string;
    query: string;
  }>> => {
    return apiRequest(() =>
      apiClient.get<ApiResponse<Array<{
        name: string;
        description: string;
        query: string;
      }>>>('/sql/samples')
    );
  },
};

// Export the configured axios instance
export default apiClient;