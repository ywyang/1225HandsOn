import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { ErrorMessage } from '../../components/UI/ErrorMessage';
import { useAuth } from '../../contexts/AuthContext';
import { submissionAPI } from '../../services/api';
import { Submission } from '../../contexts/AppContext';

interface ProfileStats {
  totalSubmissions: number;
  firstSubmissionDate: string | null;
  lastSubmissionDate: string | null;
  mostActiveDay: string;
  averageSubmissionsPerDay: number;
}

export function ProfilePage() {
  const { state: authState } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAccessKey, setShowAccessKey] = useState(false);

  useEffect(() => {
    if (authState.user?.accessKey) {
      loadProfileData();
    }
  }, [authState.user?.accessKey]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      const accessKey = authState.user?.accessKey;
      if (!accessKey) return;

      const submissionsData = await submissionAPI.getStudentSubmissions(accessKey);
      setSubmissions(submissionsData);

      // Calculate profile statistics
      if (submissionsData.length > 0) {
        const dates = submissionsData.map(s => new Date(s.submittedAt));
        const firstDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const lastDate = new Date(Math.max(...dates.map(d => d.getTime())));
        
        // Calculate most active day
        const dayCount: { [key: string]: number } = {};
        submissionsData.forEach(s => {
          const day = new Date(s.submittedAt).toLocaleDateString('en-US', { weekday: 'long' });
          dayCount[day] = (dayCount[day] || 0) + 1;
        });
        
        const mostActiveDay = Object.entries(dayCount).reduce((a, b) => 
          dayCount[a[0]] > dayCount[b[0]] ? a : b
        )[0];

        // Calculate average submissions per day
        const daysDiff = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
        const averageSubmissionsPerDay = submissionsData.length / daysDiff;

        setProfileStats({
          totalSubmissions: submissionsData.length,
          firstSubmissionDate: firstDate.toLocaleDateString(),
          lastSubmissionDate: lastDate.toLocaleDateString(),
          mostActiveDay,
          averageSubmissionsPerDay
        });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const copyAccessKey = () => {
    if (authState.user?.accessKey) {
      navigator.clipboard.writeText(authState.user.accessKey);
      alert('Access key copied to clipboard!');
    }
  };

  const getSubmissionsByMonth = () => {
    const monthlyData: { [key: string]: number } = {};
    
    submissions.forEach(submission => {
      const month = new Date(submission.submittedAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-6); // Last 6 months
  };

  if (loading) {
    return (
      <Layout title="My Profile">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  const monthlySubmissions = getSubmissionsByMonth();

  return (
    <Layout title="My Profile">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-2">Student Profile</h2>
          <p className="text-indigo-100">
            Manage your account information and view your activity
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <ErrorMessage 
            message={error} 
            onDismiss={() => setError(null)}
          />
        )}

        {/* Basic Information */}
        <Card title="Account Information">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Name
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  {authState.user?.name}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                  Student
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Key
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md font-mono text-sm">
                  {showAccessKey ? authState.user?.accessKey : '••••••••••••••••'}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowAccessKey(!showAccessKey)}
                >
                  {showAccessKey ? 'Hide' : 'Show'}
                </Button>
                <Button
                  size="sm"
                  onClick={copyAccessKey}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use this access key in your local programs to submit exercise results
              </p>
            </div>
          </div>
        </Card>

        {/* Activity Statistics */}
        {profileStats && (
          <Card title="Activity Statistics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {profileStats.totalSubmissions}
                </div>
                <div className="text-sm text-gray-600">Total Submissions</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {profileStats.averageSubmissionsPerDay.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Avg. per Day</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600 mb-1">
                  {profileStats.mostActiveDay}
                </div>
                <div className="text-sm text-gray-600">Most Active Day</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600 mb-1">
                  {profileStats.firstSubmissionDate ? 
                    Math.ceil((new Date().getTime() - new Date(profileStats.firstSubmissionDate).getTime()) / (1000 * 60 * 60 * 24))
                    : 0
                  }
                </div>
                <div className="text-sm text-gray-600">Days Active</div>
              </div>
            </div>
          </Card>
        )}

        {/* Monthly Activity */}
        {monthlySubmissions.length > 0 && (
          <Card title="Monthly Activity">
            <div className="space-y-3">
              {monthlySubmissions.map(([month, count]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{month}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ 
                          width: `${Math.min(100, (count / Math.max(...monthlySubmissions.map(([, c]) => c))) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* API Usage Information */}
        <Card title="API Usage Guide">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">How to Submit Exercise Results</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Complete the hands-on exercise on your AWS EC2 instance</li>
                <li>Use your local program to call the submission API</li>
                <li>Include your name, access key, and EC2 instance information</li>
                <li>The system will automatically score your submission</li>
              </ol>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Example API Call</h4>
              <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
{`curl -X POST https://api.training-system.com/api/submissions \\
  -H "Content-Type: application/json" \\
  -d '{
    "studentName": "${authState.user?.name}",
    "accessKey": "${authState.user?.accessKey}",
    "exerciseId": "exercise-id-here",
    "ec2InstanceInfo": {
      "operatingSystem": "Amazon Linux 2",
      "amiId": "ami-0abcdef1234567890",
      "internalIpAddress": "10.0.1.100",
      "instanceType": "t3.micro"
    }
  }'`}
              </pre>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        {submissions.length > 0 && (
          <Card title="Recent Activity">
            <div className="space-y-3">
              {submissions
                .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                .slice(0, 5)
                .map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Exercise Submission
                      </div>
                      <div className="text-xs text-gray-600">
                        Score: {submission.score} • {new Date(submission.submittedAt).toLocaleString()}
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

        {/* No Activity Message */}
        {submissions.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👤</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h3>
              <p className="text-gray-600 mb-4">
                Start completing exercises to see your activity and statistics here.
              </p>
              <Button>
                <a href="/student/exercises">Browse Exercises</a>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}