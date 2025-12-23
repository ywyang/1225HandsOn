import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import { Pool } from 'pg';
import Joi from 'joi';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection using existing database
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'hands_on_training',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Configure multer for avatar uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files for avatar
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for avatar'), false);
    }
  }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Utility functions
function generateAccessKey() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function executeQuery(query, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Validation schemas
const studentRegistrationSchema = Joi.object({
  name: Joi.string().required().min(1).max(100).trim()
});

const submissionSchema = Joi.object({
  studentName: Joi.string().required().min(1).max(100),
  ec2InstanceInfo: Joi.object({
    operatingSystem: Joi.string().required(),
    amiId: Joi.string().required(),
    internalIpAddress: Joi.string().ip().required(),
    elasticIpAddress: Joi.string().ip().optional().allow(''),
    instanceType: Joi.string().required()
  }).required()
});

const submissionWithAvatarSchema = Joi.object({
  studentName: Joi.string().required().min(1).max(100),
  ec2InstanceInfo: Joi.object({
    operatingSystem: Joi.string().required(),
    amiId: Joi.string().required(),
    internalIpAddress: Joi.string().ip().required(),
    elasticIpAddress: Joi.string().ip().optional().allow(''),
    instanceType: Joi.string().required()
  }).required(),
  avatarBase64: Joi.string().optional().allow('')
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Exercise 1 API Server is running'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Hands-on Training System API - Exercise 1',
    version: '1.0.0',
    endpoints: [
      'POST /api/auth/student/register',
      'GET /api/auth/student/lookup/:name',
      'POST /api/submissions/exercise1 (supports avatar upload)',
      'GET /api/submissions/student/:accessKey',
      'GET /api/submissions/:submissionId/avatar',
      'GET /api/statistics/rankings',
      'GET /api/statistics/student/:accessKey'
    ]
  });
});

// Student registration
app.post('/api/auth/student/register', async (req, res) => {
  try {
    console.log('Student registration request:', req.body);

    // Validate request body
    const { error, value } = studentRegistrationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const { name } = value;

    // Check if student already exists
    const existingQuery = 'SELECT * FROM students WHERE LOWER(name) = LOWER($1)';
    const existingRows = await executeQuery(existingQuery, [name]);
    
    if (existingRows.length > 0) {
      const student = existingRows[0];
      return res.json({
        success: true,
        message: 'Welcome back! Here is your existing access key.',
        student: {
          name: student.name,
          accessKey: student.access_key,
          registeredAt: student.registered_at
        },
        isNewRegistration: false
      });
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
      const checkQuery = 'SELECT id FROM students WHERE access_key = $1';
      const checkRows = await executeQuery(checkQuery, [accessKey]);
      if (checkRows.length === 0) break;
    } while (true);

    // Create new student
    const insertQuery = `
      INSERT INTO students (name, access_key)
      VALUES ($1, $2)
      RETURNING id, name, access_key, registered_at
    `;
    
    const rows = await executeQuery(insertQuery, [name, accessKey]);
    const student = rows[0];

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please save your access key.',
      student: {
        name: student.name,
        accessKey: student.access_key,
        registeredAt: student.registered_at
      },
      isNewRegistration: true,
      instructions: 'Use this access key when submitting exercise solutions via API.'
    });

  } catch (error) {
    console.error('Error in student registration:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register student'
    });
  }
});

// Access key lookup
app.get('/api/auth/student/lookup/:name', async (req, res) => {
  try {
    const name = req.params.name?.trim();
    
    if (!name) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Student name is required'
      });
    }

    console.log('Access key lookup for:', name);

    // Find student by name
    const query = 'SELECT * FROM students WHERE LOWER(name) = LOWER($1)';
    const rows = await executeQuery(query, [name]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Student not found',
        message: 'No access key exists for this name. Please register first.',
        suggestion: 'Use the registration endpoint to create an access key.'
      });
    }

    const student = rows[0];

    // Update last active time
    const updateQuery = 'UPDATE students SET last_active_at = CURRENT_TIMESTAMP WHERE id = $1';
    await executeQuery(updateQuery, [student.id]);

    res.json({
      success: true,
      message: 'Access key found successfully',
      student: {
        name: student.name,
        accessKey: student.access_key,
        registeredAt: student.registered_at,
        lastActiveAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in access key lookup:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to lookup access key'
    });
  }
});

