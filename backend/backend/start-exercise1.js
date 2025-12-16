#!/usr/bin/env node

/**
 * Exercise 1 API Server Startup Script
 * 简化的启动脚本，用于测试Exercise 1的API功能
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for testing (replace with database in production)
const students = new Map();
const submissions = new Map();
const exercises = new Map();

// Initialize with a default exercise
exercises.set('exercise-1', {
  id: 'exercise-1',
  title: 'Hands-on Exercise 1',
  description: 'Submit EC2 instance information via API call',
  requirements: 'Develop a local program that calls the submission API with student information and EC2 instance details',
  difficulty: 'beginner',
  maxScore: 100,
  isPublished: true,
  createdAt: new Date().toISOString()
});

// Utility functions
function generateAccessKey() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateId() {
  return 'id-' + Math.random().toString(36).substring(2, 15);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Exercise 1 API Server is running'
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Hands-on Training System API - Exercise 1',
    version: '1.0.0',
    endpoints: [
      'POST /api/auth/student/register',
      'GET /api/auth/student/lookup/:name',
      'POST /api/submissions/exercise1',
      'GET /api/submissions/student/:accessKey',
      'GET /api/statistics/rankings',
      'GET /api/statistics/student/:accessKey'
    ]
  });
});

// Student registration
app.post('/api/auth/student/register', (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Student name is required'
      });
    }
    
    const studentName = name.trim();
    
    // Check if student already exists
    for (const [id, student] of students) {
      if (student.name.toLowerCase() === studentName.toLowerCase()) {
        return res.json({
          success: true,
          message: 'Welcome back! Here is your existing access key.',
          student: {
            name: student.name,
            accessKey: student.accessKey,
            registeredAt: student.registeredAt
          },
          isNewRegistration: false
        });
      }
    }
    
    // Create new student
    const studentId = generateId();
    const accessKey = generateAccessKey();
    const student = {
      id: studentId,
      name: studentName,
      accessKey: accessKey,
      registeredAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };
    
    students.set(studentId, student);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please save your access key.',
      student: {
        name: student.name,
        accessKey: student.accessKey,
        registeredAt: student.registeredAt
      },
      isNewRegistration: true,
      instructions: 'Use this access key when submitting exercise solutions via API.'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register student'
    });
  }
});

// Access key lookup
app.get('/api/auth/student/lookup/:name', (req, res) => {
  try {
    const name = req.params.name?.trim();
    
    if (!name) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Student name is required'
      });
    }
    
    // Find student by name
    let foundStudent = null;
    for (const [id, student] of students) {
      if (student.name.toLowerCase() === name.toLowerCase()) {
        foundStudent = student;
        break;
      }
    }
    
    if (!foundStudent) {
      return res.status(404).json({
        error: 'Student not found',
        message: 'No access key exists for this name. Please register first.',
        suggestion: 'Use the registration endpoint to create an access key.'
      });
    }
    
    // Update last active time
    foundStudent.lastActiveAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Access key found successfully',
      student: {
        name: foundStudent.name,
        accessKey: foundStudent.accessKey,
        registeredAt: foundStudent.registeredAt,
        lastActiveAt: foundStudent.lastActiveAt
      }
    });
    
  } catch (error) {
    console.error('Lookup error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to lookup access key'
    });
  }
});

// Exercise 1 submission
app.post('/api/submissions/exercise1', (req, res) => {
  try {
    const clientIp = req.ip || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress ||
                    req.headers['x-forwarded-for']?.split(',')[0] ||
                    req.headers['x-real-ip'] ||
                    'unknown';
    
    const { studentName, accessKey, ec2InstanceInfo } = req.body;
    
    // Validate request
    if (!studentName || !accessKey || !ec2InstanceInfo) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Student name, access key, and EC2 instance info are required'
      });
    }
    
    // Find student
    let foundStudent = null;
    for (const [id, student] of students) {
      if (student.name === studentName && student.accessKey === accessKey) {
        foundStudent = student;
        break;
      }
    }
    
    if (!foundStudent) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid student name or access key'
      });
    }
    
    // Validate EC2 info
    const { operatingSystem, amiId, internalIpAddress, instanceType } = ec2InstanceInfo;
    if (!operatingSystem || !amiId || !internalIpAddress || !instanceType) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Complete EC2 instance information is required'
      });
    }
    
    // Calculate score
    let score = 100; // Full score for complete data
    
    // Create submission
    const submissionId = generateId();
    const submission = {
      id: submissionId,
      studentId: foundStudent.id,
      studentName: foundStudent.name,
      exerciseId: 'exercise-1',
      clientIpAddress: clientIp,
      ec2InstanceInfo: ec2InstanceInfo,
      score: score,
      submittedAt: new Date().toISOString(),
      processingStatus: 'processed'
    };
    
    submissions.set(submissionId, submission);
    
    // Update student last active
    foundStudent.lastActiveAt = new Date().toISOString();
    
    res.status(201).json({
      success: true,
      message: 'Submission received and processed successfully',
      submissionId: submissionId,
      score: score,
      timestamp: submission.submittedAt,
      studentInfo: {
        name: foundStudent.name,
        accessKey: foundStudent.accessKey
      },
      ec2Info: ec2InstanceInfo,
      clientIp: clientIp
    });
    
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process submission'
    });
  }
});

// Get student submissions
app.get('/api/submissions/student/:accessKey', (req, res) => {
  try {
    const { accessKey } = req.params;
    
    // Find student
    let foundStudent = null;
    for (const [id, student] of students) {
      if (student.accessKey === accessKey) {
        foundStudent = student;
        break;
      }
    }
    
    if (!foundStudent) {
      return res.status(404).json({
        error: 'Student not found',
        message: 'Invalid access key'
      });
    }
    
    // Get submissions for this student
    const studentSubmissions = [];
    for (const [id, submission] of submissions) {
      if (submission.studentId === foundStudent.id) {
        studentSubmissions.push({
          id: submission.id,
          exerciseId: submission.exerciseId,
          score: submission.score,
          submittedAt: submission.submittedAt,
          clientIpAddress: submission.clientIpAddress,
          ec2InstanceInfo: submission.ec2InstanceInfo,
          processingStatus: submission.processingStatus
        });
      }
    }
    
    res.json({
      success: true,
      student: {
        name: foundStudent.name,
        accessKey: foundStudent.accessKey,
        registeredAt: foundStudent.registeredAt
      },
      submissions: studentSubmissions
    });
    
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
});

// Get rankings
app.get('/api/statistics/rankings', (req, res) => {
  try {
    const rankings = [];
    
    // Calculate rankings for each student
    for (const [id, student] of students) {
      let totalScore = 0;
      let completedExercises = 0;
      let lastSubmissionAt = null;
      
      for (const [subId, submission] of submissions) {
        if (submission.studentId === student.id) {
          totalScore += submission.score;
          completedExercises++;
          if (!lastSubmissionAt || submission.submittedAt > lastSubmissionAt) {
            lastSubmissionAt = submission.submittedAt;
          }
        }
      }
      
      rankings.push({
        studentId: student.id,
        studentName: student.name,
        totalScore: totalScore,
        completedExercises: completedExercises,
        averageCompletionTime: 0,
        lastSubmissionAt: lastSubmissionAt
      });
    }
    
    // Sort by score (desc) then by submission time (asc)
    rankings.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      if (a.lastSubmissionAt && b.lastSubmissionAt) {
        return new Date(a.lastSubmissionAt) - new Date(b.lastSubmissionAt);
      }
      return 0;
    });
    
    // Add rank numbers
    const rankedResults = rankings.map((ranking, index) => ({
      rank: index + 1,
      ...ranking
    }));
    
    res.json({
      success: true,
      exerciseId: 'all',
      totalStudents: rankings.length,
      rankings: rankedResults
    });
    
  } catch (error) {
    console.error('Rankings error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch rankings'
    });
  }
});

// Get student statistics
app.get('/api/statistics/student/:accessKey', (req, res) => {
  try {
    const { accessKey } = req.params;
    
    // Find student
    let foundStudent = null;
    for (const [id, student] of students) {
      if (student.accessKey === accessKey) {
        foundStudent = student;
        break;
      }
    }
    
    if (!foundStudent) {
      return res.status(404).json({
        error: 'Student not found',
        message: 'Invalid access key'
      });
    }
    
    // Calculate statistics
    let totalSubmissions = 0;
    let totalScore = 0;
    let highestScore = 0;
    const studentSubmissions = [];
    
    for (const [id, submission] of submissions) {
      if (submission.studentId === foundStudent.id) {
        totalSubmissions++;
        totalScore += submission.score;
        highestScore = Math.max(highestScore, submission.score);
        studentSubmissions.push(submission);
      }
    }
    
    const averageScore = totalSubmissions > 0 ? totalScore / totalSubmissions : 0;
    const completedExercises = studentSubmissions.filter(sub => sub.score > 0).length;
    
    // Calculate rank
    let currentRank = 1;
    let totalParticipants = students.size;
    
    for (const [id, student] of students) {
      if (student.id === foundStudent.id) continue;
      
      let otherTotalScore = 0;
      for (const [subId, submission] of submissions) {
        if (submission.studentId === student.id) {
          otherTotalScore += submission.score;
        }
      }
      
      if (otherTotalScore > totalScore) {
        currentRank++;
      }
    }
    
    res.json({
      success: true,
      student: {
        name: foundStudent.name,
        accessKey: foundStudent.accessKey,
        registeredAt: foundStudent.registeredAt,
        lastActiveAt: foundStudent.lastActiveAt
      },
      statistics: {
        totalSubmissions: totalSubmissions,
        completedExercises: completedExercises,
        totalExercises: exercises.size,
        completionRate: exercises.size > 0 ? (completedExercises / exercises.size) * 100 : 0,
        totalScore: totalScore,
        averageScore: averageScore,
        highestScore: highestScore,
        currentRank: totalParticipants > 0 ? currentRank : null,
        totalParticipants: totalParticipants
      },
      submissions: studentSubmissions.map(sub => ({
        id: sub.id,
        exerciseId: sub.exerciseId,
        exerciseTitle: 'Hands-on Exercise 1',
        score: sub.score,
        submittedAt: sub.submittedAt,
        clientIpAddress: sub.clientIpAddress,
        ec2InstanceInfo: sub.ec2InstanceInfo,
        processingStatus: sub.processingStatus
      })),
      progress: {
        exerciseProgress: [],
        scoreHistory: [],
        submissionTimeline: []
      }
    });
    
  } catch (error) {
    console.error('Student statistics error:', error);
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

app.listen(PORT, () => {
  console.log(`🚀 Exercise 1 API Server running on port ${PORT}`);
  console.log(`📋 API Documentation: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log('\n📚 Available Endpoints:');
  console.log('   POST /api/auth/student/register');
  console.log('   GET  /api/auth/student/lookup/:name');
  console.log('   POST /api/submissions/exercise1');
  console.log('   GET  /api/submissions/student/:accessKey');
  console.log('   GET  /api/statistics/rankings');
  console.log('   GET  /api/statistics/student/:accessKey');
  console.log('\n💡 Test the API with: node student-example.js');
});

export default app;