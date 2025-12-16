import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { ErrorMessage } from '../../components/UI/ErrorMessage';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { submissionAPI, statisticsAPI, exerciseAPI } from '../../services/api';
import { Submission, Exercise, StudentRanking } from '../../contexts/AppContext';

interface StudentStats {
  totalScore: number;
  completedExercises: number;
  averageScore: number;
  rank: number;
  totalExercises: number;
  completionRate: number;
}

export function ResultsPage() {
  const { state: authState } = useAuth();
  const { state: appState, dispatch } = useApp();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [rankings, setRankings] = useState<StudentRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authState.user?.accessKey) {
      loadStudentData();
    }
  }, [authState.user?.accessKey]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      setError(null);

      const accessKey = authState.user?.accessKey;
      if (!accessKey) return;

      // Load submissions, exercises, and rankings in parallel
      const [submissionsData, exercisesData, rankingsData] = await Promise.all([
        submissionAPI.getStudentSubmissions(accessKey),
        exerciseAPI.getExercises(),
        statisticsAPI.getRankings()
      ]);

      setSubmissions(submissionsData);
      dispatch({ type: 'SET_EXERCISES', payload: exercisesData });
      setRankings(rankingsData);

      // Calculate student stats
      const publishedExercises = exercisesData.filter(e => e.isPublished);
      const completedExerciseIds = new Set(submissionsData.map(s => s.exerciseId));
      const totalScore = submissionsData.reduce((sum, submission) => {
        // Get best score for each exercise
        const exerciseSubmissions = submissionsData.filter(s => s.exerciseId === submission.exerciseId);
        const bestScore = Math.max(...exerciseSubmissions.map(s => s.score));
        return sum + (exerciseSubmissions.indexOf(submission) === exerciseSubmissions.findIndex(s => s.score === bestScore) ? bestScore : 0);
      }, 0);

      const uniqueCompletedExercises = completedExerciseIds.size;
      const averageScore = uniqueCompletedExercises > 0 ? totalScore / uniqueCompletedExercises : 0;
      const completionRate = publishedExercises.length > 0 ? (uniqueCompletedExercises / publishedExercises.length) * 100 : 0;
      
      // Find student rank
      const studentRanking = rankingsData.find(r => r.studentName === authState.user?.name);
      const rank = studentRanking?.rank || 0;

      setStudentStats({
        totalScore,
        completedExercises: uniqueCompletedExercises,
        averageScore,
        rank,
        totalExercises: publishedExercises.length,
        completionRate
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const getExerciseById = (id: string): Exercise | undefined => {
    return appState.exercises.find(e => e.id === id);
  };

  const getExerciseSubmissions = (exerciseId: string) => {
    return submissions.filter(s => s.exerciseId === exerciseId);
  };

  const getBestScoreForExercise = (exerciseId: string) => {
    const exerciseSubmissions = getExerciseSubmissions(exerciseId);
    if (exerciseSubmissions.length === 0) return null;
    return Math.max(...exerciseSubmissions.map(s => s.score));
  };

  const getCompletedExercises = () => {
    const completedExerciseIds = new Set(submissions.map(s => s.exerciseId));
    return Array.from(completedExerciseIds).map(id => {
      const exercise = getExerciseById(id);
      const bestScore = getBestScoreForExercise(id);
      const exerciseSubmissions = getExerciseSubmissions(id);
      const latestSubmission = exerciseSubmissions.reduce((latest, current) => 
        new Date(current.submittedAt) > new Date(latest.submittedAt) ? current : latest
      );
      
      return {
        exercise,
        bestScore,
        submissionCount: exerciseSubmissions.length,
        latestSubmission
      };
    }).filter(item => item.exercise);
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600';
    if (rank === 2) return 'text-gray-600';
    if (rank === 3) return 'text-orange-600';
    return 'text-blue-600';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏅';
  };

  if (loading) {
    return (
      <Layout title="My Results">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  const completedExercises = getCompletedExercises();

  return (
    <Layout title="My Results">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-2">My Progress & Results</h2>
          <p className="text-purple-100">
            Track your performance and see how you rank against other students
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <ErrorMessage 
            message={error} 
            onDismiss={() => setError(null)}
          />
        )}

        {/* Stats Overview */}
        {studentStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{studentStats.totalScore}</div>
              <div className="text-sm text-gray-600">Total Score</div>
            </Card>
            
            <Card className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {studentStats.completedExercises}/{studentStats.totalExercises}
              </div>
              <div className="text-sm text-gray-600">Exercises Completed</div>
            </Card>
            
            <Card className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {studentStats.averageScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Average Score</div>
            </Card>
            
            <Card className="text-center">
              <div className={`text-3xl font-bold mb-2 ${getRankColor(studentStats.rank)}`}>
                {getRankIcon(studentStats.rank)} #{studentStats.rank}
              </div>
              <div className="text-sm text-gray-600">Current Rank</div>
            </Card>
          </div>
        )}

        {/* Progress Bar */}
        {studentStats && (
          <Card title="Completion Progress">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{studentStats.completionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${studentStats.completionRate}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                {studentStats.completedExercises} of {studentStats.totalExercises} exercises completed
              </div>
            </div>
          </Card>
        )}

        {/* Completed Exercises */}
        {completedExercises.length > 0 ? (
          <Card title="Completed Exercises">
            <div className="space-y-4">
              {completedExercises.map(({ exercise, bestScore, submissionCount, latestSubmission }) => (
                <div key={exercise!.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{exercise!.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{exercise!.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-green-600">
                        {bestScore}/{exercise!.maxScore}
                      </div>
                      <div className="text-xs text-gray-500">
                        Best Score
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div>
                      {submissionCount} submission{submissionCount !== 1 ? 's' : ''} • 
                      Last: {new Date(latestSubmission.submittedAt).toLocaleDateString()}
                    </div>
                    <Link to={`/student/exercises/${exercise!.id}`}>
                      <Button size="sm" variant="secondary">
                        View Details
                      </Button>
                    </Link>
                  </div>
                  
                  {/* Score Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${(bestScore! / exercise!.maxScore) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card>
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
              <p className="text-gray-600 mb-4">
                Complete some exercises to see your results and progress here.
              </p>
              <Link to="/student/exercises">
                <Button>Browse Exercises</Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Recent Submissions */}
        {submissions.length > 0 && (
          <Card title="Recent Submissions">
            <div className="space-y-3">
              {submissions
                .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                .slice(0, 5)
                .map((submission) => {
                  const exercise = getExerciseById(submission.exerciseId);
                  return (
                    <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {exercise?.title || 'Unknown Exercise'}
                        </div>
                        <div className="text-sm text-gray-600">
                          Score: {submission.score}/{exercise?.maxScore || 100} • 
                          {new Date(submission.submittedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        submission.processingStatus === 'processed' 
                          ? 'bg-green-100 text-green-800'
                          : submission.processingStatus === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {submission.processingStatus}
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        )}

        {/* Leaderboard Preview */}
        {rankings.length > 0 && (
          <Card title="Leaderboard">
            <div className="space-y-3">
              {rankings.slice(0, 10).map((ranking) => (
                <div 
                  key={ranking.studentId} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    ranking.studentName === authState.user?.name 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`text-lg ${getRankColor(ranking.rank)}`}>
                      {getRankIcon(ranking.rank)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {ranking.studentName}
                        {ranking.studentName === authState.user?.name && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">You</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {ranking.completedExercises} exercises completed
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{ranking.totalScore}</div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-center">
          <Link to="/student/exercises">
            <Button size="lg">Continue Learning</Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}