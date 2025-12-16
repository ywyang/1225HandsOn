import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

const toCamelCase = (row) => ({
  id: row.id,
  studentId: row.student_id,
  exerciseId: row.exercise_id,
  clientIpAddress: row.client_ip_address,
  operatingSystem: row.operating_system,
  amiId: row.ami_id,
  internalIpAddress: row.internal_ip_address,
  instanceType: row.instance_type,
  score: row.score,
  submittedAt: row.submitted_at,
  processingStatus: row.processing_status,
  exerciseTitle: row.exercise_title,
  maxScore: row.max_score
});

router.post('/', async (req, res) => {
  try {
    const { studentId, exerciseId, clientIpAddress, operatingSystem, amiId, internalIpAddress, instanceType, score } = req.body;
    const result = await query(
      'INSERT INTO submissions (student_id, exercise_id, client_ip_address, operating_system, ami_id, internal_ip_address, instance_type, score, processing_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, \'processed\') RETURNING *',
      [studentId, exerciseId, clientIpAddress, operatingSystem, amiId, internalIpAddress, instanceType, score || 0]
    );
    res.json({ data: toCamelCase(result.rows[0]) });
  } catch (error) {
    console.error('Submit exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/student/:accessKey', async (req, res) => {
  try {
    const { accessKey } = req.params;
    const result = await query(
      'SELECT sub.*, e.title as exercise_title, e.max_score FROM submissions sub JOIN students s ON sub.student_id = s.id JOIN exercises e ON sub.exercise_id = e.id WHERE s.access_key = $1 ORDER BY sub.submitted_at DESC',
      [accessKey]
    );
    res.json({ data: result.rows.map(toCamelCase) });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
