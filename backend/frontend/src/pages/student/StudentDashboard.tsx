import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { LoadingOverlay, StatsSkeleton, CardSkeleton } from '../../components/UI/LoadingStates';
import { ErrorMessage } from '../../components/UI/ErrorMessage';
import { Stats } from '../../components/UI/Stats';
import { Badge } from '../../components/UI/Badge';
import { Progress } from '../../components/UI/Progress';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useApiCall, useRealTimeData } from '../../hooks/useApi';
import { exerciseAPI, submissionAPI, statisticsAPI } from '../../services/api';
import { Exercise, Submission, StudentRanking } from '../../contexts/AppContext';
import { showSuccess, showError } from '../../components/Notifications/NotificationManager';

interface DashboardStats {
  completedExercises: number;
  averageScore: number;
  currentRank: number;
  availableExercises: number;
  totalScore: number;
}

export function StudentDashboard() {
  const { state: authState } = useAuth();
  const { state: appState, dispatch } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [upcomingExercises, setUpcomingExercises] = useState<Exercise[]>([]);

  const accessKey = authState.user?.accessKey;

  // Enhanced API calls with error handling
  const {
    data: exercisesData,
    loading: exercisesLoading,
    error: exercisesError,
    retry: retryExercises
  } = useApiCall(
    () => exerciseAPI.getExercises(),
    [accessKey],
    {
      immediate: !!accessKey,
      onSuccess: (exercises) => {
        dispatch({ type: 'SET_EXERCISES', payload: exercises });
        showSuccess('Data Updated', 'Exercises loaded successfully');
      },
      onError: (error) => {
        showError('Load Error', `Failed to load exercises: ${error.message}`);
      }
    }
  );

  const {
    data: submissionsData,
    loading: submissionsLoading,
    error: submissionsError,
    retry: retrySubmissions
  } = useApiCall(
    () => accessKey ? submissionAPI.getStudentSubmissions(accessKey) : Promise.resolve([]),
    [accessKey],
    {
      immediate: !!accessKey,
      onError: (error) => {
        showError('Load Error', `Failed to load submissions: ${error.message}`);
      }
    }
  );

  // Real-time rankings data
  const {
    data: rankingsData,
    lastUpdated: rankingsLastUpdated
  } = useRealTimeData(
    'student-rankings',
    () => statisticsAPI.getRankings(),
    {
      enabled: appState.realTimeEnabled && !!accessKey,
      interval: 45000, // Update every 45 seconds for students
      onUpdate: (rankings) => {
        dispatch({ type: 'SET_RANKINGS', payload: rankings });
      },
      onError: (error) => {
        console.warn('Failed to update rankings:', error);
      }
    }
  );

  // Calculate dashboard stats when data changes
  useEffect(() => {
    if (exercisesData && submissionsData && accessKey) {
      const publishedExercises = exercisesData.filter(e => e.isPublished);
      const completedExerciseIds = new Set(submissionsData.map(s => s.exerciseId));
      
      // Calculate best scores for completed exercises
      const exerciseScores = new Map<string, number>();
      submissionsData.forEach(submission => {
        const currentBest = exerciseScores.get(submission.exerciseId) || 0;
        if (submission.score > currentBest) {
          exerciseScores.set(submission.exerciseId, submission.score);
        }
      });

      const totalScore = Array.from(exerciseScores.values()).reduce((sum, score) => sum + score, 0);
      const completedCount = completedExerciseIds.size;
      const averageScore = completedCount > 0 ? totalScore / completedCount : 0;

      // Find student rank
      const studentRanking = rankingsData?.find((r: StudentRanking) => r.studentName === authState.user?.name);
      const currentRank = studentRanking?.rank || 0;

      setStats({
        completedExercises: completedCount,
        averageScore,
        currentRank,
        availableExercises: publishedExercises.length,
        totalScore
      });

      // Set recent submissions (last 3)
      const sortedSubmissions = submissionsData
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 3);
      setRecentSubmissions(sortedSubmissions);

      // Set upcoming exercises (not completed, up to 3)
      const incompletedExercises = publishedExercises
        .filter(exercise => !completedExerciseIds.has(exercise.id))
        .slice(0, 3);
      setUpcomingExercises(incompletedExercises);
    }
  }, [exercisesData, submissionsData, rankingsData, accessKey, authState.user?.name, dispatch]);

  const getExerciseById = (id: string): Exercise | undefined => {
    return appState.exercises.find(e => e.id === id);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-50 text-green-700';
      case 'intermediate':
        return 'bg-yellow-50 text-yellow-700';
      case 'advanced':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '🟢';
      case 'intermediate':
        return '🟡';
      case 'advanced':
        return '🔴';
      default:
        return '⚪';
    }
  };



  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏅';
  };

  const isLoading = exercisesLoading || submissionsLoading || !exercisesData || !submissionsData;

  if (isLoading) {
    return (
      <Layout title="Student Dashboard">
        <div className="space-y-6">
          <CardSkeleton />
          <StatsSkeleton count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Student Dashboard">
      <div className="space-y-6">
        {/* Welcome Header */}
        <Card className="gradient-success text-white" padding="lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-responsive-lg font-bold mb-2">
                Welcome back, {authState.user?.name}! 🎓
              </h2>
              <p className="text-success-100 mb-4 text-balance">
                Ready to continue your hands-on training journey?
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm">Your access key:</span>
                <Badge variant="secondary" className="font-mono bg-success-700/50 text-white border-success-600">
                  {authState.user?.accessKey}
                </Badge>
              </div>
            </div>
            <div className="hidden sm:block ml-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Error Messages */}
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
        
        {submissionsError && (
          <ErrorMessage 
            message={`Failed to load submissions: ${submissionsError.message}`}
            onDismiss={() => retrySubmissions()}
            action={{
              label: 'Retry',
              onClick: retrySubmissions
            }}
          />
        )}

        {/* Real-time status indicator */}
        {appState.realTimeEnabled && rankingsLastUpdated && (
          <div className="text-xs text-gray-500 text-right">
            Rankings updated: {rankingsLastUpdated.toLocaleTimeString()}
            <span className="ml-2 inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <Stats
            items={[
              {
                label: 'Exercises Completed',
                value: `${stats.completedExercises}/${stats.availableExercises}`,
                icon: '📚',
                color: 'primary'
              },
              {
                label: 'Average Score',
                value: stats.averageScore.toFixed(0),
                icon: '🎯',
                color: 'success'
              },
              {
                label: 'Current Rank',
                value: stats.currentRank > 0 ? `#${stats.currentRank}` : 'N/A',
                icon: stats.currentRank > 0 ? getRankIcon(stats.currentRank) : '🏅',
                color: stats.currentRank <= 3 ? 'warning' : 'gray'
              },
              {
                label: 'Total Score',
                value: stats.totalScore,
                icon: '⭐',
                color: 'danger'
              }
            ]}
            className="mb-8"
          />
        )}

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/student/exercises">
              <div className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer border border-blue-200">
                <div className="text-2xl mb-2">📚</div>
                <div className="font-medium text-blue-900">Browse Exercises</div>
                <div className="text-sm text-blue-700">Find new challenges to complete</div>
              </div>
            </Link>
            
            <Link to="/student/results">
              <div className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer border border-purple-200">
                <div className="text-2xl mb-2">📊</div>
                <div className="font-medium text-purple-900">View Results</div>
                <div className="text-sm text-purple-700">Check your progress and scores</div>
              </div>
            </Link>
            
            <Link to="/student/profile">
              <div className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors cursor-pointer border border-green-200">
                <div className="text-2xl mb-2">👤</div>
                <div className="font-medium text-green-900">My Profile</div>
                <div className="text-sm text-green-700">Manage account and API info</div>
              </div>
            </Link>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Submissions */}
          <Card title="Recent Submissions">
            {recentSubmissions.length > 0 ? (
              <div className="space-y-3">
                {recentSubmissions.map((submission) => {
                  const exercise = getExerciseById(submission.exerciseId);
                  return (
                    <div key={submission.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {exercise?.title || 'Unknown Exercise'}
                        </div>
                        <div className="text-sm text-gray-600">
                          Score: {submission.score}/{exercise?.maxScore || 100}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                        <div className={`text-xs px-2 py-1 rounded mt-1 ${
                          submission.processingStatus === 'processed' 
                            ? 'bg-green-100 text-green-800'
                            : submission.processingStatus === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {submission.processingStatus}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2">
                  <Link to="/student/results">
                    <Button size="sm" variant="secondary" className="w-full">
                      View All Results
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📝</div>
                <p className="text-gray-600 text-sm">No submissions yet</p>
                <Link to="/student/exercises">
                  <Button size="sm" className="mt-2">
                    Start First Exercise
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Available Exercises */}
          <Card title="Available Exercises">
            {upcomingExercises.length > 0 ? (
              <div className="space-y-3">
                {upcomingExercises.map((exercise) => (
                  <Link key={exercise.id} to={`/student/exercises/${exercise.id}`}>
                    <div className={`p-3 rounded-lg transition-colors cursor-pointer border ${getDifficultyColor(exercise.difficulty)} hover:shadow-md`}>
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-medium">{exercise.title}</div>
                        <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                          {getDifficultyIcon(exercise.difficulty)} {exercise.difficulty}
                        </span>
                      </div>
                      <div className="text-sm opacity-80 line-clamp-2">
                        {exercise.description}
                      </div>
                      <div className="text-xs mt-2 opacity-70">
                        Max Score: {exercise.maxScore} points
                      </div>
                    </div>
                  </Link>
                ))}
                <div className="pt-2">
                  <Link to="/student/exercises">
                    <Button size="sm" variant="secondary" className="w-full">
                      View All Exercises
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">🎉</div>
                <p className="text-gray-600 text-sm">
                  {stats?.completedExercises === stats?.availableExercises 
                    ? 'All exercises completed!' 
                    : 'No new exercises available'
                  }
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Progress Overview */}
        {stats && stats.availableExercises > 0 && (
          <Card title="Overall Progress" subtitle="Track your learning journey">
            <Progress
              value={stats.completedExercises}
              max={stats.availableExercises}
              variant="success"
              size="lg"
              showLabel={true}
              label={`${stats.completedExercises} of ${stats.availableExercises} exercises completed`}
              animated={stats.completedExercises < stats.availableExercises}
            />
          </Card>
        )}
      </div>
    </Layout>
  );
}