// Exercise 1 submission with avatar upload support
app.post('/api/submissions/exercise1', upload.single('avatar'), async (req, res) => {
  try {
    // Get client IP address
    const clientIp = req.ip || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress ||
                    req.headers['x-forwarded-for']?.split(',')[0] ||
                    req.headers['x-real-ip'] ||
                    'unknown';

    console.log('Received submission from IP:', clientIp);
    console.log('Request body:', req.body);
    console.log('Avatar upload:', req.file ? 'Yes' : 'No');

    let avatarData = null;
    let avatarFilename = null;
    let avatarMimetype = null;
    let avatarSize = null;

    // Handle file upload (multipart/form-data)
    if (req.file) {
      avatarData = req.file.buffer;
      avatarFilename = req.file.originalname;
      avatarMimetype = req.file.mimetype;
      avatarSize = req.file.size;
      console.log(`Avatar uploaded: ${avatarFilename}, size: ${avatarSize} bytes`);
    }
    // Handle base64 avatar (JSON)
    else if (req.body.avatarBase64) {
      try {
        // Extract base64 data (remove data:image/...;base64, prefix if present)
        const base64Data = req.body.avatarBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        avatarData = Buffer.from(base64Data, 'base64');
        avatarFilename = 'avatar.png';
        avatarMimetype = 'image/png'; // Default to PNG
        avatarSize = avatarData.length;
        console.log(`Base64 avatar processed: ${avatarFilename}, size: ${avatarSize} bytes`);
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid base64 avatar data',
          message: 'Failed to decode base64 avatar'
        });
      }
    }

    // Validate request body based on whether we have multipart or JSON
    const schema = req.file || req.body.avatarBase64 ? submissionWithAvatarSchema : submissionSchema;
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const { studentName, ec2InstanceInfo } = value;

    // Find or create student by name
    let student;
    const studentQuery = 'SELECT * FROM students WHERE LOWER(name) = LOWER($1)';
    const studentRows = await executeQuery(studentQuery, [studentName]);
    
    if (studentRows.length === 0) {
      // Create new student if not exists
      const accessKey = generateAccessKey();
      const insertQuery = `
        INSERT INTO students (name, access_key)
        VALUES ($1, $2)
        RETURNING id, name, access_key, registered_at
      `;
      const newStudentRows = await executeQuery(insertQuery, [studentName, accessKey]);
      student = newStudentRows[0];
    } else {
      student = studentRows[0];
    }

    // Get or create exercise 1
    let exerciseId;
    const exerciseQuery = "SELECT id FROM exercises WHERE title = 'Hands-on Exercise 1'";
    const exerciseRows = await executeQuery(exerciseQuery);
    
    if (exerciseRows.length > 0) {
      exerciseId = exerciseRows[0].id;
    } else {
      // Create default exercise 1
      const createExerciseQuery = `
        INSERT INTO exercises (title, description, requirements, difficulty, max_score, is_published, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;
      const newExerciseRows = await executeQuery(createExerciseQuery, [
        'Hands-on Exercise 1',
        'Submit EC2 instance information via API call',
        'Develop a local program that calls the submission API with student information and EC2 instance details',
        'beginner',
        100,
        true,
        'system'
      ]);
      exerciseId = newExerciseRows[0].id;
    }

    // Calculate score based on completion criteria
    let score = 0;
    const hasAllRequiredEC2Info = ec2InstanceInfo.operatingSystem && 
                                 ec2InstanceInfo.amiId && 
                                 ec2InstanceInfo.internalIpAddress && 
                                 ec2InstanceInfo.instanceType;
    
    const hasElasticIP = ec2InstanceInfo.elasticIpAddress && ec2InstanceInfo.elasticIpAddress.trim() !== '';
    
    if (hasAllRequiredEC2Info && hasElasticIP && avatarData) {
      score = 100; // Full score for all EC2 info + elastic IP + avatar
    } else if (hasAllRequiredEC2Info && hasElasticIP) {
      score = 90; // High score for all EC2 info + elastic IP but no avatar
    } else if (hasAllRequiredEC2Info && avatarData) {
      score = 85; // Good score for all required EC2 info + avatar but no elastic IP
    } else if (hasAllRequiredEC2Info) {
      score = 80; // Good score for all required EC2 info only
    } else if (avatarData) {
      score = 60; // Partial score for avatar but incomplete EC2 data
    } else {
      score = 40; // Lower score for incomplete data and no avatar
    }

    // Create submission record with current timestamp
    const submissionQuery = `
      INSERT INTO submissions (
        student_id, exercise_id, client_ip_address, 
        operating_system, ami_id, internal_ip_address, elastic_ip_address, instance_type,
        screenshot_data, screenshot_filename, screenshot_mimetype, screenshot_size,
        score, processing_status, submitted_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
      RETURNING id, submitted_at
    `;
    
    const submissionRows = await executeQuery(submissionQuery, [
      student.id,
      exerciseId,
      clientIp,
      ec2InstanceInfo.operatingSystem,
      ec2InstanceInfo.amiId,
      ec2InstanceInfo.internalIpAddress,
      ec2InstanceInfo.elasticIpAddress || null,
      ec2InstanceInfo.instanceType,
      avatarData,
      avatarFilename,
      avatarMimetype,
      avatarSize,
      score,
      'processed'
    ]);

    const submission = submissionRows[0];

    // Update student's last active time
    const updateStudentQuery = 'UPDATE students SET last_active_at = CURRENT_TIMESTAMP WHERE id = $1';
    await executeQuery(updateStudentQuery, [student.id]);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Submission received and processed successfully',
      submissionId: submission.id,
      score: score,
      timestamp: submission.submitted_at,
      studentInfo: {
        name: student.name
      },
      ec2Info: ec2InstanceInfo,
      avatarInfo: avatarData ? {
        filename: avatarFilename,
        size: avatarSize,
        mimetype: avatarMimetype
      } : null,
      clientIp: clientIp
    });

  } catch (error) {
    console.error('Error processing submission:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process submission'
    });
  }
});

// Get student submissions
app.get('/api/submissions/student/:accessKey', async (req, res) => {
  try {
    const { accessKey } = req.params;

    // Find student by access key
    const studentQuery = 'SELECT * FROM students WHERE access_key = $1';
    const studentRows = await executeQuery(studentQuery, [accessKey]);
    
    if (studentRows.length === 0) {
      return res.status(404).json({
        error: 'Student not found',
        message: 'Invalid access key'
      });
    }

    const student = studentRows[0];

    // Get all submissions for this student
    const submissionsQuery = `
      SELECT s.*, e.title as exercise_title
      FROM submissions s
      LEFT JOIN exercises e ON s.exercise_id = e.id
      WHERE s.student_id = $1
      ORDER BY s.submitted_at DESC
    `;
    const submissionRows = await executeQuery(submissionsQuery, [student.id]);

    res.json({
      success: true,
      student: {
        name: student.name,
        accessKey: student.access_key,
        registeredAt: student.registered_at
      },
      submissions: submissionRows.map(sub => ({
        id: sub.id,
        exerciseId: sub.exercise_id,
        exerciseTitle: sub.exercise_title,
        score: sub.score,
        submittedAt: sub.submitted_at,
        clientIpAddress: sub.client_ip_address,
        ec2InstanceInfo: {
          operatingSystem: sub.operating_system,
          amiId: sub.ami_id,
          internalIpAddress: sub.internal_ip_address,
          elasticIpAddress: sub.elastic_ip_address,
          instanceType: sub.instance_type
        },
        avatarInfo: sub.screenshot_data ? {
          filename: sub.screenshot_filename,
          size: sub.screenshot_size,
          mimetype: sub.screenshot_mimetype,
          hasAvatar: true
        } : null,
        processingStatus: sub.processing_status
      }))
    });

  } catch (error) {
    console.error('Error fetching student submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get rankings
app.get('/api/statistics/rankings', async (req, res) => {
  try {
    console.log('Fetching rankings');

    const rankingsQuery = `
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
    
    const rows = await executeQuery(rankingsQuery);

    res.json({
      success: true,
      exerciseId: 'all',
      totalStudents: rows.length,
      rankings: rows.map((ranking, index) => ({
        rank: ranking.rank,
        studentId: ranking.student_id,
        studentName: ranking.student_name,
        totalScore: ranking.total_score,
        completedExercises: ranking.completed_exercises,
        averageCompletionTime: ranking.average_completion_time,
        lastSubmissionAt: ranking.last_submission_at
      }))
    });

  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch rankings'
    });
  }
});

