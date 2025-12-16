#!/usr/bin/env node

/**
 * 测试头像上传功能
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';

// 创建一个简单的测试头像 (1x1像素的PNG)
const testAvatarBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';

async function testAvatarUpload() {
  console.log('🧪 测试头像上传功能');
  console.log('='.repeat(50));
  
  try {
    // 1. 注册学员
    console.log('1. 注册测试学员...');
    const registerResponse = await fetch(`${API_BASE_URL}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '测试学员-头像' })
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
      studentName: '测试学员-头像',
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
    
    // 3. 测试头像下载
    console.log('3. 测试头像下载...');
    const downloadResponse = await fetch(`${API_BASE_URL}/submissions/${submitData.submissionId}/avatar`);
    
    if (downloadResponse.status === 200) {
      const contentType = downloadResponse.headers.get('content-type');
      const contentLength = downloadResponse.headers.get('content-length');
      console.log(`✅ 头像下载成功`);
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   大小: ${contentLength} bytes`);
    } else {
      console.log(`❌ 头像下载失败: ${downloadResponse.status}`);
    }
    
    // 4. 查看提交记录
    console.log('4. 查看提交记录...');
    const submissionsResponse = await fetch(`${API_BASE_URL}/submissions/student/${accessKey}`);
    const submissionsData = await submissionsResponse.json();
    
    if (submissionsData.success) {
      console.log(`✅ 查询到 ${submissionsData.submissions.length} 条提交记录`);
      submissionsData.submissions.forEach(sub => {
        console.log(`   - 提交ID: ${sub.id}, 分数: ${sub.score}`);
        if (sub.avatarInfo) {
          console.log(`     头像: ${sub.avatarInfo.filename} (${sub.avatarInfo.size} bytes)`);
        }
      });
    }
    
    console.log('\n🎉 头像功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testAvatarUpload();