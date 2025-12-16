import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { ErrorMessage } from '../../components/UI/ErrorMessage';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { sqlAPI } from '../../services/api';
import { showSuccess, showError } from '../../components/Notifications/NotificationManager';

interface QueryResult {
  rows: any[];
  rowCount: number;
  fields: any[];
  executionTime: string;
  query: string;
}

interface DatabaseTable {
  name: string;
  type: string;
  columns: Array<{
    name: string;
    dataType: string;
    nullable: boolean;
    defaultValue: string | null;
    position: number;
  }>;
}

interface SampleQuery {
  name: string;
  description: string;
  query: string;
}

export function SqlQuery() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState<DatabaseTable[]>([]);
  const [sampleQueries, setSampleQueries] = useState<SampleQuery[]>([]);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);

  // Load schema and sample queries on component mount
  useEffect(() => {
    loadSchema();
    loadSampleQueries();
    loadQueryHistory();
  }, []);

  const loadSchema = async () => {
    try {
      setSchemaLoading(true);
      const schemaData = await sqlAPI.getSchema();
      setSchema(schemaData.tables);
    } catch (err: any) {
      console.error('Failed to load schema:', err);
      showError('Schema Error', 'Failed to load database schema');
    } finally {
      setSchemaLoading(false);
    }
  };

  const loadSampleQueries = async () => {
    try {
      const samples = await sqlAPI.getSampleQueries();
      setSampleQueries(samples);
    } catch (err: any) {
      console.error('Failed to load sample queries:', err);
    }
  };

  const loadQueryHistory = () => {
    const history = localStorage.getItem('sqlQueryHistory');
    if (history) {
      try {
        setQueryHistory(JSON.parse(history));
      } catch (err) {
        console.error('Failed to parse query history:', err);
      }
    }
  };

  const saveQueryToHistory = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const newHistory = [trimmedQuery, ...queryHistory.filter(q => q !== trimmedQuery)].slice(0, 10);
    setQueryHistory(newHistory);
    localStorage.setItem('sqlQueryHistory', JSON.stringify(newHistory));
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      showError('Invalid Query', 'Please enter a SQL query');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const queryResult = await sqlAPI.executeQuery(query);
      setResult(queryResult);
      saveQueryToHistory(query);
      showSuccess('Query Executed', `Query completed in ${queryResult.executionTime}`);
    } catch (err: any) {
      setError(err.message || 'Failed to execute query');
      showError('Query Error', err.message || 'Failed to execute query');
    } finally {
      setLoading(false);
    }
  };

  const insertSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery);
    setResult(null);
    setError(null);
  };

  const insertTableName = (tableName: string) => {
    const cursorPosition = (document.getElementById('sql-editor') as HTMLTextAreaElement)?.selectionStart || query.length;
    const newQuery = query.slice(0, cursorPosition) + tableName + query.slice(cursorPosition);
    setQuery(newQuery);
  };

  const formatQuery = () => {
    // Simple SQL formatting
    const formatted = query
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ',\n  ')
      .replace(/\s+(FROM|WHERE|GROUP BY|ORDER BY|HAVING|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN)\s+/gi, '\n$1 ')
      .replace(/\s+(AND|OR)\s+/gi, '\n  $1 ')
      .trim();
    setQuery(formatted);
  };

  const clearQuery = () => {
    setQuery('');
    setResult(null);
    setError(null);
  };

  const exportResults = () => {
    if (!result || !result.rows.length) return;

    const csv = [
      result.fields.map(field => field.name).join(','),
      ...result.rows.map(row => 
        result.fields.map(field => {
          const value = row[field.name];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout title="SQL Query Console">
      <div className="space-y-6">
        {/* Header */}
        <Card className="gradient-primary text-white" padding="lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-responsive-lg font-bold mb-2">
                SQL Query Console 🗄️
              </h1>
              <p className="text-primary-100">
                Execute SQL queries against the hands_on_training database
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">💻</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Schema & Samples */}
          <div className="lg:col-span-1 space-y-4">
            {/* Database Schema */}
            <Card title="Database Schema" className="h-fit">
              {schemaLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {schema.map((table) => (
                    <div key={table.name} className="border rounded-lg">
                      <button
                        onClick={() => setSelectedTable(selectedTable === table.name ? null : table.name)}
                        className="w-full text-left p-3 hover:bg-gray-50 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">📋</span>
                          <span className="font-medium text-sm">{table.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {selectedTable === table.name ? '▼' : '▶'}
                        </span>
                      </button>
                      
                      {selectedTable === table.name && (
                        <div className="border-t bg-gray-50 p-2">
                          <div className="space-y-1">
                            {table.columns.map((column) => (
                              <div key={column.name} className="flex items-center justify-between text-xs">
                                <button
                                  onClick={() => insertTableName(column.name)}
                                  className="text-left hover:text-blue-600 flex-1"
                                  title={`Click to insert ${column.name}`}
                                >
                                  <span className="font-mono">{column.name}</span>
                                </button>
                                <span className="text-gray-500 ml-2">
                                  {column.dataType}
                                  {!column.nullable && <span className="text-red-500">*</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => insertTableName(table.name)}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                          >
                            Insert table name
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Sample Queries */}
            <Card title="Sample Queries" className="h-fit">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sampleQueries.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => insertSampleQuery(sample.query)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  >
                    <div className="font-medium text-sm text-blue-700">{sample.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{sample.description}</div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Query History */}
            {queryHistory.length > 0 && (
              <Card title="Recent Queries" className="h-fit">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {queryHistory.map((historyQuery, index) => (
                    <button
                      key={index}
                      onClick={() => insertSampleQuery(historyQuery)}
                      className="w-full text-left p-2 text-xs font-mono bg-gray-50 rounded border hover:bg-gray-100 truncate"
                      title={historyQuery}
                    >
                      {historyQuery.length > 50 ? `${historyQuery.slice(0, 50)}...` : historyQuery}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Main Content - Query Editor & Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Query Editor */}
            <Card title="SQL Query Editor">
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    id="sql-editor"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter your SQL query here... (Only SELECT queries are allowed)"
                    className="w-full h-48 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    spellCheck={false}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    Lines: {query.split('\n').length} | Chars: {query.length}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={executeQuery}
                    disabled={loading || !query.trim()}
                    className="flex items-center space-x-2"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : <span>▶️</span>}
                    <span>Execute Query</span>
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={formatQuery}
                    disabled={!query.trim()}
                  >
                    🎨 Format
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={clearQuery}
                    disabled={!query.trim()}
                  >
                    🗑️ Clear
                  </Button>

                  {result && result.rows.length > 0 && (
                    <Button
                      variant="secondary"
                      onClick={exportResults}
                    >
                      📥 Export CSV
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Error Display */}
            {error && (
              <ErrorMessage
                message={error}
                onDismiss={() => setError(null)}
              />
            )}

            {/* Query Results */}
            {result && (
              <Card title={`Query Results (${result.rowCount} rows, ${result.executionTime})`}>
                {result.rows.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl mb-4 block">📊</span>
                    No results returned
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {result.fields.map((field) => (
                            <th
                              key={field.name}
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {field.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {result.rows.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {result.fields.map((field) => (
                              <td
                                key={field.name}
                                className="px-4 py-3 text-sm text-gray-900 font-mono"
                              >
                                {row[field.name] === null ? (
                                  <span className="text-gray-400 italic">NULL</span>
                                ) : row[field.name] === '' ? (
                                  <span className="text-gray-400 italic">''</span>
                                ) : typeof row[field.name] === 'boolean' ? (
                                  <span className={row[field.name] ? 'text-green-600' : 'text-red-600'}>
                                    {row[field.name].toString()}
                                  </span>
                                ) : typeof row[field.name] === 'object' ? (
                                  <span className="text-blue-600">
                                    {JSON.stringify(row[field.name])}
                                  </span>
                                ) : (
                                  String(row[field.name])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-3">
            <span className="text-yellow-600 text-xl">⚠️</span>
            <div>
              <h3 className="font-medium text-yellow-800">Security Notice</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Only SELECT queries are allowed for security reasons. 
                Queries are executed with a 30-second timeout limit.
                This console is for administrators only.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}