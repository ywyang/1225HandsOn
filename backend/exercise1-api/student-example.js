#!/usr/bin/env node

/**
 * 学员示例程序 - Exercise 1
 * 
 * 这个程序演示了学员如何开发程序来调用API提交练习结果
 */

import fetch from 'node-fetch';
import { execSync } from 'child_process';
import os from 'os';
import fs from 'fs';

// 配置
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const STUDENT_NAME = process.env.STUDENT_NAME || '张三'; // 学员姓名
let ACCESS_KEY = process.env.ACCESS_KEY; // 访问密钥

console.log('🎯 Exercise 1 - 学员提交程序');
console.log('=====================================\n');

/**
 * 获取EC2实例信息
 */
async function getEC2InstanceInfo() {
  console.log('📊 正在收集EC2实例信息...');
  
  try {
    // 获取操作系统信息
    const operatingSystem = `${os.type()} ${os.release()}`;
    
    // 尝试获取AMI ID (在真实EC2环境中)
    let amiId = 'ami-unknown';
    try {
      // 在EC2实例中，可以通过metadata服务获取AMI ID
      const response = await fetch('http://169.254.169.254/latest/meta-data/ami-id', {
        timeout: 2000
      });
      if (response.ok) {
        amiId = await response.text();
      }
    } catch (error) {
      // 如果不在EC2环境中，使用模拟值
      amiId = 'ami-0abcdef1234567890';
      console.log('⚠️  不在EC2环境中，使用模拟AMI ID');
    }
    
    // 获取内网IP地址
    let internalIpAddress = '127.0.0.1';
    try {
      const networkInterfaces = os.networkInterfaces();
      for (const [name, interfaces] of Object.entries(networkInterfaces)) {
        for (const iface of interfaces) {
          if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('10.')) {
            internalIpAddress = iface.address;
            break;
          }
        }
        if (internalIpAddress !== '127.0.0.1') break;
      }
    } catch (error) {
      console.log('⚠️  无法获取内网IP，使用默认值');
      internalIpAddress = '10.0.1.100';
    }
    
    // 尝试获取弹性IP地址
    let elasticIpAddress = '';
    try {
      const response = await fetch('http://169.254.169.254/latest/meta-data/public-ipv4', {
        timeout: 2000
      });
      if (response.ok) {
        elasticIpAddress = await response.text();
      }
    } catch (error) {
      // 如果不在EC2环境中或没有弹性IP，使用模拟值
      elasticIpAddress = '203.0.113.100';
      console.log('⚠️  不在EC2环境中或无弹性IP，使用模拟弹性IP');
    }
    
    // 尝试获取实例类型
    let instanceType = 't3.micro';
    try {
      const response = await fetch('http://169.254.169.254/latest/meta-data/instance-type', {
        timeout: 2000
      });
      if (response.ok) {
        instanceType = await response.text();
      }
    } catch (error) {
      console.log('⚠️  不在EC2环境中，使用模拟实例类型');
    }
    
    const ec2Info = {
      operatingSystem,
      amiId,
      internalIpAddress,
      elasticIpAddress,
      instanceType
    };
    
    console.log('✅ EC2实例信息收集完成:');
    console.log(`   操作系统: ${ec2Info.operatingSystem}`);
    console.log(`   AMI ID: ${ec2Info.amiId}`);
    console.log(`   内网IP: ${ec2Info.internalIpAddress}`);
    console.log(`   弹性IP: ${ec2Info.elasticIpAddress}`);
    console.log(`   实例类型: ${ec2Info.instanceType}\n`);
    
    return ec2Info;
    
  } catch (error) {
    console.error('❌ 获取EC2信息失败:', error.message);
    throw error;
  }
}

/**
 * 学员注册或获取访问密钥
 */
async function getAccessKey() {
  if (ACCESS_KEY) {
    console.log(`🔑 使用现有访问密钥: ${ACCESS_KEY}`);
    return ACCESS_KEY;
  }
  
  console.log('📝 正在注册学员账户...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/student/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: STUDENT_NAME
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      ACCESS_KEY = data.student.accessKey;
      console.log(`✅ 注册成功! 访问密钥: ${ACCESS_KEY}`);
      console.log(`💡 请保存此访问密钥，下次可直接使用\n`);
      return ACCESS_KEY;
    } else {
      throw new Error(data.message || '注册失败');
    }
    
  } catch (error) {
    console.error('❌ 学员注册失败:', error.message);
    throw error;
  }
}

/**
 * 创建头像图片 (示例)
 */
async function createAvatar() {
  console.log('👤 创建头像图片...');
  
  try {
    // 创建一个简单的头像图片 (64x64像素的彩色方块)
    // 这里使用一个预定义的小头像图片的base64数据
    const avatarBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
    
    console.log('✅ 头像创建成功!');
    
    return {
      base64: `data:image/png;base64,${avatarBase64}`
    };
    
  } catch (error) {
    console.log('⚠️  头像创建失败:', error.message);
    return null;
  }
}

/**
 * 提交练习完成数据 (支持头像)
 */
async function submitExercise(ec2Info, avatar = null) {
  console.log('📤 正在提交练习数据到训练系统...');
  
  try {
    const submissionData = {
      studentName: STUDENT_NAME,
      ec2InstanceInfo: ec2Info
    };
    
    // 添加头像数据 (如果有)
    if (avatar) {
      submissionData.avatarBase64 = avatar.base64;
      console.log('   👤 包含头像数据');
    }
    
    const response = await fetch(`${API_BASE_URL}/submissions/exercise1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submissionData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('🎉 提交成功!');
      console.log(`   提交ID: ${data.submissionId}`);
      console.log(`   获得分数: ${data.score}`);
      console.log(`   提交时间: ${data.timestamp}`);
      console.log(`   客户端IP: ${data.clientIp}`);
      if (data.avatarInfo) {
        console.log(`   👤 头像: ${data.avatarInfo.filename} (${data.avatarInfo.size} bytes)`);
      }
      console.log();
      return data;
    } else {
      throw new Error(data.message || '提交失败');
    }
    
  } catch (error) {
    console.error('❌ 提交失败:', error.message);
    throw error;
  }
}

/**
 * 查看学员成绩和排名
 */
async function checkResults() {
  console.log('📊 正在查询成绩和排名...');
  
  try {
    // 获取个人统计
    const statsResponse = await fetch(`${API_BASE_URL}/statistics/student/${ACCESS_KEY}`);
    const statsData = await statsResponse.json();
    
    if (statsData.success) {
      const stats = statsData.statistics;
      console.log('📈 个人成绩统计:');
      console.log(`   总分: ${stats.totalScore}`);
      console.log(`   完成练习数: ${stats.completedExercises}/${stats.totalExercises}`);
      console.log(`   平均分: ${stats.averageScore.toFixed(1)}`);
      console.log(`   完成率: ${stats.completionRate.toFixed(1)}%`);
      if (stats.currentRank) {
        console.log(`   当前排名: ${stats.currentRank}/${stats.totalParticipants}\n`);
      }
    }
    
    // 获取排行榜
    const rankingsResponse = await fetch(`${API_BASE_URL}/statistics/rankings`);
    const rankingsData = await rankingsResponse.json();
    
    if (rankingsData.success && rankingsData.rankings.length > 0) {
      console.log('🏆 排行榜 (前5名):');
      rankingsData.rankings.slice(0, 5).forEach(ranking => {
        const isCurrentStudent = ranking.studentName === STUDENT_NAME;
        const marker = isCurrentStudent ? '👤' : '  ';
        console.log(`${marker} ${ranking.rank}. ${ranking.studentName} - ${ranking.totalScore}分`);
      });
      console.log();
    }
    
  } catch (error) {
    console.error('❌ 查询成绩失败:', error.message);
  }
}

/**
 * 主程序
 */
async function main() {
  try {
    console.log(`👋 学员: ${STUDENT_NAME}`);
    console.log(`🌐 API地址: ${API_BASE_URL}\n`);
    
    // 1. 获取访问密钥
    await getAccessKey();
    
    // 2. 收集EC2实例信息
    const ec2Info = await getEC2InstanceInfo();
    
    // 3. 创建头像图片
    const avatar = await createAvatar();
    
    // 4. 提交练习数据
    await submitExercise(ec2Info, avatar);
    
    // 5. 查看成绩和排名
    await checkResults();
    
    console.log('✨ 程序执行完成!');
    console.log('\n💡 提示:');
    console.log('   - 请保存您的访问密钥以备后用');
    console.log('   - 可以多次运行此程序来更新提交');
    console.log('   - 访问训练系统网页查看详细统计信息');
    
  } catch (error) {
    console.error('\n💥 程序执行失败:', error.message);
    console.log('\n🔧 故障排除:');
    console.log('   1. 检查网络连接');
    console.log('   2. 确认API服务器正在运行');
    console.log('   3. 验证学员姓名和访问密钥');
    process.exit(1);
  }
}

// 运行主程序
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };