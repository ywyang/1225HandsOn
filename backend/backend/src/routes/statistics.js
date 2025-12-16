import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

router.get('/rankings', async (req, res) => {
  try {
    const result = await query(`
      SELECT s.id, s.name, s.access_key, COUNT(DISTINCT sub.exercise_id) as completed_exercises,
             COALESCE(SUM(sub.score), 0) as total_score, MAX(sub.submitted_at) as last_submission,
             COALESCE(AVG(EXTRACT(EPOCH FROM (sub.submitted_at - s.registered_at))/60), 0) as average_completion_time
      FROM students s LEFT JOIN submissions sub ON s.id = sub.student_id
      GROUP BY s.id, s.name, s.access_key ORDER BY total_score DESC, last_submission ASC
    `);
    const rankings = result.rows.map((row, index) => ({
      id: row.id, name: row.name, accessKey: row.access_key,
      completedExercises: parseInt(row.completed_exercises),
      totalScore: parseInt(row.total_score), lastSubmission: row.last_submission,
      rank: index + 1,
      averageCompletionTime: parseFloat(row.average_completion_time) || 0
    }));
    res.json({ data: rankings });
  } catch (error) {
    console.error('Get rankings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/progress', async (req, res) => {
  try {
    const result = await query(`
      SELECT e.id as exercise_id, e.title, COUNT(DISTINCT sub.student_id) as completed_count, AVG(sub.score) as average_score
      FROM exercises e LEFT JOIN submissions sub ON e.id = sub.exercise_id
      WHERE e.is_published = true GROUP BY e.id, e.title ORDER BY e.created_at DESC
    `);
    const progress = result.rows.map(row => ({
      exerciseId: row.exercise_id, title: row.title,
      completedCount: parseInt(row.completed_count),
      averageScore: row.average_score ? parseFloat(row.average_score) : 0
    }));
    res.json({ data: progress });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const [students, exercises, submissions] = await Promise.all([
      query('SELECT COUNT(*) as count FROM students'),
      query('SELECT COUNT(*) as count FROM exercises WHERE is_published = true'),
      query('SELECT COUNT(*) as count FROM submissions')
    ]);
    res.json({
      data: {
        totalStudents: parseInt(students.rows[0].count),
        totalExercises: parseInt(exercises.rows[0].count),
        totalSubmissions: parseInt(submissions.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
