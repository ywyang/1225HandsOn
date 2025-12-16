#!/usr/bin/env node

/**
 * 调试数据库写入问题
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

async function debugDatabase() {
  try {
    console.log('🔍 调试数据库写入问题...\n');

    // 1. 检查数据库连接
    console.log('1️⃣ 测试数据库连接...');
    const connectionTest = await pool.query('SELECT NOW() as current_time');
    console.log('✅ 数据库连接成功:', connectionTest.rows[0].current_time);

    // 2. 检查表是否存在
    console.log('\n2️⃣ 检查表结构...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('students', 'exercises', 'submissions')
      ORDER BY table_name;
    `;
    const tables = await pool.query(tablesQuery);
    console.log('📋 存在的表:', tables.rows.map(r => r.table_name).join(', '));

    // 3. 检查submissions表结构
    if (tables.rows.some(r => r.table_name === 'submissions')) {
      console.log('\n3️⃣ submissions表结构:');
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'submissions' 
        ORDER BY ordinal_position;
      `;
      const columns = await pool.query(columnsQuery);
      columns.rows.forEach(col => {
        console.log(`   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }

    // 4. 检查现有数据
    console.log('\n4️⃣ 检查现有数据...');
    
    // 检查学员数据
    const studentsCount = await pool.query('SELECT COUNT(*) as count FROM students');
    console.log(`👥 学员数量: ${studentsCount.rows[0].count}`);
    
    if (parseInt(studentsCount.rows[0].count) > 0) {
      const recentStudents = await pool.query('SELECT name, access_key, registered_at FROM students ORDER BY registered_at DESC LIMIT 3');
      console.log('📝 最近注册的学员:');
      recentStudents.rows.forEach(student => {
        console.log(`   ${student.name} (${student.access_key}) - ${student.registered_at}`);
      });
    }

    // 检查练习数据
    const exercisesCount = await pool.query('SELECT COUNT(*) as count FROM exercises');
    console.log(`📚 练习数量: ${exercisesCount.rows[0].count}`);

    // 检查提交数据
    const submissionsCount = await pool.query('SELECT COUNT(*) as count FROM submissions');
    console.log(`📤 提交数量: ${submissionsCount.rows[0].count}`);
    
    if (parseInt(submissionsCount.rows[0].count) > 0) {
      const recentSubmissions = await pool.query(`
        SELECT s.id, st.name as student_name, s.score, s.submitted_at, s.processing_status
        FROM submissions s
        JOIN students st ON s.student_id = st.id
        ORDER BY s.submitted_at DESC 
        LIMIT 5
      `);
      console.log('📋 最近的提交:');
      recentSubmissions.rows.forEach(sub => {
        console.log(`   ${sub.student_name} - 分数:${sub.score} - ${sub.submitted_at} - ${sub.processing_status}`);
      });
    }

    // 5. 测试插入操作
    console.log('\n5️⃣ 测试数据插入...');
    
    // 创建测试学员
    const testStudentName = `测试学员_${Date.now()}`;
    const testAccessKey = `test_${Math.random().toString(36).substring(7)}`;
    
    console.log(`🧪 创建测试学员: ${testStudentName}`);
    const studentInsert = await pool.query(
      'INSERT INTO students (name, access_key) VALUES ($1, $2) RETURNING id, name, access_key',
      [testStudentName, testAccessKey]
    );
    const testStudent = studentInsert.rows[0];
    console.log('✅ 学员创建成功:', testStudent);

    // 获取或创建练习
    let exerciseId;
    const exerciseQuery = await pool.query("SELECT id FROM exercises WHERE title = 'Hands-on Exercise 1'");
    
    if (exerciseQuery.rows.length > 0) {
      exerciseId = exerciseQuery.rows[0].id;
      console.log('📚 使用现有练习:', exerciseId);
    } else {
      console.log('📚 创建新练习...');
      const exerciseInsert = await pool.query(`
        INSERT INTO exercises (title, description, requirements, difficulty, max_score, is_published, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        'Hands-on Exercise 1',
        'Submit EC2 instance information via API call',
        'Develop a local program that calls the submission API with student information and EC2 instance details',
        'beginner',
        100,
        true,
        'system'
      ]);
      exerciseId = exerciseInsert.rows[0].id;
      console.log('✅ 练习创建成功:', exerciseId);
    }

    // 测试提交插入
    console.log('📤 测试提交插入...');
    const testSubmission = await pool.query(`
      INSERT INTO submissions (
        student_id, exercise_id, client_ip_address, 
        operating_system, ami_id, internal_ip_address, elastic_ip_address, instance_type,
        screenshot_data, screenshot_filename, screenshot_mimetype, screenshot_size,
        score, processing_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, submitted_at
    `, [
      testStudent.id,
      exerciseId,
      '127.0.0.1',
      'Amazon Linux 2',
      'ami-test123',
      '10.0.1.100',
      '203.0.113.100',
      't3.micro',
      Buffer.from('test image data'),
      'test-avatar.png',
      'image/png',
      1024,
      100,
      'processed'
    ]);
    
    console.log('✅ 提交插入成功:', testSubmission.rows[0]);

    // 验证数据
    console.log('\n6️⃣ 验证插入的数据...');
    const verifyQuery = await pool.query(`
      SELECT s.*, st.name as student_name, e.title as exercise_title
      FROM submissions s
      JOIN students st ON s.student_id = st.id
      JOIN exercises e ON s.exercise_id = e.id
      WHERE s.id = $1
    `, [testSubmission.rows[0].id]);
    
    const submission = verifyQuery.rows[0];
    console.log('📋 验证结果:');
    console.log(`   学员: ${submission.student_name}`);
    console.log(`   练习: ${submission.exercise_title}`);
    console.log(`   分数: ${submission.score}`);
    console.log(`   操作系统: ${submission.operating_system}`);
    console.log(`   AMI ID: ${submission.ami_id}`);
    console.log(`   内网IP: ${submission.internal_ip_address}`);
    console.log(`   弹性IP: ${submission.elastic_ip_address}`);
    console.log(`   实例类型: ${submission.instance_type}`);
    console.log(`   头像大小: ${submission.screenshot_size} bytes`);
    console.log(`   处理状态: ${submission.processing_status}`);

    // 清理测试数据
    console.log('\n7️⃣ 清理测试数据...');
    await pool.query('DELETE FROM submissions WHERE id = $1', [testSubmission.rows[0].id]);
    await pool.query('DELETE FROM students WHERE id = $1', [testStudent.id]);
    console.log('✅ 测试数据已清理');

    console.log('\n🎉 数据库调试完成！所有操作正常。');

  } catch (error) {
    console.error('❌ 调试过程中出错:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
  } finally {
    await pool.end();
  }
}

// 运行调试
debugDatabase();