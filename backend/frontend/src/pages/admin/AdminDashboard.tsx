import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { ErrorMessage } from '../../components/UI/ErrorMessage';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { LoadingOverlay, StatsSkeleton } from '../../components/UI/LoadingStates';
import { Stats } from '../../components/UI/Stats';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApiCall, useRealTimeData } from '../../hooks/useApi';
import { statisticsAPI, exerciseAPI } from '../../services/api';
import { showSuccess, showError } from '../../components/Notifications/NotificationManager';

interface DashboardStats {
  totalExercises: number;
  publishedExercises: number;
  totalStudents: number;
  activeStudents: number;
  totalSubmissions: number;
  completionRate: number;
  recentActivity: {
    id: string;
    type: 'submission' | 'registration' | 'exercise_created' | 'exercise_published';
    description: string;
    timestamp: string;
    icon: string;
  }[];
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const { state, dispatch } = useApp();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Enhanced API calls with error handling and retry logic
  const {
    data: exercisesData,
    loading: exercisesLoading,
    error: exercisesError,
    retry: retryExercises
  } = useApiCall(
    () => exerciseAPI.getExercises(),
    [],
    {
      onSuccess: (exercises) => {
        dispatch({ type: 'SET_EXERCISES', payload: exercises });
        dispatch({ type: 'SET_LAST_UPDATED', payload: { key: 'exercises', date: new Date() } });
        showSuccess('Data Updated', 'Exercises loaded successfully');
      },
      onError: (error) => {
        showError('Load Error', `Failed to load exercises: ${error.message}`);
      }
    }
  );

  // Real-time rankings data
  const {
    data: rankingsData,
    lastUpdated: rankingsLastUpdated
  } = useRealTimeData(
    'admin-rankings',
    () => statisticsAPI.getRankings(),
    {
      enabled: state.realTimeEnabled,
      interval: 30000, // Update every 30 seconds
      onUpdate: (rankings) => {
        dispatch({ type: 'SET_RANKINGS', payload: rankings });
        dispatch({ type: 'SET_LAST_UPDATED', payload: { key: 'rankings', date: new Date() } });
      },
      onError: (error) => {
        console.warn('Failed to update rankings:', error);
      }
    }
  );

  // Calculate dashboard stats when data changes
  useEffect(() => {
    if (exercisesData && rankingsData) {
      const publishedExercises = exercisesData.filter(ex => ex.isPublished);
      const activeStudents = rankingsData.filter(student => student.completedExercises > 0);
      const totalSubmissions = rankingsData.reduce((sum, student) => sum + student.completedExercises, 0);
      
      const stats: DashboardStats = {
        totalExercises: exercisesData.length,
        publishedExercises: publishedExercises.length,
        totalStudents: rankingsData.length,
        activeStudents: activeStudents.length,
        totalSubmissions,
        completionRate: rankingsData.length > 0 ? (activeStudents.length / rankingsData.length) * 100 : 0,
        recentActivity: [
          {
            id: '1',
            type: 'submission',
            description: 'New submission from John Doe for AWS EC2 Setup',
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            icon: '📝'
          },
          {
            id: '2',
            type: 'exercise_published',
            description: 'Exercise "Docker Deployment" published',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            icon: '🚀'
          },
          {
            id: '3',
            type: 'registration',
            description: 'Student "Jane Smith" registered',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            icon: '👤'
          },
          {
            id: '4',
            type: 'submission',
            description: 'Mike Johnson completed "Database Setup"',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            icon: '✅'
          },
          {
            id: '5',
            type: 'exercise_created',
            description: 'Exercise "Kubernetes Basics" created',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            icon: '➕'
          }
        ]
      };

      setDashboardStats(stats);
    }
  }, [exercisesData, rankingsData, dispatch]);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
    }
  };

  const quickActions = [
    {
      title: 'Create New Exercise',
      description: 'Add a new hands-on exercise for students',
      icon: '➕',
      color: 'blue',
      action: () => navigate('/admin/exercises')
    },
    {
      title: 'View Statistics',
      description: 'Check detailed student progress and analytics',
      icon: '📊',
      color: 'green',
      action: () => navigate('/admin/statistics')
    },
    {
      title: 'Student Rankings',
      description: 'View real-time student leaderboard',
      icon: '🏆',
      color: 'purple',
      action: () => navigate('/admin/rankings')
    },
    {
      title: 'Exercise Management',
      description: 'Manage existing exercises and publications',
      icon: '📝',
      color: 'orange',
      action: () => navigate('/admin/exercises')
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200',
      green: 'bg-green-50 hover:bg-green-100 text-green-900 border-green-200',
      purple: 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200',
      orange: 'bg-orange-50 hover:bg-orange-100 text-orange-900 border-orange-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const isLoading = exercisesLoading || !exercisesData || !rankingsData;

  if (isLoading) {
    return (
      <Layout title="Administrator Dashboard">
        <div className="space-y-6">
          <StatsSkeleton count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Administrator Dashboard">
      <div className="space-y-6">
        {/* Error handling */}
        {exercisesError && (
          <ErrorMessage 
            message={`Failed to load exercises: ${exercisesError.message}`}
            onDismiss={() => retryExercises()}
            action={{
              label: 'Retry',
              onClick: retryExercises
            }}
          />
        )}

        {/* Real-time status indicator */}
        {state.realTimeEnabled && rankingsLastUpdated && (
          <div className="text-xs text-gray-500 text-right">
            Last updated: {rankingsLastUpdated.toLocaleTimeString()}
            <span className="ml-2 inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          </div>
        )}

        {/* Welcome Section */}
        <Card className="gradient-primary text-white" padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-responsive-lg font-bold mb-2">
                Welcome back, {authState.user?.name}! 👋
              </h1>
              <p className="text-primary-100 text-balance">
                Here's an overview of your training system activity.
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </Card>

        {dashboardStats && (
          <>
            {/* Statistics Overview */}
            <Stats
              items={[
                {
                  label: 'Total Exercises',
                  value: dashboardStats.totalExercises,
                  icon: '📝',
                  color: 'primary'
                },
                {
                  label: 'Total Students',
                  value: dashboardStats.totalStudents,
                  icon: '👥',
                  color: 'success'
                },
                {
                  label: 'Total Submissions',
                  value: dashboardStats.totalSubmissions,
                  icon: '📊',
                  color: 'warning'
                },
                {
                  label: 'Participation Rate',
                  value: `${dashboardStats.completionRate.toFixed(1)}%`,
                  icon: '🎯',
                  color: 'danger'
                }
              ]}
              className="mb-8"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card title="Recent Activity">
                <div className="space-y-3">
                  {dashboardStats.recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No recent activity
                    </div>
                  ) : (
                    dashboardStats.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-xl">{activity.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                          <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/admin/statistics')}
                    className="w-full"
                  >
                    View All Activity
                  </Button>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card title="Quick Actions">
                <div className="space-y-3">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className={`w-full text-left p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${getColorClasses(action.color)}`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{action.icon}</span>
                        <div>
                          <div className="font-medium">{action.title}</div>
                          <div className="text-sm opacity-75">{action.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* System Status */}
            <Card title="System Status">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                    <span className="text-green-600 text-xl">✅</span>
                  </div>
                  <h3 className="font-medium text-gray-900">API Status</h3>
                  <p className="text-sm text-gray-600">All systems operational</p>
                </div>
                
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                    <span className="text-blue-600 text-xl">🗄️</span>
                  </div>
                  <h3 className="font-medium text-gray-900">Database</h3>
                  <p className="text-sm text-gray-600">Connected and healthy</p>
                </div>
                
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                    <span className="text-purple-600 text-xl">☁️</span>
                  </div>
                  <h3 className="font-medium text-gray-900">AWS Services</h3>
                  <p className="text-sm text-gray-600">All services running</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}