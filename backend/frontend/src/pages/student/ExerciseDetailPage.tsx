import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { ErrorMessage } from '../../components/UI/ErrorMessage';
import { useAuth } from '../../contexts/AuthContext';
import { exerciseAPI, submissionAPI } from '../../services/api';
import { Submission } from '../../contexts/AppContext';
import { showSuccess, showError } from '../../components/Notifications/NotificationManager';

interface Exercise {
  id: string;
  title: string;
  description: string;
  requirements: string;
  difficulty: string;
  maxScore: number;
  isPublished: boolean;
  apiInfo?: string;
}

export function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state: authState } = useAuth();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadExerciseDetails();
    }
  }, [id]);

  useEffect(() => {
    if (id && authState.user?.accessKey) {
      loadSubmissions();
    }
  }, [id, authState.user?.accessKey]);

  const loadExerciseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all exercises and find the one we need
      const exercises = await exerciseAPI.getExercises();
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
      const accessKey = authState.user?.accessKey;
      if (!accessKey) return;

      const submissionsData = await submissionAPI.getStudentSubmissions(accessKey);
      // Filter submissions for this exercise
      const exerciseSubmissions = submissionsData.filter(s => s.exerciseId === id);
      setSubmissions(exerciseSubmissions);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    }
  };

  const handleTestSubmission = async () => {
    try {
      setSubmissionLoading(true);
      
      if (!authState.user?.name || !authState.user?.accessKey) {
        showError('Authentication Error', 'Please log in first');
        return;
      }

      // Create test submission data
      const testData = {
        studentName: authState.user.name,
        accessKey: authState.user.accessKey,
        exerciseId: id,
        ec2InstanceInfo: {
          operatingSystem: 'Amazon Linux 2',
          amiId: 'ami-test123456',
          internalIpAddress: '10.0.1.100',
          instanceType: 't3.micro'
        }
      };

      const response = await fetch('/api/submissions/exercise1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        showSuccess('Test Submission', 'Test submission completed successfully');
        // Reload submissions to show the new one
        await loadSubmissions();
      } else {
        const errorData = await response.json();
        showError('Submission Failed', errorData.message || 'Failed to submit test data');
      }
    } catch (err) {
      showError('Submission Error', err instanceof Error ? err.message : 'Failed to submit test data');
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
        {exercise.apiInfo && (
          <Card title="API Submission Information">
            <div className="bg-gray-50 rounded-lg p-4">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: exercise.apiInfo }}
              />
            </div>
          </Card>
        )}

        {/* Test Submission - Hidden */}
        {/* <Card title="Test Submission">
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
        </Card> */}

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