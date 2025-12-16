import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { ErrorMessage } from '../../components/UI/ErrorMessage';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { exerciseAPI, submissionAPI } from '../../services/api';
import { Exercise, Submission } from '../../contexts/AppContext';

export function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state: appState, dispatch } = useApp();
  const { state: authState } = useAuth();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadExerciseDetails();
      loadSubmissions();
    }
  }, [id]);

  const loadExerciseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to find in existing exercises
      const existingExercise = appState.exercises.find(e => e.id === id);
      if (existingExercise) {
        setExercise(existingExercise);
        setLoading(false);
        return;
      }

      // If not found, load all exercises
      const exercises = await exerciseAPI.getExercises();
      dispatch({ type: 'SET_EXERCISES', payload: exercises });
      
      const foundExercise = exercises.find(e => e.id === id);
      if (foundExercise) {
        setExercise(foundExercise);
      } else {
        setError('Exercise not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercise details');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      if (authState.user?.accessKey) {
        const userSubmissions = await submissionAPI.getStudentSubmissions(authState.user.accessKey);
        setSubmissions(userSubmissions.filter(s => s.exerciseId === id));
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    }
  };

  const handleTestSubmission = async () => {
    if (!exercise || !authState.user) return;

    try {
      setSubmissionLoading(true);
      setError(null);

      // This is a test submission - in real implementation, this would come from the student's local program
      const testSubmissionData = {
        studentName: authState.user.name,
        accessKey: authState.user.accessKey!,
        exerciseId: exercise.id,
        ec2InstanceInfo: {
          operatingSystem: 'Amazon Linux 2',
          amiId: 'ami-0abcdef1234567890',
          internalIpAddress: '10.0.1.100',
          instanceType: 't3.micro'
        }
      };

      const submission = await submissionAPI.submitExercise(testSubmissionData);
      setSubmissions(prev => [...prev, submission]);
      
      // Show success message
      alert('Test submission successful! In a real scenario, your local program would make this API call.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit exercise');
    } finally {
      setSubmissionLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const getBestScore = () => {
    if (submissions.length === 0) return null;
    return Math.max(...submissions.map(s => s.score));
  };

  const getLatestSubmission = () => {
    if (submissions.length === 0) return null;
    return submissions.reduce((latest, current) => 
      new Date(current.submittedAt) > new Date(latest.submittedAt) ? current : latest
    );
  };

  if (loading) {
    return (
      <Layout title="Exercise Details">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (!exercise) {
    return (
      <Layout title="Exercise Not Found">
        <Card>
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Exercise Not Found</h3>
            <p className="text-gray-600 mb-4">The exercise you're looking for doesn't exist or has been removed.</p>
            <Link to="/student/exercises">
              <Button>Back to Exercises</Button>
            </Link>
          </div>
        </Card>
      </Layout>
    );
  }

  const bestScore = getBestScore();
  const latestSubmission = getLatestSubmission();

  return (
    <Layout title={exercise.title}>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600">
          <Link to="/student/exercises" className="hover:text-blue-600">Exercises</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{exercise.title}</span>
        </nav>

        {/* Exercise Header */}
        <Card>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{exercise.title}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                  {getDifficultyIcon(exercise.difficulty)} {exercise.difficulty}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{exercise.description}</p>
              <div className="text-sm text-gray-500">
                Maximum Score: <span className="font-medium text-gray-900">{exercise.maxScore} points</span>
              </div>
            </div>
            
            {/* Submission Status */}
            <div className="md:w-64">
              {bestScore !== null ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-800 mb-1">Your Best Score</div>
                  <div className="text-2xl font-bold text-green-900">{bestScore}/{exercise.maxScore}</div>
                  <div className="text-xs text-green-600 mt-1">
                    {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-800 mb-1">Not Started</div>
                  <div className="text-xs text-blue-600">Complete this exercise to earn points</div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <ErrorMessage 
            message={error} 
            onDismiss={() => setError(null)}
          />
        )}

        {/* Exercise Requirements */}
        <Card title="Requirements & Instructions">
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">
              {exercise.requirements}
            </div>
          </div>
        </Card>

        {/* API Information */}
        <Card title="API Submission Information">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Submission Endpoint</h4>
            <code className="block bg-gray-800 text-green-400 p-3 rounded text-sm mb-4">
              POST /api/submissions
            </code>
            
            <h4 className="font-medium text-gray-900 mb-2">Required Data</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• Student Name: <span className="font-mono">{authState.user?.name}</span></div>
              <div>• Access Key: <span className="font-mono">{authState.user?.accessKey}</span></div>
              <div>• Exercise ID: <span className="font-mono">{exercise.id}</span></div>
              <div>• EC2 Instance Information (OS, AMI ID, Internal IP, Instance Type)</div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your local program should call this API endpoint when you complete the exercise. 
                The system will automatically collect your client IP address and validate the EC2 instance information.
              </p>
            </div>
          </div>
        </Card>

        {/* Test Submission */}
        <Card title="Test Submission">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 mb-1">Test the submission API with sample data</p>
              <p className="text-sm text-gray-500">This simulates what your local program would do</p>
            </div>
            <Button 
              onClick={handleTestSubmission}
              loading={submissionLoading}
              variant="success"
            >
              Submit Test Data
            </Button>
          </div>
        </Card>

        {/* Submission History */}
        {submissions.length > 0 && (
          <Card title="Your Submissions">
            <div className="space-y-3">
              {submissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">
                      Score: {submission.score}/{exercise.maxScore}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      From: {submission.clientIpAddress} • {submission.ec2InstanceInfo.instanceType}
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
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <Link to="/student/exercises">
            <Button variant="secondary">← Back to Exercises</Button>
          </Link>
          <Link to="/student/results">
            <Button>View My Results →</Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}