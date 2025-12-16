#!/usr/bin/env node

/**
 * 检查数据库表结构
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

async function checkDatabase() {
  try {
    console.log('🔍 检查数据库表结构...\n');

    // 检查submissions表结构
    const query = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'submissions' 
      ORDER BY ordinal_position;
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('❌ submissions表不存在');
      console.log('💡 请运行数据库迁移: npm run migrate');
      return;
    }

    console.log('✅ submissions表结构:');
    console.log('='.repeat(80));
    console.log('字段名'.padEnd(25) + '数据类型'.padEnd(20) + '可空'.padEnd(10) + '默认值');
    console.log('-'.repeat(80));
    
    result.rows.forEach(row => {
      console.log(
        row.column_name.padEnd(25) + 
        row.data_type.padEnd(20) + 
        row.is_nullable.padEnd(10) + 
        (row.column_default || '')
      );
    });

    // 检查关键字段
    const requiredFields = [
      'elastic_ip_address',
      'internal_ip_address', 
      'screenshot_data',
      'screenshot_filename',
      'screenshot_mimetype',
      'screenshot_size'
    ];

    console.log('\n🔍 检查关键字段:');
    const existingFields = result.rows.map(row => row.column_name);
    
    requiredFields.forEach(field => {
      const exists = existingFields.includes(field);
      console.log(`   ${exists ? '✅' : '❌'} ${field}`);
    });

    // 检查是否需要迁移
    const missingFields = requiredFields.filter(field => !existingFields.includes(field));
    
    if (missingFields.length > 0) {
      console.log('\n⚠️  缺少字段:', missingFields.join(', '));
      console.log('💡 请运行迁移脚本:');
      console.log('   psql -h localhost -U postgres -d training_system -f migrate-elastic-ip.sql');
    } else {
      console.log('\n🎉 数据库表结构完整！');
    }

  } catch (error) {
    console.error('❌ 数据库检查失败:', error.message);
  } finally {
    await pool.end();
  }
}

// 运行检查
checkDatabase();