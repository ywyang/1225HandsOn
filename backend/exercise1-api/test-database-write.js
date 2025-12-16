#!/usr/bin/env node

/**
 * 测试API数据写入功能
 */

import fetch from 'node-fetch';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'hands_on_training',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function testDatabaseWrite() {
  try {
    console.log('🧪 测试API数据写入功能...\n');

    const testStudentName = `测试学员_${Date.now()}`;
    let accessKey;
    let submissionId;

    // 1. 注册学员
    console.log('1️⃣ 注册测试学员...');
    const registerResponse = await fetch(`${API_BASE_URL}/api/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testStudentName })
    });

    if (!registerResponse.ok) {
      throw new Error(`注册失败: ${registerResponse.status} ${registerResponse.statusText}`);
    }

    const registerData = await registerResponse.json();
    accessKey = registerData.student.accessKey;
    console.log('✅ 学员注册成功:', testStudentName, '访问密钥:', accessKey);

    // 2. 检查数据库中的学员记录
    console.log('\n2️⃣ 验证学员数据写入...');
    const studentQuery = await pool.query(
      'SELECT * FROM students WHERE name = $1 AND access_key = $2',
      [testStudentName, accessKey]
    );
    
    if (studentQuery.rows.length === 0) {
      throw new Error('❌ 学员数据未写入数据库');
    }
    console.log('✅ 学员数据已正确写入数据库');

    // 3. 提交练习数据
    console.log('\n3️⃣ 提交练习数据...');
    const submissionData = {
      studentName: testStudentName,
      accessKey: accessKey,
      ec2InstanceInfo: {
        operatingSystem: 'Amazon Linux 2',
        amiId: 'ami-test123456',
        internalIpAddress: '10.0.1.100',
        elasticIpAddress: '203.0.113.100',
        instanceType: 't3.micro'
      },
      avatarBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    };

    const submitResponse = await fetch(`${API_BASE_URL}/api/submissions/exercise1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData)
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      throw new Error(`提交失败: ${submitResponse.status} ${submitResponse.statusText}\n${errorText}`);
    }

    const submitData = await submitResponse.json();
    submissionId = submitData.submissionId;
    console.log('✅ 练习提交成功，提交ID:', submissionId, '分数:', submitData.score);

    // 4. 检查数据库中的提交记录
    console.log('\n4️⃣ 验证提交数据写入...');
    const submissionQuery = await pool.query(`
      SELECT s.*, st.name as student_name, e.title as exercise_title
      FROM submissions s
      JOIN students st ON s.student_id = st.id
      LEFT JOIN exercises e ON s.exercise_id = e.id
      WHERE s.id = $1
    `, [submissionId]);

    if (submissionQuery.rows.length === 0) {
      throw new Error('❌ 提交数据未写入数据库');
    }

    const submission = submissionQuery.rows[0];
    console.log('✅ 提交数据已正确写入数据库:');
    console.log(`   学员姓名: ${submission.student_name}`);
    console.log(`   练习标题: ${submission.exercise_title || '未找到练习'}`);
    console.log(`   分数: ${submission.score}`);
    console.log(`   操作系统: ${submission.operating_system}`);
    console.log(`   AMI ID: ${submission.ami_id}`);
    console.log(`   内网IP: ${submission.internal_ip_address}`);
    console.log(`   弹性IP: ${submission.elastic_ip_address}`);
    console.log(`   实例类型: ${submission.instance_type}`);
    console.log(`   头像数据: ${submission.screenshot_data ? '已存储' : '未存储'}`);
    console.log(`   头像大小: ${submission.screenshot_size || 0} bytes`);
    console.log(`   处理状态: ${submission.processing_status}`);

    // 5. 测试查询API
    console.log('\n5️⃣ 测试查询API...');
    const queryResponse = await fetch(`${API_BASE_URL}/api/submissions/student/${accessKey}`);
    
    if (!queryResponse.ok) {
      throw new Error(`查询失败: ${queryResponse.status} ${queryResponse.statusText}`);
    }

    const queryData = await queryResponse.json();
    console.log('✅ 查询API正常，返回提交数量:', queryData.submissions.length);

    if (queryData.submissions.length > 0) {
      const latestSubmission = queryData.submissions[0];
      console.log('📋 最新提交信息:');
      console.log(`   提交ID: ${latestSubmission.id}`);
      console.log(`   分数: ${latestSubmission.score}`);
      console.log(`   EC2信息: ${JSON.stringify(latestSubmission.ec2InstanceInfo)}`);
      console.log(`   头像信息: ${latestSubmission.avatarInfo ? '有头像' : '无头像'}`);
    }

    // 6. 测试头像下载
    if (submission.screenshot_data) {
      console.log('\n6️⃣ 测试头像下载...');
      const avatarResponse = await fetch(`${API_BASE_URL}/api/submissions/${submissionId}/avatar`);
      
      if (avatarResponse.ok) {
        const avatarBuffer = await avatarResponse.buffer();
        console.log('✅ 头像下载成功，大小:', avatarBuffer.length, 'bytes');
      } else {
        console.log('⚠️ 头像下载失败:', avatarResponse.status);
      }
    }

    // 7. 清理测试数据
    console.log('\n7️⃣ 清理测试数据...');
    await pool.query('DELETE FROM submissions WHERE id = $1', [submissionId]);
    await pool.query('DELETE FROM students WHERE access_key = $1', [accessKey]);
    console.log('✅ 测试数据已清理');

    console.log('\n🎉 所有测试通过！API数据写入功能正常。');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    await pool.end();
  }
}

// 运行测试
testDatabaseWrite();