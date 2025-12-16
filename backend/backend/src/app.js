import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import exerciseRoutes from './routes/exercises.js';
import submissionRoutes from './routes/submissions.js';
import statisticsRoutes from './routes/statistics.js';
import sqlRoutes from './routes/sql.js';

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Hands-on Training System API is running'
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Hands-on Training System API',
    version: '1.0.0',
    endpoints: [
      'POST /api/auth/student/register',
      'GET /api/auth/student/lookup/:name',
      'POST /api/submissions/exercise1',
      'GET /api/submissions/student/:accessKey',
      'GET /api/statistics/rankings',
      'GET /api/statistics/student/:accessKey',
      'POST /api/sql/execute',
      'GET /api/sql/schema',
      'GET /api/sql/samples'
    ]
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/sql', sqlRoutes);

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

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Hands-on Training API Server running on port ${PORT}`);
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
}

export default app;