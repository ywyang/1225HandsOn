import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Get Exercise 1 ID by title
    const exerciseResult = await query(`
      SELECT id FROM exercises WHERE title LIKE '%Exercise%' OR title LIKE '%exercise%' ORDER BY created_at ASC LIMIT 1
    `);
    
    if (!exerciseResult.rows[0]) {
      return res.json({
        earliest: [],
        completed: [],
        highestScore: [],
        sameIpGroups: []
      });
    }
    
    const exerciseId = exerciseResult.rows[0].id;

    // Get earliest completion (top 10)
    const earliestResult = await query(`
      SELECT s.name, s.access_key, sub.submitted_at, sub.score
      FROM submissions sub
      JOIN students s ON sub.student_id = s.id
      WHERE sub.exercise_id = $1
      ORDER BY sub.submitted_at ASC
      LIMIT 10
    `, [exerciseId]);

    // Get all completed students with additional fields
    const completedResult = await query(`
      SELECT s.name, s.access_key, sub.submitted_at, sub.score,
             sub.operating_system, sub.ami_id, sub.instance_type,
             sub.internal_ip_address, sub.elastic_ip_address
      FROM submissions sub
      JOIN students s ON sub.student_id = s.id
      WHERE sub.exercise_id = $1 AND sub.score > 0
      ORDER BY sub.submitted_at DESC
    `, [exerciseId]);

    // Get highest score (top 10)
    const highestScoreResult = await query(`
      SELECT s.name, s.access_key, sub.submitted_at, sub.score
      FROM submissions sub
      JOIN students s ON sub.student_id = s.id
      WHERE sub.exercise_id = $1
      ORDER BY sub.score DESC, sub.submitted_at ASC
      LIMIT 10
    `, [exerciseId]);

    // Get students with same elastic IP (elastic_ip_address)
    const sameIpResult = await query(`
      SELECT 
        sub.elastic_ip_address as elastic_ip,
        COUNT(DISTINCT sub.student_id) as student_count,
        json_agg(json_build_object(
          'name', s.name,
          'access_key', s.access_key,
          'submitted_at', sub.submitted_at,
          'score', sub.score
        ) ORDER BY sub.submitted_at) as students
      FROM submissions sub
      JOIN students s ON sub.student_id = s.id
      WHERE sub.exercise_id = $1 AND sub.elastic_ip_address IS NOT NULL
      GROUP BY sub.elastic_ip_address
      HAVING COUNT(DISTINCT sub.student_id) > 1
      ORDER BY student_count DESC
    `, [exerciseId]);

    res.json({
      earliest: earliestResult.rows,
      completed: completedResult.rows,
      highestScore: highestScoreResult.rows,
      sameIpGroups: sameIpResult.rows
    });
  } catch (error) {
    console.error('Exercise 1 stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
