#!/usr/bin/env node

/**
 * 启动服务器并验证
 */

import { spawn } from 'child_process';
import fetch from 'node-fetch';

const PORT = process.env.PORT || 3001;
const API_BASE_URL = `http://localhost:${PORT}`;

async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, { timeout: 1000 });
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // 服务器还没准备好，继续等待
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.stdout.write('.');
  }
  return false;
}

async function startServer() {
  console.log('🚀 启动Exercise 1 API服务器...');
  console.log(`端口: ${PORT}`);
  
  // 启动服务器进程
  const serverProcess = spawn('node', ['server.js'], {
    stdio: 'pipe',
    cwd: process.cwd()
  });
  
  // 监听服务器输出
  serverProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error('服务器错误:', data.toString());
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ 启动失败:', error.message);
    process.exit(1);
  });
  
  // 等待服务器启动
  console.log('⏳ 等待服务器启动');
  const isReady = await waitForServer();
  
  if (isReady) {
    console.log('\n✅ 服务器启动成功!');
    console.log(`🌐 API地址: ${API_BASE_URL}`);
    console.log('📋 可用端点:');
    
    try {
      const apiResponse = await fetch(`${API_BASE_URL}/api`);
      const apiData = await apiResponse.json();
      apiData.endpoints.forEach(endpoint => {
        console.log(`   ${endpoint}`);
      });
    } catch (error) {
      console.log('   无法获取端点列表');
    }
    
    console.log('\n💡 测试命令:');
    console.log('   npm run test');
    console.log('   python test-api.py');
    console.log('\n按 Ctrl+C 停止服务器');
    
  } else {
    console.log('\n❌ 服务器启动超时');
    serverProcess.kill();
    process.exit(1);
  }
  
  // 处理退出信号
  process.on('SIGINT', () => {
    console.log('\n🛑 正在停止服务器...');
    serverProcess.kill();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 正在停止服务器...');
    serverProcess.kill();
    process.exit(0);
  });
}

startServer();