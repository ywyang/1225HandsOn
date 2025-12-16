#!/usr/bin/env node

/**
 * Simple test script for Hands-on Exercise 1 API
 * This simulates a student's local program calling the submission API
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3000/api';

// Test configuration
const TEST_STUDENT = {
  name: 'Test Student',
  accessKey: null // Will be set after registration
};

const TEST_EC2_INFO = {
  operatingSystem: 'Amazon Linux 2',
  amiId: 'ami-0abcdef1234567890',
  internalIpAddress: '10.0.1.100',
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
  console.log('=== Testing Exercise 1 Submission ===');
  
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
  console.log('🚀 Starting Hands-on Exercise 1 API Tests\n');
  
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
  
  // Test exercise 1 submission
  const submissionId = await testExercise1Submission();
  if (!submissionId) {
    console.log('❌ Tests failed at submission step');
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
  console.log(`   Submission ID: ${submissionId}`);
  console.log('\n✨ The Hands-on Exercise 1 API is working correctly!');
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };