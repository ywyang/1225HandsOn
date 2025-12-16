import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { Card } from '../../components/UI/Card';
import { ErrorMessage } from '../../components/UI/ErrorMessage';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { useApp } from '../../contexts/AppContext';
import { statisticsAPI, exerciseAPI } from '../../services/api';

interface StatisticsData {
  totalStudents: number;
  totalExercises: number;
  totalSubmissions: number;
  completionRate: number;
  averageScore: number;
  exerciseStats: {
    exerciseId: string;
    exerciseTitle: string;
    totalSubmissions: number;
    averageScore: number;
    completionRate: number;
  }[];
  recentActivity: {
    id: string;
    type: 'submission' | 'registration' | 'exercise_created';
    description: string;
    timestamp: string;
  }[];
}

export function Statistics() {
  const { state, dispatch } = useApp();
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadStatistics();
  }, [selectedTimeRange]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      // Load all required data
      const [, rankings, exercises] = await Promise.all([
        statisticsAPI.getProgress(),
        statisticsAPI.getRankings(),
        exerciseAPI.getExercises()
      ]);

      // Calculate statistics
      const totalStudents = rankings.length;
      const totalExercises = exercises.length;
      const publishedExercises = exercises.filter(ex => ex.isPublished).length;
      
      // Mock some additional statistics data
      const mockStats: StatisticsData = {
        totalStudents,
        totalExercises,
        totalSubmissions: rankings.reduce((sum, student) => sum + student.completedExercises, 0),
        completionRate: publishedExercises > 0 ? (rankings.filter(s => s.completedExercises > 0).length / totalStudents) * 100 : 0,
        averageScore: rankings.length > 0 ? rankings.reduce((sum, student) => sum + student.totalScore, 0) / rankings.length : 0,
        exerciseStats: exercises.map(exercise => ({
          exerciseId: exercise.id,
          exerciseTitle: exercise.title,
          totalSubmissions: Math.floor(Math.random() * totalStudents),
          averageScore: Math.floor(Math.random() * exercise.maxScore),
          completionRate: Math.floor(Math.random() * 100)
        })),
        recentActivity: [
          {
            id: '1',
            type: 'submission',
            description: 'New submission from John Doe for AWS EC2 Setup',
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            type: 'registration',
            description: 'Student "Jane Smith" registered',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            type: 'exercise_created',
            description: 'Exercise "Docker Deployment" created',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      };

      setStatistics(mockStats);
      dispatch({ type: 'SET_RANKINGS', payload: rankings });
      
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load statistics' 
      });
    } finally {
      setLoading(false);
    }
  };

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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submission': return '📝';
      case 'registration': return '👤';
      case 'exercise_created': return '➕';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <Layout title="Statistics">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Statistics">
      <div className="space-y-6">
        {state.error && (
          <ErrorMessage 
            message={state.error} 
            onDismiss={() => dispatch({ type: 'SET_ERROR', payload: null })}
          />
        )}

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Statistics Dashboard</h1>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        {statistics && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{statistics.totalExercises}</div>
                <div className="text-sm text-gray-600">Total Exercises</div>
              </Card>
              
              <Card className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{statistics.totalStudents}</div>
                <div className="text-sm text-gray-600">Active Students</div>
              </Card>
              
              <Card className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{statistics.totalSubmissions}</div>
                <div className="text-sm text-gray-600">Total Submissions</div>
              </Card>
              
              <Card className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">{statistics.completionRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </Card>

              <Card className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">{statistics.averageScore.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Average Score</div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Exercise Performance */}
              <Card title="Exercise Performance">
                <div className="space-y-4">
                  {statistics.exerciseStats.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No exercise data available
                    </div>
                  ) : (
                    statistics.exerciseStats.map((exercise) => (
                      <div key={exercise.exerciseId} className="border-b border-gray-100 pb-3 last:border-b-0">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 truncate">{exercise.exerciseTitle}</h4>
                          <span className="text-sm text-gray-500 ml-2">{exercise.totalSubmissions} submissions</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <span className="text-gray-600">Avg Score:</span>
                            <span className="ml-1 font-medium">{exercise.averageScore}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-600">Completion:</span>
                            <span className="ml-1 font-medium">{exercise.completionRate}%</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${exercise.completionRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Recent Activity */}
              <Card title="Recent Activity">
                <div className="space-y-3">
                  {statistics.recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No recent activity
                    </div>
                  ) : (
                    statistics.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-xl">{getActivityIcon(activity.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                          <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Score Distribution Chart */}
            <Card title="Score Distribution">
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Distribution of student scores across all exercises
                </div>
                
                {/* Simple bar chart representation */}
                <div className="space-y-3">
                  {[
                    { range: '90-100', count: Math.floor(statistics.totalStudents * 0.15), color: 'bg-green-500' },
                    { range: '80-89', count: Math.floor(statistics.totalStudents * 0.25), color: 'bg-blue-500' },
                    { range: '70-79', count: Math.floor(statistics.totalStudents * 0.30), color: 'bg-yellow-500' },
                    { range: '60-69', count: Math.floor(statistics.totalStudents * 0.20), color: 'bg-orange-500' },
                    { range: '0-59', count: Math.floor(statistics.totalStudents * 0.10), color: 'bg-red-500' },
                  ].map((item) => (
                    <div key={item.range} className="flex items-center space-x-3">
                      <div className="w-16 text-sm text-gray-600">{item.range}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                        <div 
                          className={`${item.color} h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                          style={{ width: `${statistics.totalStudents > 0 ? (item.count / statistics.totalStudents) * 100 : 0}%` }}
                        >
                          <span className="text-white text-xs font-medium">{item.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}