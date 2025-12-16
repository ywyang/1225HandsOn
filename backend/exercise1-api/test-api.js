#!/usr/bin/env node

/**
 * Simple test script for Exercise 1 API
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';

// Test configuration
const TEST_STUDENT = {
  name: 'Test Student',
  accessKey: null // Will be set after registration
};

const TEST_EC2_INFO = {
  operatingSystem: 'Amazon Linux 2',
  amiId: 'ami-0abcdef1234567890',
  internalIpAddress: '10.0.1.100',
  elasticIpAddress: '203.0.113.100',
  instanceType: 't3.micro'
};

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    console.log(`${options.method || 'GET'} ${url}`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('---');
    
    return { response, data };
  } catch (error) {
    console.error('Request failed:', error.message);
    return null;
  }
}

async function testHealthCheck() {
  console.log('=== Testing Health Check ===');
  
  const result = await makeRequest('http://localhost:3001/health');
  
  if (result && result.response.status === 200) {
    console.log('✅ Health check successful');
  } else {
    console.log('❌ Health check failed');
    return false;
  }
  
  return true;
}

async function testStudentRegistration() {
  console.log('=== Testing Student Registration ===');
  
  const result = await makeRequest(`${API_BASE_URL}/auth/student/register`, {
    method: 'POST',
    body: JSON.stringify({
      name: TEST_STUDENT.name
    })
  });
  
  if (result && result.data.success) {
    TEST_STUDENT.accessKey = result.data.student.accessKey;
    console.log(`✅ Student registered with access key: ${TEST_STUDENT.accessKey}`);
  } else {
    console.log('❌ Student registration failed');
    return false;
  }
  
  return true;
}

async function testAccessKeyLookup() {
  console.log('=== Testing Access Key Lookup ===');
  
  const result = await makeRequest(`${API_BASE_URL}/auth/student/lookup/${encodeURIComponent(TEST_STUDENT.name)}`);
  
  if (result && result.data.success && result.data.student.accessKey === TEST_STUDENT.accessKey) {
    console.log('✅ Access key lookup successful');
  } else {
    console.log('❌ Access key lookup failed');
    return false;
  }
  
  return true;
}

async function testExercise1Submission() {
  console.log('=== Testing Exercise 1 Submission (without avatar) ===');
  
  const submissionData = {
    studentName: TEST_STUDENT.name,
    accessKey: TEST_STUDENT.accessKey,
    ec2InstanceInfo: TEST_EC2_INFO
  };
  
  const result = await makeRequest(`${API_BASE_URL}/submissions/exercise1`, {
    method: 'POST',
    body: JSON.stringify(submissionData)
  });
  
  if (result && result.data.success) {
    console.log(`✅ Exercise 1 submission successful! Score: ${result.data.score}`);
    console.log(`   Submission ID: ${result.data.submissionId}`);
    return result.data.submissionId;
  } else {
    console.log('❌ Exercise 1 submission failed');
    return null;
  }
}

async function testExercise1SubmissionWithAvatar() {
  console.log('=== Testing Exercise 1 Submission (with avatar) ===');
  
  // Create a simple test avatar in base64 format (1x1 pixel PNG)
  const testAvatarBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
  
  const submissionData = {
    studentName: TEST_STUDENT.name,
    accessKey: TEST_STUDENT.accessKey,
    ec2InstanceInfo: TEST_EC2_INFO,
    avatarBase64: `data:image/png;base64,${testAvatarBase64}`
  };
  
  const result = await makeRequest(`${API_BASE_URL}/submissions/exercise1`, {
    method: 'POST',
    body: JSON.stringify(submissionData)
  });
  
  if (result && result.data.success) {
    console.log(`✅ Exercise 1 submission with avatar successful! Score: ${result.data.score}`);
    console.log(`   Submission ID: ${result.data.submissionId}`);
    if (result.data.avatarInfo) {
      console.log(`   Avatar: ${result.data.avatarInfo.filename} (${result.data.avatarInfo.size} bytes)`);
    }
    return result.data.submissionId;
  } else {
    console.log('❌ Exercise 1 submission with avatar failed');
    return null;
  }
}

async function testAvatarDownload(submissionId) {
  console.log('=== Testing Avatar Download ===');
  
  try {
    const response = await fetch(`${API_BASE_URL}/submissions/${submissionId}/avatar`);
    
    console.log(`GET ${API_BASE_URL}/submissions/${submissionId}/avatar`);
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      console.log(`Content-Type: ${contentType}`);
      console.log(`Content-Length: ${contentLength} bytes`);
      console.log('✅ Avatar download successful');
      return true;
    } else if (response.status === 404) {
      console.log('⚠️  No avatar found for this submission');
      return true; // This is expected for submissions without avatars
    } else {
      console.log('❌ Avatar download failed');
      return false;
    }
  } catch (error) {
    console.error('Avatar download error:', error.message);
    return false;
  }
}

async function testStudentSubmissions() {
  console.log('=== Testing Student Submissions Retrieval ===');
  
  const result = await makeRequest(`${API_BASE_URL}/submissions/student/${TEST_STUDENT.accessKey}`);
  
  if (result && result.data.success) {
    console.log(`✅ Retrieved ${result.data.submissions.length} submissions for student`);
  } else {
    console.log('❌ Failed to retrieve student submissions');
    return false;
  }
  
  return true;
}

async function testStudentStatistics() {
  console.log('=== Testing Student Statistics ===');
  
  const result = await makeRequest(`${API_BASE_URL}/statistics/student/${TEST_STUDENT.accessKey}`);
  
  if (result && result.data.success) {
    console.log(`✅ Retrieved student statistics`);
    console.log(`   Total Score: ${result.data.statistics.totalScore}`);
    console.log(`   Completed Exercises: ${result.data.statistics.completedExercises}`);
  } else {
    console.log('❌ Failed to retrieve student statistics');
    return false;
  }
  
  return true;
}

async function testRankings() {
  console.log('=== Testing Rankings ===');
  
  const result = await makeRequest(`${API_BASE_URL}/statistics/rankings`);
  
  if (result && result.data.success) {
    console.log(`✅ Retrieved rankings for ${result.data.totalStudents} students`);
  } else {
    console.log('❌ Failed to retrieve rankings');
    return false;
  }
  
  return true;
}

async function runTests() {
  console.log('🚀 Starting Exercise 1 API Tests\n');
  
  // Test health check
  if (!(await testHealthCheck())) {
    console.log('❌ Tests failed at health check step');
    return;
  }
  
  // Test student registration
  if (!(await testStudentRegistration())) {
    console.log('❌ Tests failed at registration step');
    return;
  }
  
  // Test access key lookup
  if (!(await testAccessKeyLookup())) {
    console.log('❌ Tests failed at access key lookup step');
    return;
  }
  
  // Test exercise 1 submission (without avatar)
  const submissionId1 = await testExercise1Submission();
  if (!submissionId1) {
    console.log('❌ Tests failed at submission step');
    return;
  }
  
  // Test exercise 1 submission (with avatar)
  const submissionId2 = await testExercise1SubmissionWithAvatar();
  if (!submissionId2) {
    console.log('❌ Tests failed at submission with avatar step');
    return;
  }
  
  // Test avatar download
  if (!(await testAvatarDownload(submissionId1))) {
    console.log('❌ Tests failed at avatar download step (submission 1)');
    return;
  }
  
  if (!(await testAvatarDownload(submissionId2))) {
    console.log('❌ Tests failed at avatar download step (submission 2)');
    return;
  }
  
  // Test student submissions retrieval
  if (!(await testStudentSubmissions())) {
    console.log('❌ Tests failed at submissions retrieval step');
    return;
  }
  
  // Test student statistics
  if (!(await testStudentStatistics())) {
    console.log('❌ Tests failed at statistics step');
    return;
  }
  
  // Test rankings
  if (!(await testRankings())) {
    console.log('❌ Tests failed at rankings step');
    return;
  }
  
  console.log('🎉 All tests completed successfully!');
  console.log('\n📋 Test Summary:');
  console.log(`   Student Name: ${TEST_STUDENT.name}`);
  console.log(`   Access Key: ${TEST_STUDENT.accessKey}`);
  console.log(`   Submission 1 ID: ${submissionId1} (no avatar)`);
  console.log(`   Submission 2 ID: ${submissionId2} (with avatar)`);
  console.log('\n✨ The Exercise 1 API is working correctly!');
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };