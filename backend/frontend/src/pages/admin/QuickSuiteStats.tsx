import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { ErrorMessage } from '../../components/UI/ErrorMessage';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

interface Report {
  user_name: string;
  company_name: string;
  stock_code: string;
  report_period: string;
  revenue: string;
  created_at: string;
  performance_summary?: string;
  employee_id?: string;
}

interface UserGroup {
  user_name: string;
  report_count: number;
  reports: Report[];
}

interface QuickSuiteStats {
  earliest: Report[];
  allReports: Report[];
  highestRevenue: Report[];
  userGroups: UserGroup[];
}

export function QuickSuiteStats() {
  const [stats, setStats] = useState<QuickSuiteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quicksuite-stats');
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

  const formatRevenue = (revenue: string) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    }).format(parseFloat(revenue));
  };

  if (loading) {
    return (
      <Layout title="Exercise Quick Suite Statistics">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Exercise Quick Suite Statistics">
        <ErrorMessage message={error} />
      </Layout>
    );
  }

  return (
    <Layout title="Exercise Quick Suite Statistics">
      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-slide-in { animation: slideInUp 0.5s ease-out; }
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
          <h1 className="text-4xl font-bold mb-2">📊 Exercise Quick Suite Analytics</h1>
          <p className="text-lg opacity-90">Company Reports Performance Dashboard</p>
        </div>

        {/* Top Performers Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Earliest Submissions */}
          <div className="gradient-green rounded-2xl p-6 text-white shadow-2xl animate-slide-in" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center mb-4">
              <span className="text-5xl mr-3">🏁</span>
              <div>
                <h2 className="text-2xl font-bold">First Submissions</h2>
                <p className="text-sm opacity-90">Earliest Reports</p>
              </div>
            </div>
            {stats?.earliest && stats.earliest.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {stats.earliest.map((report, idx) => (
                  <div key={idx} className="glass-effect rounded-xl p-4 hover:scale-105 transition-transform">
                    <div className="flex items-center gap-3">
                      <div className="rank-badge" style={{background: idx < 3 ? '#FFD700' : '#4A5568'}}>
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg">{report.user_name}</p>
                        <p className="text-sm opacity-90">{report.company_name}</p>
                        <p className="text-xs opacity-80">{formatDate(report.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <div className="bg-white text-green-600 px-2 py-1 rounded-full font-bold text-xs">
                          {report.stock_code}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 opacity-70">No reports yet</p>
            )}
          </div>
        </div>

        {/* All Reports */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-in" style={{animationDelay: '0.3s'}}>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>📋</span>
              All Company Reports ({stats?.allReports.length || 0})
            </h2>
          </div>
          {stats?.allReports && stats.allReports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Stock Code</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Employee ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.allReports.map((report, idx) => (
                    <tr key={idx} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all">
                      <td className="px-6 py-4 font-semibold text-gray-900">{report.user_name}</td>
                      <td className="px-6 py-4 text-gray-600">{report.company_name}</td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-sm">{report.stock_code}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{report.report_period}</td>
                      <td className="px-6 py-4 text-gray-900 font-semibold">{formatRevenue(report.revenue)}</td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-sm">{report.employee_id || '-'}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{formatDate(report.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-12 text-gray-500">No reports yet</p>
          )}
        </div>

      </div>
    </Layout>
  );
}
