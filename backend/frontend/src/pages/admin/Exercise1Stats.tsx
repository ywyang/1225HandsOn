import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { Card } from '../../components/UI/Card';
import { ErrorMessage } from '../../components/UI/ErrorMessage';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

interface Student {
  name: string;
  access_key: string;
  submitted_at: string;
  score: number;
  operating_system?: string;
  ami_id?: string;
  instance_type?: string;
  internal_ip_address?: string;
  elastic_ip_address?: string;
}

interface SameIpGroup {
  elastic_ip: string;
  student_count: number;
  students: Student[];
}

interface Exercise1Stats {
  earliest: Student[];
  completed: Student[];
  highestScore: Student[];
  sameIpGroups: SameIpGroup[];
}

export function Exercise1Stats() {
  const [stats, setStats] = useState<Exercise1Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/exercise1-stats');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout title="Exercise 1 Statistics">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Exercise 1 Statistics">
        <ErrorMessage message={error} />
      </Layout>
    );
  }

  return (
    <Layout title="Exercise 1 Statistics">
      <div className="space-y-6">
        {/* Earliest Completion */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">🏁 Earliest Completion (Top 10)</h2>
          {stats?.earliest && stats.earliest.length > 0 ? (
            <div className="space-y-2">
              {stats.earliest.map((student, idx) => (
                <div key={idx} className="bg-green-50 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="inline-block w-8 text-center font-bold text-green-700">#{idx + 1}</span>
                    <span className="font-medium text-lg ml-2">{student.name}</span>
                    <p className="text-gray-600 font-mono text-sm ml-10">{student.access_key}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatDate(student.submitted_at)}</p>
                    <p className="text-sm font-semibold text-green-700">Score: {student.score}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No submissions yet</p>
          )}
        </Card>

        {/* Highest Score */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">🏆 Highest Score (Top 10)</h2>
          {stats?.highestScore && stats.highestScore.length > 0 ? (
            <div className="space-y-2">
              {stats.highestScore.map((student, idx) => (
                <div key={idx} className="bg-yellow-50 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="inline-block w-8 text-center font-bold text-yellow-700">#{idx + 1}</span>
                    <span className="font-medium text-lg ml-2">{student.name}</span>
                    <p className="text-gray-600 font-mono text-sm ml-10">{student.access_key}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatDate(student.submitted_at)}</p>
                    <p className="text-sm font-semibold text-yellow-700">Score: {student.score}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No submissions yet</p>
          )}
        </Card>

        {/* All Completed Students */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">✅ All Completed Students ({stats?.completed.length || 0})</h2>
          {stats?.completed && stats.completed.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">OS</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">AMI ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instance Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Internal IP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Elastic IP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.completed.map((student, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.operating_system || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">{student.ami_id || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.instance_type || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">{student.internal_ip_address || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">{student.elastic_ip_address || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(student.submitted_at)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">{student.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No completed submissions yet</p>
          )}
        </Card>

        {/* Same Elastic IP Groups */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">🌐 Students with Same Elastic IP</h2>
          {stats?.sameIpGroups && stats.sameIpGroups.length > 0 ? (
            <div className="space-y-4">
              {stats.sameIpGroups.map((group, idx) => (
                <div key={idx} className="border border-orange-200 bg-orange-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-mono text-sm font-semibold text-orange-900">
                      IP: {group.elastic_ip}
                    </p>
                    <span className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-xs font-medium">
                      {group.student_count} students
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.students.map((student, sIdx) => (
                      <div key={sIdx} className="bg-white p-3 rounded border border-orange-100">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-600 font-mono">{student.access_key}</p>
                        <div className="flex justify-between mt-1 text-xs text-gray-500">
                          <span>{formatDate(student.submitted_at)}</span>
                          <span className="font-semibold text-green-600">Score: {student.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No duplicate IPs found</p>
          )}
        </Card>
      </div>
    </Layout>
  );
}
