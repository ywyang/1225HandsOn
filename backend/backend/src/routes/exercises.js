import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

const toCamelCase = (row) => ({
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
});

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM exercises ORDER BY created_at DESC');
    res.json({ data: result.rows.map(toCamelCase) });
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, requirements, difficulty, maxScore, isPublished } = req.body;
    const result = await query(
      'INSERT INTO exercises (title, description, requirements, difficulty, max_score, is_published) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, requirements, difficulty || 'beginner', maxScore || 100, isPublished || false]
    );
    res.json({ data: toCamelCase(result.rows[0]) });
  } catch (error) {
    console.error('Create exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, requirements, difficulty, maxScore, isPublished } = req.body;
    const result = await query(
      'UPDATE exercises SET title = $1, description = $2, requirements = $3, difficulty = $4, max_score = $5, is_published = $6 WHERE id = $7 RETURNING *',
      [title, description, requirements, difficulty, maxScore, isPublished, id]
    );
    res.json({ data: toCamelCase(result.rows[0]) });
  } catch (error) {
    console.error('Update exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM exercises WHERE id = $1', [id]);
    res.json({ data: { success: true } });
  } catch (error) {
    console.error('Delete exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('UPDATE exercises SET is_published = true WHERE id = $1 RETURNING *', [id]);
    res.json({ data: toCamelCase(result.rows[0]) });
  } catch (error) {
    console.error('Publish exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/unpublish', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('UPDATE exercises SET is_published = false WHERE id = $1 RETURNING *', [id]);
    res.json({ data: toCamelCase(result.rows[0]) });
  } catch (error) {
    console.error('Unpublish exercise error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
