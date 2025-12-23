import express from 'express';
import { getClient } from '../config/database.js';

const router = express.Router();

// Middleware to check admin authentication
const requireAdmin = (req, res, next) => {
  // In a real application, you would verify JWT token here
  // For now, we'll assume the request is authenticated
  // TODO: Implement proper JWT authentication
  next();
};

// SQL query execution endpoint
router.post('/execute', requireAdmin, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'SQL query is required'
      });
    }

    // Basic security checks
    const trimmedQuery = query.trim().toLowerCase();
    
    // Block potentially dangerous operations
    const dangerousOperations = [
      'drop', 'delete', 'truncate', 'alter', 'create', 'insert', 'update',
      'grant', 'revoke', 'exec', 'execute', 'sp_', 'xp_'
    ];

    const isDangerous = dangerousOperations.some(op => 
      trimmedQuery.includes(op + ' ') || 
      trimmedQuery.startsWith(op) ||
      trimmedQuery.includes(';' + op)
    );

    if (isDangerous) {
      return res.status(403).json({
        error: 'Forbidden operation',
        message: 'Only SELECT queries are allowed for security reasons'
      });
    }

    // Ensure it's a SELECT query
    if (!trimmedQuery.startsWith('select')) {
      return res.status(403).json({
        error: 'Invalid query type',
        message: 'Only SELECT queries are allowed'
      });
    }

    // Execute the query with timeout
    const startTime = Date.now();
    const client = await getClient();
    
    try {
      // Set query timeout to 30 seconds
      await client.query('SET statement_timeout = 30000');
      
      const result = await client.query(query);
      const executionTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          rows: result.rows,
          rowCount: result.rowCount,
          fields: result.fields?.map(field => ({
            name: field.name,
            dataTypeID: field.dataTypeID,
            dataTypeSize: field.dataTypeSize,
            dataTypeModifier: field.dataTypeModifier,
            format: field.format
          })) || [],
          executionTime: `${executionTime}ms`,
          query: query
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('SQL execution error:', error);
    
    // Handle different types of errors
    let errorMessage = 'Failed to execute query';
    let errorCode = 'EXECUTION_ERROR';

    if (error.code) {
      switch (error.code) {
        case '42601': // Syntax error
          errorMessage = 'SQL syntax error';
          errorCode = 'SYNTAX_ERROR';
          break;
        case '42703': // Undefined column
          errorMessage = 'Column does not exist';
          errorCode = 'COLUMN_NOT_FOUND';
          break;
        case '42P01': // Undefined table
          errorMessage = 'Table does not exist';
          errorCode = 'TABLE_NOT_FOUND';
          break;
        case '57014': // Query timeout
          errorMessage = 'Query execution timeout (30 seconds limit)';
          errorCode = 'TIMEOUT';
          break;
        default:
          errorMessage = error.message || 'Database error';
      }
    }

    res.status(400).json({
      error: errorCode,
      message: errorMessage,
      details: error.message,
      position: error.position,
      query: req.body.query
    });
  }
});

// Get database schema information
router.get('/schema', requireAdmin, async (req, res) => {
  try {
    const client = await getClient();
    
    try {
      // Get all tables and their columns
      const tablesQuery = `
        SELECT 
          t.table_name,
          t.table_type,
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          c.ordinal_position
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name, c.ordinal_position;
      `;

      const result = await client.query(tablesQuery);
      
      // Group columns by table
      const schema = {};
      result.rows.forEach(row => {
        if (!schema[row.table_name]) {
          schema[row.table_name] = {
            name: row.table_name,
            type: row.table_type,
            columns: []
          };
        }
        
        if (row.column_name) {
          schema[row.table_name].columns.push({
            name: row.column_name,
            dataType: row.data_type,
            nullable: row.is_nullable === 'YES',
            defaultValue: row.column_default,
            position: row.ordinal_position
          });
        }
      });

      res.json({
        success: true,
        data: {
          tables: Object.values(schema),
          totalTables: Object.keys(schema).length
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Schema fetch error:', error);
    res.status(500).json({
      error: 'SCHEMA_ERROR',
      message: 'Failed to fetch database schema',
      details: error.message
    });
  }
});

// Get sample queries
router.get('/samples', requireAdmin, (req, res) => {
  const sampleQueries = [
    {
      name: 'All Students',
      description: 'Get all registered students',
      query: 'SELECT id, name, access_key, registered_at, last_active_at FROM students ORDER BY registered_at DESC;'
    },
    {
      name: 'Student Rankings',
      description: 'Get student rankings with scores',
      query: `
        SELECT 
          s.name as student_name,
          s.access_key,
          COUNT(sub.id) as total_submissions,
          COALESCE(MAX(sub.score), 0) as highest_score,
          COALESCE(AVG(sub.score), 0) as average_score
        FROM students s
        LEFT JOIN submissions sub ON s.id = sub.student_id
        GROUP BY s.id, s.name, s.access_key
        ORDER BY highest_score DESC, average_score DESC;
      `.trim()
    },
    {
      name: 'Recent Submissions',
      description: 'Get recent submissions with student info',
      query: `
        SELECT 
          s.name as student_name,
          sub.score,
          sub.operating_system,
          sub.instance_type,
          sub.elastic_ip_address,
          sub.submitted_at
        FROM submissions sub
        JOIN students s ON sub.student_id = s.id
        ORDER BY sub.submitted_at DESC
        LIMIT 20;
      `.trim()
    },
    {
      name: 'Exercise Statistics',
      description: 'Get statistics for all exercises',
      query: `
        SELECT 
          e.title as exercise_title,
          e.difficulty,
          e.max_score,
          COUNT(sub.id) as total_submissions,
          COALESCE(AVG(sub.score), 0) as average_score,
          COALESCE(MAX(sub.score), 0) as highest_score
        FROM exercises e
        LEFT JOIN submissions sub ON e.id = sub.exercise_id
        WHERE e.is_published = true
        GROUP BY e.id, e.title, e.difficulty, e.max_score
        ORDER BY total_submissions DESC;
      `.trim()
    },
    {
      name: 'Daily Activity',
      description: 'Get daily submission activity',
      query: `
        SELECT 
          DATE(submitted_at) as submission_date,
          COUNT(*) as submissions_count,
          COUNT(DISTINCT student_id) as unique_students,
          AVG(score) as average_score
        FROM submissions
        WHERE submitted_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(submitted_at)
        ORDER BY submission_date DESC;
      `.trim()
    },
    {
      name: 'Top Performers',
      description: 'Get top performing students',
      query: `
        SELECT 
          s.name as student_name,
          s.registered_at,
          COUNT(sub.id) as total_submissions,
          MAX(sub.score) as best_score,
          AVG(sub.score) as avg_score,
          COUNT(CASE WHEN sub.score >= 90 THEN 1 END) as high_scores
        FROM students s
        JOIN submissions sub ON s.id = sub.student_id
        GROUP BY s.id, s.name, s.registered_at
        HAVING COUNT(sub.id) > 0
        ORDER BY best_score DESC, avg_score DESC
        LIMIT 10;
      `.trim()
    }
  ];

  res.json({
    success: true,
    data: sampleQueries
  });
});

export default router;