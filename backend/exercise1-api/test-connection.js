#!/usr/bin/env node

/**
 * 简单的数据库连接测试
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'hands_on_training',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function testConnection() {
  try {
    console.log('🔍 测试数据库连接...');
    console.log('数据库配置:');
    console.log(`  主机: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`  端口: ${process.env.DB_PORT || '5432'}`);
    console.log(`  数据库: ${process.env.DB_NAME || 'hands_on_training'}`);
    console.log(`  用户: ${process.env.DB_USER || 'postgres'}`);
    
    // 测试连接
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ 数据库连接成功!');
    console.log('当前时间:', result.rows[0].current_time);
    console.log('数据库版本:', result.rows[0].version);
    
    // 检查表是否存在
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('students', 'exercises', 'submissions')
      ORDER BY table_name;
    `;
    const tables = await pool.query(tablesQuery);
    console.log('\n📋 存在的表:', tables.rows.map(r => r.table_name).join(', '));
    
    if (tables.rows.length < 3) {
      console.log('⚠️  某些表可能不存在，请检查数据库迁移');
    }
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('请检查:');
    console.error('1. PostgreSQL服务是否运行');
    console.error('2. 数据库配置是否正确');
    console.error('3. 数据库是否存在');
  } finally {
    await pool.end();
  }
}

testConnection();