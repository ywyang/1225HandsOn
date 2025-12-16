import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { ErrorMessage } from '../../components/UI/ErrorMessage';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { useApp } from '../../contexts/AppContext';
import { statisticsAPI } from '../../services/api';
import { StudentRanking } from '../../contexts/AppContext';

export function Rankings() {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'exercises' | 'time'>('rank');
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadRankings();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadRankings();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadRankings = async () => {
    try {
      if (!loading) {
        // Don't show loading spinner for auto-refresh
        dispatch({ type: 'SET_LOADING', payload: false });
      }
      
      const rankings = await statisticsAPI.getRankings();
      dispatch({ type: 'SET_RANKINGS', payload: rankings });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load rankings' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getSortedRankings = (): StudentRanking[] => {
    let sorted = [...state.rankings];
    
    // Apply filter
    if (filterBy === 'active') {
      sorted = sorted.filter(student => student.completedExercises > 0);
    } else if (filterBy === 'completed') {
      sorted = sorted.filter(student => student.completedExercises >= 3); // Assuming 3+ exercises means "completed"
    }

    // Apply sort
    switch (sortBy) {
      case 'rank':
        sorted.sort((a, b) => a.rank - b.rank);
        break;
      case 'score':
        sorted.sort((a, b) => b.totalScore - a.totalScore);
        break;
      case 'exercises':
        sorted.sort((a, b) => b.completedExercises - a.completedExercises);
        break;
      case 'time':
        sorted.sort((a, b) => a.averageCompletionTime - b.averageCompletionTime);
        break;
    }

    return sorted;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏅';
  };

  const formatCompletionTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}m`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days}d ${hours}h`;
    }
  };

  const getProgressPercentage = (completed: number, total: number = 10) => {
    return Math.min((completed / total) * 100, 100);
  };

  if (loading) {
    return (
      <Layout title="Student Rankings">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  const sortedRankings = getSortedRankings();

  return (
    <Layout title="Student Rankings">
      <div className="space-y-6">
        {state.error && (
          <ErrorMessage 
            message={state.error} 
            onDismiss={() => dispatch({ type: 'SET_ERROR', payload: null })}
          />
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Rankings</h1>
            <p className="text-gray-600 mt-1">
              Real-time leaderboard • Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="autoRefresh" className="text-sm text-gray-700">
                Auto-refresh
              </label>
            </div>
            
            <Button
              onClick={loadRankings}
              variant="secondary"
              size="sm"
            >
              Refresh Now
            </Button>
          </div>
        </div>

        {/* Filters and Sort */}
        <Card>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="rank">Rank</option>
                <option value="score">Total Score</option>
                <option value="exercises">Completed Exercises</option>
                <option value="time">Avg. Completion Time</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Students</option>
                <option value="active">Active Students</option>
                <option value="completed">Completed Students</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {sortedRankings.length} of {state.rankings.length} students
            </div>
          </div>
        </Card>

        {/* Top 3 Podium */}
        {sortedRankings.length >= 3 && (
          <Card title="Top Performers">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sortedRankings.slice(0, 3).map((student) => (
                <div
                  key={student.studentId}
                  className={`text-center p-6 rounded-lg border-2 ${getRankBadgeColor(student.rank)}`}
                >
                  <div className="text-4xl mb-2">{getRankIcon(student.rank)}</div>
                  <h3 className="font-bold text-lg mb-1">{student.studentName}</h3>
                  <div className="text-2xl font-bold mb-2">{student.totalScore}</div>
                  <div className="text-sm opacity-75">
                    {student.completedExercises} exercises • {formatCompletionTime(student.averageCompletionTime)} avg
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Full Rankings Table */}
        <Card title="Complete Rankings">
          {sortedRankings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No students found matching the current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Student</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Score</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Exercises</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Progress</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Avg. Time</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRankings.map((student) => (
                    <tr 
                      key={student.studentId}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        student.rank <= 3 ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{getRankIcon(student.rank)}</span>
                          <span className={`px-2 py-1 rounded-full text-sm font-medium border ${getRankBadgeColor(student.rank)}`}>
                            #{student.rank}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{student.studentName}</div>
                        <div className="text-sm text-gray-500">ID: {student.studentId.slice(0, 8)}...</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-xl font-bold text-blue-600">{student.totalScore}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-lg font-semibold">{student.completedExercises}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${getProgressPercentage(student.completedExercises)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1 text-center">
                          {getProgressPercentage(student.completedExercises).toFixed(0)}%
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-sm font-medium">
                          {formatCompletionTime(student.averageCompletionTime)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {state.rankings.length}
            </div>
            <div className="text-sm text-gray-600">Total Students</div>
          </Card>
          
          <Card className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {state.rankings.filter(s => s.completedExercises > 0).length}
            </div>
            <div className="text-sm text-gray-600">Active Students</div>
          </Card>
          
          <Card className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {state.rankings.length > 0 ? 
                (state.rankings.reduce((sum, s) => sum + s.totalScore, 0) / state.rankings.length).toFixed(1) : 
                '0'
              }
            </div>
            <div className="text-sm text-gray-600">Avg. Score</div>
          </Card>
          
          <Card className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {state.rankings.length > 0 ? 
                formatCompletionTime(state.rankings.reduce((sum, s) => sum + s.averageCompletionTime, 0) / state.rankings.length) : 
                '0m'
              }
            </div>
            <div className="text-sm text-gray-600">Avg. Time</div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}