// Get avatar image
app.get('/api/submissions/:submissionId/avatar', async (req, res) => {
  try {
    const { submissionId } = req.params;

    console.log('Fetching avatar for submission:', submissionId);

    // Get submission with avatar data
    const query = `
      SELECT screenshot_data, screenshot_filename, screenshot_mimetype
      FROM submissions 
      WHERE id = $1 AND screenshot_data IS NOT NULL
    `;
    const rows = await executeQuery(query, [submissionId]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Avatar not found',
        message: 'No avatar exists for this submission'
      });
    }

    const submission = rows[0];

    // Set appropriate headers
    res.set({
      'Content-Type': submission.screenshot_mimetype || 'image/png',
      'Content-Disposition': `inline; filename="${submission.screenshot_filename || 'avatar.png'}"`
    });

    // Send the image data
    res.send(submission.screenshot_data);

  } catch (error) {
    console.error('Error fetching avatar:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch avatar'
    });
  }
});

// Get student statistics
app.get('/api/statistics/student/:accessKey', async (req, res) => {
  try {
    const { accessKey } = req.params;

    console.log('Fetching student statistics for:', accessKey);

    // Find student by access key
    const studentQuery = 'SELECT * FROM students WHERE access_key = $1';
    const studentRows = await executeQuery(studentQuery, [accessKey]);
    
    if (studentRows.length === 0) {
      return res.status(404).json({
        error: 'Student not found',
        message: 'Invalid access key'
      });
    }

    const student = studentRows[0];

    // Get student's submissions and statistics
    const submissionsQuery = `
      SELECT s.*, e.title as exercise_title
      FROM submissions s
      LEFT JOIN exercises e ON s.exercise_id = e.id
      WHERE s.student_id = $1
      ORDER BY s.submitted_at DESC
    `;
    const submissionRows = await executeQuery(submissionsQuery, [student.id]);

    // Calculate statistics
    const totalSubmissions = submissionRows.length;
    const completedExercises = submissionRows.filter(sub => sub.score > 0).length;
    const totalScore = submissionRows.reduce((sum, sub) => sum + sub.score, 0);
    const averageScore = totalSubmissions > 0 ? totalScore / totalSubmissions : 0;
    const highestScore = Math.max(...submissionRows.map(sub => sub.score), 0);

    // Get total exercises count
    const exerciseCountQuery = 'SELECT COUNT(*) as count FROM exercises WHERE is_published = true';
    const exerciseCountRows = await executeQuery(exerciseCountQuery);
    const totalExercises = parseInt(exerciseCountRows[0].count, 10);

    // Calculate rank
    const rankQuery = `
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
    
    const rankRows = await executeQuery(rankQuery, [student.id]);
    const rankInfo = rankRows.length > 0 ? rankRows[0] : { rank: null, total_participants: 0 };

    res.json({
      success: true,
      student: {
        name: student.name,
        accessKey: student.access_key,
        registeredAt: student.registered_at,
        lastActiveAt: student.last_active_at
      },
      statistics: {
        totalSubmissions: totalSubmissions,
        completedExercises: completedExercises,
        totalExercises: totalExercises,
        completionRate: totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0,
        totalScore: totalScore,
        averageScore: averageScore,
        highestScore: highestScore,
        currentRank: rankInfo.rank,
        totalParticipants: parseInt(rankInfo.total_participants, 10)
      },
      submissions: submissionRows.map(sub => ({
        id: sub.id,
        exerciseId: sub.exercise_id,
        exerciseTitle: sub.exercise_title || 'Hands-on Exercise 1',
        score: sub.score,
        submittedAt: sub.submitted_at,
        clientIpAddress: sub.client_ip_address,
        ec2InstanceInfo: {
          operatingSystem: sub.operating_system,
          amiId: sub.ami_id,
          internalIpAddress: sub.internal_ip_address,
          elasticIpAddress: sub.elastic_ip_address,
          instanceType: sub.instance_type
        },
        avatarInfo: sub.screenshot_data ? {
          filename: sub.screenshot_filename,
          size: sub.screenshot_size,
          mimetype: sub.screenshot_mimetype,
          hasAvatar: true
        } : null,
        processingStatus: sub.processing_status
      })),
      progress: {
        exerciseProgress: [],
        scoreHistory: [],
        submissionTimeline: []
      }
    });

  } catch (error) {
    console.error('Error fetching student statistics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch student statistics'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Exercise 1 API Server running on port ${PORT}`);
  console.log(`📋 API Documentation: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log('\n📚 Available Endpoints:');
  console.log('   POST /api/auth/student/register');
  console.log('   GET  /api/auth/student/lookup/:name');
  console.log('   POST /api/submissions/exercise1 (supports avatar upload)');
  console.log('   GET  /api/submissions/student/:accessKey');
  console.log('   GET  /api/submissions/:submissionId/avatar');
  console.log('   GET  /api/statistics/rankings');
  console.log('   GET  /api/statistics/student/:accessKey');
  console.log('\n💡 Test the API with: npm run test');
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

export default app;