import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
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

export function Exercise1StatsEnhanced() {
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
      <Layout title="Exercise KIRO Statistics - Enhanced">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Exercise KIRO Statistics - Enhanced">
        <ErrorMessage message={error} />
      </Layout>
    );
  }

  return (
    <Layout title="Exercise KIRO Statistics - Enhanced">
      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .animate-slide-in { animation: slideInUp 0.5s ease-out; }
        .animate-pulse-slow { animation: pulse 3s ease-in-out infinite; }
        .gradient-bg {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .gradient-green {
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }
        .gradient-gold {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .gradient-orange {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }
        .glass-effect {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
        .trophy-icon { font-size: 3rem; }
        .rank-badge {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
      `}</style>

      <div className="space-y-8">
        {/* Header Banner */}
        <div className="gradient-bg rounded-2xl p-8 text-white shadow-2xl animate-slide-in">
          <h1 className="text-4xl font-bold mb-2">🎯 Exercise KIRO Analytics Dashboard</h1>
          <p className="text-lg opacity-90">Real-time performance insights and leaderboards</p>
        </div>

        {/* Top Performers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earliest Completion */}
          <div className="gradient-green rounded-2xl p-6 text-white shadow-2xl animate-slide-in" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center mb-4">
              <span className="text-5xl mr-3">🏁</span>
              <div>
                <h2 className="text-2xl font-bold">Speed Champions</h2>
                <p className="text-sm opacity-90">Fastest Submissions</p>
              </div>
            </div>
            {stats?.earliest && stats.earliest.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {stats.earliest.map((student, idx) => (
                  <div key={idx} className="glass-effect rounded-xl p-4 hover:scale-105 transition-transform">
                    <div className="flex items-center gap-3">
                      <div className="rank-badge" style={{background: idx < 3 ? '#FFD700' : '#4A5568'}}>
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg">{student.name}</p>
                        <p className="text-sm opacity-80">{formatDate(student.submitted_at)}</p>
                      </div>
                      <div className="text-right">
                        <div className="bg-white text-green-600 px-3 py-1 rounded-full font-bold">
                          {student.score}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 opacity-70">No submissions yet</p>
            )}
          </div>

          {/* Highest Score */}
          <div className="gradient-gold rounded-2xl p-6 text-white shadow-2xl animate-slide-in" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center mb-4">
              <span className="text-5xl mr-3">🏆</span>
              <div>
                <h2 className="text-2xl font-bold">Top Scorers</h2>
                <p className="text-sm opacity-90">Highest Achievements</p>
              </div>
            </div>
            {stats?.highestScore && stats.highestScore.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {stats.highestScore.map((student, idx) => (
                  <div key={idx} className="glass-effect rounded-xl p-4 hover:scale-105 transition-transform">
                    <div className="flex items-center gap-3">
                      <div className="rank-badge" style={{background: idx < 3 ? '#FFD700' : '#4A5568'}}>
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg">{student.name}</p>
                        <p className="text-sm opacity-80">{formatDate(student.submitted_at)}</p>
                      </div>
                      <div className="text-right">
                        <div className="bg-white text-pink-600 px-3 py-1 rounded-full font-bold">
                          {student.score}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 opacity-70">No submissions yet</p>
            )}
          </div>
        </div>

        {/* All Completed Students */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-in" style={{animationDelay: '0.3s'}}>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>✅</span>
              All Completed Students ({stats?.completed.length || 0})
            </h2>
          </div>
          {stats?.completed && stats.completed.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">OS</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">AMI ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Instance</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Internal IP</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Elastic IP</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.completed.map((student, idx) => (
                    <tr key={idx} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all">
                      <td className="px-6 py-4 font-semibold text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 text-gray-600">{student.operating_system || '-'}</td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">{student.ami_id || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{student.instance_type || '-'}</td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">{student.internal_ip_address || '-'}</td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">{student.elastic_ip_address || '-'}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{formatDate(student.submitted_at)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-green-400 to-blue-500 text-white">
                          {student.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-12 text-gray-500">No completed submissions yet</p>
          )}
        </div>

        {/* Same Elastic IP Groups */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-in" style={{animationDelay: '0.4s'}}>
          <div className="gradient-orange p-6 text-white">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>🌐</span>
              Students with Same Elastic IP
            </h2>
          </div>
          <div className="p-6">
            {stats?.sameIpGroups && stats.sameIpGroups.length > 0 ? (
              <div className="space-y-4">
                {stats.sameIpGroups.map((group, idx) => (
                  <div key={idx} className="border-2 border-orange-200 rounded-xl p-5 bg-gradient-to-r from-orange-50 to-yellow-50 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                      <p className="font-mono text-lg font-bold text-orange-900 flex items-center gap-2">
                        <span>📍</span>
                        {group.elastic_ip}
                      </p>
                      <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                        {group.student_count} students
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.students.map((student, sIdx) => (
                        <div key={sIdx} className="bg-white p-4 rounded-lg border border-orange-200 hover:border-orange-400 transition-colors">
                          <p className="font-bold text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-600 font-mono">{student.access_key}</p>
                          <div className="flex justify-between mt-2 text-xs">
                            <span className="text-gray-500">{formatDate(student.submitted_at)}</span>
                            <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                              Score: {student.score}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">No duplicate IPs found</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
