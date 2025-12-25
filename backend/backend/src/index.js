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
import exercise1StatsRoutes from './routes/exercise1-stats.js';
import quicksuiteStatsRoutes from './routes/quicksuite-stats.js';

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
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'Hands-on Training System API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/sql', sqlRoutes);
app.use('/api/exercise1-stats', exercise1StatsRoutes);
app.use('/api/quicksuite-stats', quicksuiteStatsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;