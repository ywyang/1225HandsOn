import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'hands_on_training',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('rds.amazonaws.com') 
    ? { rejectUnauthorized: false } 
    : false,
});

// Utility functions
function generateAccessKey() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateId() {
  return 'id-' + Math.random().toString(36).substring(2, 15);
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateUUID(uuid) {
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return re.test(uuid);
}

// Execute query helper
async function executeQuery(query, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Student Repository
export class StudentRepository {
  async create(data) {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Student name is required');
    }

    const studentName = data.name.trim();
    
    // Check if student already exists
    const existing = await this.findByName(studentName);
    if (existing) {
      return existing;
    }

    // Generate unique access key
    let accessKey;
    let attempts = 0;
    do {
      accessKey = generateAccessKey();
      attempts++;
      if (attempts > 10) {
        throw new Error('Unable to generate unique access key');
      }
    } while (await this.findByAccessKey(accessKey));

    const query = `
      INSERT INTO students (name, access_key)
      VALUES ($1, $2)
      RETURNING id, name, access_key, registered_at, last_active_at
    `;
    
    const rows = await executeQuery(query, [studentName, accessKey]);
    return this.mapStudentRow(rows[0]);
  }

  async findById(id) {
    if (!validateUUID(id)) {
      throw new Error('Invalid student ID format');
    }

    const query = 'SELECT * FROM students WHERE id = $1';
    const rows = await executeQuery(query, [id]);
    
    return rows.length > 0 ? this.mapStudentRow(rows[0]) : null;
  }

  async findByName(name) {
    if (!name || name.trim().length === 0) {
      return null;
    }

    const query = 'SELECT * FROM students WHERE LOWER(name) = LOWER($1)';
    const rows = await executeQuery(query, [name.trim()]);
    
    return rows.length > 0 ? this.mapStudentRow(rows[0]) : null;
  }

  async findByAccessKey(accessKey) {
    if (!accessKey || accessKey.trim().length === 0) {
      return null;
    }

    const query = 'SELECT * FROM students WHERE access_key = $1';
    const rows = await executeQuery(query, [accessKey]);
    
    return rows.length > 0 ? this.mapStudentRow(rows[0]) : null;
  }

  async updateLastActive(id) {
    if (!validateUUID(id)) {
      throw new Error('Invalid student ID format');
    }

    const query = 'UPDATE students SET last_active_at = CURRENT_TIMESTAMP WHERE id = $1';
    await executeQuery(query, [id]);
  }

  async getTotalCount() {
    const query = 'SELECT COUNT(*) as count FROM students';
    const rows = await executeQuery(query);
    
    return parseInt(rows[0].count, 10);
  }

  async getRecentRegistrations(limit = 10) {
    const query = `
      SELECT * FROM students 
      ORDER BY registered_at DESC 
      LIMIT $1
    `;
    const rows = await executeQuery(query, [limit]);
    
    return rows.map(row => this.mapStudentRow(row));
  }

  mapStudentRow(row) {
    return {
      id: row.id,
      name: row.name,
      accessKey: row.access_key,
      registeredAt: row.registered_at,
      lastActiveAt: row.last_active_at
    };
  }
}

// Exercise Repository
export class ExerciseRepository {
  async create(data) {
    this.validateExerciseData(data);
    
    const query = `
      INSERT INTO exercises (title, description, requirements, difficulty, max_score, created_by, is_published)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const rows = await executeQuery(query, [
      data.title, 
      data.description, 
      data.requirements, 
      data.difficulty || 'beginner', 
      data.maxScore || 100, 
      data.createdBy || 'system',
      data.isPublished || false
    ]);
    
    return this.mapExerciseRow(rows[0]);
  }

  async findById(id) {
    if (!validateUUID(id)) {
      throw new Error('Invalid exercise ID format');
    }

    const query = 'SELECT * FROM exercises WHERE id = $1';
    const rows = await executeQuery(query, [id]);
    
    return rows.length > 0 ? this.mapExerciseRow(rows[0]) : null;
  }

  async findAll() {
    const query = 'SELECT * FROM exercises ORDER BY created_at DESC';
    const rows = await executeQuery(query);
    
    return rows.map(row => this.mapExerciseRow(row));
  }

  async findPublished() {
    const query = 'SELECT * FROM exercises WHERE is_published = true ORDER BY created_at DESC';
    const rows = await executeQuery(query);
    
    return rows.map(row => this.mapExerciseRow(row));
  }

  async getTotalCount() {
    const query = 'SELECT COUNT(*) as count FROM exercises';
    const rows = await executeQuery(query);
    
    return parseInt(rows[0].count, 10);
  }

  async getTotalPublishedCount() {
    const query = 'SELECT COUNT(*) as count FROM exercises WHERE is_published = true';
    const rows = await executeQuery(query);
    
    return parseInt(rows[0].count, 10);
  }

  async updatePublicationStatus(id, isPublished) {
    if (!validateUUID(id)) {
      throw new Error('Invalid exercise ID format');
    }

    const query = `
      UPDATE exercises 
      SET is_published = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const rows = await executeQuery(query, [isPublished, id]);
    
    if (rows.length === 0) {
      throw new Error(`Exercise not found: ${id}`);
    }
    
    return this.mapExerciseRow(rows[0]);
  }

  validateExerciseData(data) {
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Exercise title is required');
    }
    
    if (data.title.length > 200) {
      throw new Error('Exercise title must be 200 characters or less');
    }

    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Exercise description is required');
    }

    if (!data.requirements || data.requirements.trim().length === 0) {
      throw new Error('Exercise requirements are required');
    }

    if (data.difficulty && !['beginner', 'intermediate', 'advanced'].includes(data.difficulty)) {
      throw new Error('Invalid difficulty level');
    }

    if (data.maxScore && (data.maxScore <= 0 || data.maxScore > 1000)) {
      throw new Error('Max score must be between 1 and 1000');
    }
  }

  mapExerciseRow(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      requirements: row.requirements,
      difficulty: row.difficulty,
      maxScore: row.max_score,
      isPublished: row.is_published,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

// Submission Repository
export class SubmissionRepository {
  async create(data) {
    // Validate required fields
    if (!data.studentId || !validateUUID(data.studentId)) {
      throw new Error('Valid student ID is required');
    }

    if (!data.exerciseId || !validateUUID(data.exerciseId)) {
      throw new Error('Valid exercise ID is required');
    }

    if (!data.clientIpAddress) {
      throw new Error('Client IP address is required');
    }

    if (!data.ec2InstanceInfo) {
      throw new Error('EC2 instance information is required');
    }

    const { ec2InstanceInfo } = data;
    
    if (!ec2InstanceInfo.operatingSystem || !ec2InstanceInfo.amiId || 
        !ec2InstanceInfo.internalIpAddress || !ec2InstanceInfo.instanceType) {
      throw new Error('Complete EC2 instance information is required');
    }

    const query = `
      INSERT INTO submissions (
        student_id, exercise_id, client_ip_address, 
        operating_system, ami_id, internal_ip_address, instance_type,
        score, processing_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const rows = await executeQuery(query, [
      data.studentId, 
      data.exerciseId, 
      data.clientIpAddress,
      ec2InstanceInfo.operatingSystem,
      ec2InstanceInfo.amiId,
      ec2InstanceInfo.internalIpAddress,
      ec2InstanceInfo.instanceType,
      data.score || 0,
      data.processingStatus || 'processed'
    ]);
    
    return this.mapSubmissionRow(rows[0]);
  }

  async findByStudentId(studentId) {
    if (!validateUUID(studentId)) {
      throw new Error('Invalid student ID format');
    }

    const query = `
      SELECT s.*, e.title as exercise_title FROM submissions s
      LEFT JOIN exercises e ON s.exercise_id = e.id
      WHERE s.student_id = $1 
      ORDER BY s.submitted_at DESC
    `;
    const rows = await executeQuery(query, [studentId]);
    
    return rows.map(row => this.mapSubmissionRow(row));
  }

  async getTotalCount() {
    const query = 'SELECT COUNT(*) as count FROM submissions';
    const rows = await executeQuery(query);
    
    return parseInt(rows[0].count, 10);
  }

  async getOverallRankings() {
    const query = `
      WITH student_stats AS (
        SELECT 
          s.id as student_id,
          s.name as student_name,
          COALESCE(SUM(best_scores.score), 0) as total_score,
          COUNT(best_scores.exercise_id) as completed_exercises,
          MAX(best_scores.submitted_at) as last_submission_at
        FROM students s
        LEFT JOIN (
          SELECT DISTINCT ON (student_id, exercise_id)
            student_id, exercise_id, score, submitted_at
          FROM submissions
          WHERE processing_status = 'processed'
          ORDER BY student_id, exercise_id, score DESC, submitted_at ASC
        ) best_scores ON s.id = best_scores.student_id
        GROUP BY s.id, s.name
      )
      SELECT 
        student_id,
        student_name,
        total_score,
        completed_exercises,
        0 as average_completion_time,
        last_submission_at,
        RANK() OVER (ORDER BY total_score DESC, last_submission_at ASC) as rank
      FROM student_stats
      ORDER BY rank ASC
    `;
    
    const rows = await executeQuery(query);
    
    return rows.map(row => ({
      studentId: row.student_id,
      studentName: row.student_name,
      totalScore: row.total_score,
      completedExercises: row.completed_exercises,
      averageCompletionTime: row.average_completion_time,
      rank: row.rank
    }));
  }

  async getExerciseStatistics() {
    const query = `
      SELECT 
        e.id as exercise_id,
        e.title as exercise_title,
        COUNT(s.id) as total_submissions,
        COUNT(DISTINCT s.student_id) as unique_students,
        COALESCE(AVG(s.score), 0) as average_score,
        COALESCE(MAX(s.score), 0) as highest_score,
        COALESCE(MIN(s.score), 0) as lowest_score,
        ROUND(
          (COUNT(DISTINCT s.student_id)::float / 
           NULLIF((SELECT COUNT(*) FROM students), 0)) * 100, 2
        ) as completion_rate
      FROM exercises e
      LEFT JOIN submissions s ON e.id = s.exercise_id AND s.processing_status = 'processed'
      WHERE e.is_published = true
      GROUP BY e.id, e.title
      ORDER BY e.created_at ASC
    `;
    
    return await executeQuery(query);
  }

  async getCompletionStatistics() {
    const query = `
      SELECT 
        COALESCE(AVG(score), 0) as average_score,
        COUNT(DISTINCT student_id) as students_with_submissions,
        (SELECT COUNT(*) FROM students) as total_students
      FROM submissions 
      WHERE processing_status = 'processed'
    `;
    
    const rows = await executeQuery(query);
    const result = rows[0];
    
    return {
      averageScore: result.average_score,
      completionRate: result.total_students > 0 ? 
        (result.students_with_submissions / result.total_students) * 100 : 0
    };
  }

  async getRecentSubmissions(limit = 10) {
    const query = `
      SELECT s.*, st.name as student_name, e.title as exercise_title
      FROM submissions s
      JOIN students st ON s.student_id = st.id
      LEFT JOIN exercises e ON s.exercise_id = e.id
      ORDER BY s.submitted_at DESC 
      LIMIT $1
    `;
    const rows = await executeQuery(query, [limit]);
    
    return rows.map(row => this.mapSubmissionRow(row));
  }

  async getStudentStatistics(studentId) {
    // Placeholder implementation
    return {
      exerciseProgress: [],
      scoreHistory: [],
      submissionTimeline: []
    };
  }

  async getStudentRanking(studentId) {
    if (!validateUUID(studentId)) {
      throw new Error('Invalid student ID format');
    }

    const query = `
      WITH rankings AS (
        SELECT 
          s.id as student_id,
          COALESCE(SUM(best_scores.score), 0) as total_score,
          RANK() OVER (ORDER BY COALESCE(SUM(best_scores.score), 0) DESC) as rank
        FROM students s
        LEFT JOIN (
          SELECT DISTINCT ON (student_id, exercise_id)
            student_id, exercise_id, score
          FROM submissions
          WHERE processing_status = 'processed'
          ORDER BY student_id, exercise_id, score DESC, submitted_at ASC
        ) best_scores ON s.id = best_scores.student_id
        GROUP BY s.id
      )
      SELECT 
        rank,
        (SELECT COUNT(*) FROM students) as total_participants
      FROM rankings
      WHERE student_id = $1
    `;
    
    const rows = await executeQuery(query, [studentId]);
    
    return rows.length > 0 ? rows[0] : null;
  }

  async getActivityTrends(days = 7) {
    const query = `
      SELECT 
        DATE(submitted_at) as date,
        COUNT(*) as submissions
      FROM submissions
      WHERE submitted_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(submitted_at)
      ORDER BY date ASC
    `;
    
    return await executeQuery(query);
  }

  mapSubmissionRow(row) {
    return {
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      exerciseId: row.exercise_id,
      exerciseTitle: row.exercise_title,
      clientIpAddress: row.client_ip_address,
      ec2InstanceInfo: {
        operatingSystem: row.operating_system,
        amiId: row.ami_id,
        internalIpAddress: row.internal_ip_address,
        instanceType: row.instance_type
      },
      score: row.score,
      submittedAt: row.submitted_at,
      processingStatus: row.processing_status
    };
  }
}

// Administrator Repository
export class AdministratorRepository {
  async findByUsername(username) {
    const query = 'SELECT * FROM administrators WHERE username = $1';
    const rows = await executeQuery(query, [username]);
    
    return rows.length > 0 ? this.mapAdministratorRow(rows[0]) : null;
  }

  async findById(id) {
    if (!validateUUID(id)) {
      throw new Error('Invalid administrator ID format');
    }

    const query = 'SELECT * FROM administrators WHERE id = $1';
    const rows = await executeQuery(query, [id]);
    
    return rows.length > 0 ? this.mapAdministratorRow(rows[0]) : null;
  }

  async updateLastLogin(id) {
    if (!validateUUID(id)) {
      throw new Error('Invalid administrator ID format');
    }

    const query = 'UPDATE administrators SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1';
    await executeQuery(query, [id]);
  }

  mapAdministratorRow(row) {
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      email: row.email,
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at
    };
  }
}

// Create repository instances
export const studentRepo = new StudentRepository();
export const exerciseRepo = new ExerciseRepository();
export const submissionRepo = new SubmissionRepository();
export const adminRepo = new AdministratorRepository();

// Export pool for direct access if needed
export { pool };

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database connections...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database connections...');
  await pool.end();
  process.exit(0);
});