import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { RealTimeUpdater } from '../services/api';

// Types for exercises
export interface Exercise {
  id: string;
  title: string;
  description: string;
  requirements: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  maxScore: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  apiInfo?: string;
}

// Types for submissions
export interface Submission {
  id: string;
  studentId: string;
  exerciseId: string;
  clientIpAddress: string;
  ec2InstanceInfo: {
    operatingSystem: string;
    amiId: string;
    internalIpAddress: string;
    instanceType: string;
  };
  score: number;
  submittedAt: string;
  processingStatus: 'pending' | 'processed' | 'failed';
}

// Types for statistics
export interface StudentRanking {
  studentId: string;
  studentName: string;
  totalScore: number;
  completedExercises: number;
  averageCompletionTime: number;
  rank: number;
}

export interface AppState {
  exercises: Exercise[];
  submissions: Submission[];
  rankings: StudentRanking[];
  loading: boolean;
  error: string | null;
  lastUpdated: {
    exercises?: Date;
    submissions?: Date;
    rankings?: Date;
  };
  realTimeEnabled: boolean;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EXERCISES'; payload: Exercise[] }
  | { type: 'ADD_EXERCISE'; payload: Exercise }
  | { type: 'UPDATE_EXERCISE'; payload: Exercise }
  | { type: 'DELETE_EXERCISE'; payload: string }
  | { type: 'SET_SUBMISSIONS'; payload: Submission[] }
  | { type: 'ADD_SUBMISSION'; payload: Submission }
  | { type: 'SET_RANKINGS'; payload: StudentRanking[] }
  | { type: 'SET_LAST_UPDATED'; payload: { key: keyof AppState['lastUpdated']; date: Date } }
  | { type: 'SET_REAL_TIME_ENABLED'; payload: boolean };

// Initial state
const initialState: AppState = {
  exercises: [],
  submissions: [],
  rankings: [],
  loading: false,
  error: null,
  lastUpdated: {},
  realTimeEnabled: true,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'SET_EXERCISES':
      return {
        ...state,
        exercises: action.payload,
      };
    case 'ADD_EXERCISE':
      return {
        ...state,
        exercises: [...state.exercises, action.payload],
      };
    case 'UPDATE_EXERCISE':
      return {
        ...state,
        exercises: state.exercises.map(exercise =>
          exercise.id === action.payload.id ? action.payload : exercise
        ),
      };
    case 'DELETE_EXERCISE':
      return {
        ...state,
        exercises: state.exercises.filter(exercise => exercise.id !== action.payload),
      };
    case 'SET_SUBMISSIONS':
      return {
        ...state,
        submissions: action.payload,
      };
    case 'ADD_SUBMISSION':
      return {
        ...state,
        submissions: [...state.submissions, action.payload],
      };
    case 'SET_RANKINGS':
      return {
        ...state,
        rankings: action.payload,
      };
    case 'SET_LAST_UPDATED':
      return {
        ...state,
        lastUpdated: {
          ...state.lastUpdated,
          [action.payload.key]: action.payload.date,
        },
      };
    case 'SET_REAL_TIME_ENABLED':
      return {
        ...state,
        realTimeEnabled: action.payload,
      };
    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  enableRealTime: () => void;
  disableRealTime: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const enableRealTime = () => {
    dispatch({ type: 'SET_REAL_TIME_ENABLED', payload: true });
  };

  const disableRealTime = () => {
    dispatch({ type: 'SET_REAL_TIME_ENABLED', payload: false });
    RealTimeUpdater.getInstance().stopAllPolling();
  };

  // Cleanup real-time updates on unmount
  useEffect(() => {
    return () => {
      RealTimeUpdater.getInstance().stopAllPolling();
    };
  }, []);

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch, 
      enableRealTime, 
      disableRealTime 
    }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}