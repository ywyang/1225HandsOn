#!/usr/bin/env node

/**
 * 测试头像数据存储到数据库
 */

import fetch from 'node-fetch';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = 'http://localhost:3001/api';

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'training_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// 创建一个简单的测试头像 (红色1x1像素PNG)
const testAvatarBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

async function testAvatarStorage() {
  console.log('🧪 测试头像数据存储到数据库');
  console.log('='.repeat(60));
  
  try {
    // 1. 注册学员
    console.log('1. 注册测试学员...');
    const registerResponse = await fetch(`${API_BASE_URL}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '测试学员-数据库存储' })
    });
    
    const registerData = await registerResponse.json();
    if (!registerData.success) {
      throw new Error('注册失败: ' + registerData.message);
    }
    
    const accessKey = registerData.student.accessKey;
    console.log(`✅ 注册成功，Access Key: ${accessKey}`);
    
    // 2. 提交带头像的数据
    console.log('2. 提交带头像的练习数据...');
    const submissionData = {
      studentName: '测试学员-数据库存储',
      accessKey: accessKey,
      ec2InstanceInfo: {
        operatingSystem: 'Test Linux',
        amiId: 'ami-test123',
        internalIpAddress: '10.0.1.200',
        elasticIpAddress: '203.0.113.200',
        instanceType: 't3.nano'
      },
      avatarBase64: `data:image/png;base64,${testAvatarBase64}`
    };
    
    const submitResponse = await fetch(`${API_BASE_URL}/submissions/exercise1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData)
    });
    
    const submitData = await submitResponse.json();
    if (!submitData.success) {
      throw new Error('提交失败: ' + submitData.message);
    }
    
    console.log(`✅ 提交成功！`);
    console.log(`   分数: ${submitData.score}`);
    console.log(`   提交ID: ${submitData.submissionId}`);
    if (submitData.avatarInfo) {
      console.log(`   头像: ${submitData.avatarInfo.filename} (${submitData.avatarInfo.size} bytes)`);
    }
    
    // 3. 直接从数据库查询验证数据
    console.log('3. 从数据库验证头像数据...');
    const dbQuery = `
      SELECT 
        screenshot_data,
        screenshot_filename,
        screenshot_mimetype,
        screenshot_size,
        LENGTH(screenshot_data) as actual_size
      FROM submissions 
      WHERE id = $1
    `;
    
    const dbResult = await pool.query(dbQuery, [submitData.submissionId]);
    
    if (dbResult.rows.length === 0) {
      throw new Error('数据库中未找到提交记录');
    }
    
    const dbRow = dbResult.rows[0];
    
    console.log('✅ 数据库中的头像数据:');
    console.log(`   文件名: ${dbRow.screenshot_filename}`);
    console.log(`   MIME类型: ${dbRow.screenshot_mimetype}`);
    console.log(`   记录的大小: ${dbRow.screenshot_size} bytes`);
    console.log(`   实际大小: ${dbRow.actual_size} bytes`);
    console.log(`   数据存在: ${dbRow.screenshot_data ? '是' : '否'}`);
    
    // 4. 验证数据完整性
    if (dbRow.screenshot_data) {
      const storedBase64 = dbRow.screenshot_data.toString('base64');
      const isDataIntact = storedBase64 === testAvatarBase64;
      console.log(`   数据完整性: ${isDataIntact ? '✅ 完整' : '❌ 损坏'}`);
      
      if (!isDataIntact) {
        console.log(`   原始数据: ${testAvatarBase64.substring(0, 50)}...`);
        console.log(`   存储数据: ${storedBase64.substring(0, 50)}...`);
      }
    } else {
      console.log('   ❌ 头像数据为空');
    }
    
    // 5. 测试头像下载
    console.log('4. 测试头像下载...');
    const downloadResponse = await fetch(`${API_BASE_URL}/submissions/${submitData.submissionId}/avatar`);
    
    if (downloadResponse.status === 200) {
      const contentType = downloadResponse.headers.get('content-type');
      const contentLength = downloadResponse.headers.get('content-length');
      const avatarBuffer = await downloadResponse.buffer();
      
      console.log(`✅ 头像下载成功`);
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Content-Length: ${contentLength} bytes`);
      console.log(`   实际下载大小: ${avatarBuffer.length} bytes`);
      
      // 验证下载的数据是否与原始数据一致
      const downloadedBase64 = avatarBuffer.toString('base64');
      const isDownloadIntact = downloadedBase64 === testAvatarBase64;
      console.log(`   下载数据完整性: ${isDownloadIntact ? '✅ 完整' : '❌ 损坏'}`);
      
    } else {
      console.log(`❌ 头像下载失败: ${downloadResponse.status}`);
    }
    
    console.log('\n🎉 头像数据存储测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await pool.end();
  }
}

// 运行测试
testAvatarStorage();