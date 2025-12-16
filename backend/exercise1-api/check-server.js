#!/usr/bin/env node

/**
 * 检查服务器状态
 */

import fetch from 'node-fetch';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

async function checkServer() {
  try {
    console.log('🔍 检查服务器状态...');
    console.log(`服务器地址: ${API_BASE_URL}`);
    
    // 检查健康状态
    console.log('\n1️⃣ 检查健康状态...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`, {
      timeout: 5000
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ 服务器运行正常');
      console.log('响应:', healthData);
    } else {
      console.log('❌ 健康检查失败:', healthResponse.status, healthResponse.statusText);
    }
    
    // 检查API信息
    console.log('\n2️⃣ 检查API信息...');
    const apiResponse = await fetch(`${API_BASE_URL}/api`);
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('✅ API信息获取成功');
      console.log('可用端点:');
      apiData.endpoints.forEach(endpoint => {
        console.log(`   ${endpoint}`);
      });
    } else {
      console.log('❌ API信息获取失败:', apiResponse.status, apiResponse.statusText);
    }
    
    // 测试提交端点
    console.log('\n3️⃣ 测试提交端点...');
    const submitResponse = await fetch(`${API_BASE_URL}/api/submissions/exercise1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // 空数据，应该返回验证错误而不是404
    });
    
    console.log(`提交端点状态码: ${submitResponse.status}`);
    
    if (submitResponse.status === 404) {
      console.log('❌ 提交端点不存在 (404错误)');
      const errorText = await submitResponse.text();
      console.log('错误响应:', errorText);
    } else if (submitResponse.status === 400) {
      console.log('✅ 提交端点存在 (返回验证错误，这是正常的)');
      const errorData = await submitResponse.json();
      console.log('验证错误:', errorData.error);
    } else {
      console.log(`⚠️ 意外的状态码: ${submitResponse.status}`);
      const responseText = await submitResponse.text();
      console.log('响应:', responseText);
    }
    
  } catch (error) {
    console.error('❌ 服务器检查失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 解决建议:');
      console.log('1. 启动服务器: npm start');
      console.log('2. 检查端口是否被占用: netstat -tlnp | grep :3000');
      console.log('3. 确认服务器地址正确');
    }
  }
}

checkServer();