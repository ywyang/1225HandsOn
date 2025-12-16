import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

const router = express.Router();

const studentToCamelCase = (row) => ({
  id: row.id,
  name: row.name,
  accessKey: row.access_key,
  registeredAt: row.registered_at,
  lastActiveAt: row.last_active_at
});

router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await query('SELECT * FROM administrators WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const admin = result.rows[0];
    const validPassword = await bcrypt.compare(password, admin.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin' },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );
    
    await query('UPDATE administrators SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [admin.id]);
    
    res.json({
      data: {
        token,
        user: { id: admin.id, username: admin.username, email: admin.email }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/student/register', async (req, res) => {
  try {
    const { name } = req.body;
    const accessKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const result = await query('INSERT INTO students (name, access_key) VALUES ($1, $2) RETURNING *', [name, accessKey]);
    res.json({ data: { student: studentToCamelCase(result.rows[0]) } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/student/lookup/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const result = await query('SELECT * FROM students WHERE name = $1', [name]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ data: { student: studentToCamelCase(result.rows[0]) } });
  } catch (error) {
    console.error('Lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
