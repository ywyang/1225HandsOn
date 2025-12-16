#!/usr/bin/env node

/**
 * Test SQL API endpoints
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3000/api';

async function testSqlAPI() {
  console.log('🧪 Testing SQL API endpoints...\n');

  try {
    // Test 1: Get database schema
    console.log('1️⃣ Testing GET /api/sql/schema');
    const schemaResponse = await fetch(`${API_BASE_URL}/sql/schema`);
    console.log(`Status: ${schemaResponse.status}`);
    
    if (schemaResponse.ok) {
      const schemaData = await schemaResponse.json();
      console.log(`✅ Schema loaded: ${schemaData.data.totalTables} tables found`);
      console.log(`Tables: ${schemaData.data.tables.map(t => t.name).join(', ')}`);
    } else {
      console.log('❌ Schema request failed');
    }
    console.log('');

    // Test 2: Get sample queries
    console.log('2️⃣ Testing GET /api/sql/samples');
    const samplesResponse = await fetch(`${API_BASE_URL}/sql/samples`);
    console.log(`Status: ${samplesResponse.status}`);
    
    if (samplesResponse.ok) {
      const samplesData = await samplesResponse.json();
      console.log(`✅ Sample queries loaded: ${samplesData.data.length} queries`);
      samplesData.data.forEach((query, index) => {
        console.log(`   ${index + 1}. ${query.name}`);
      });
    } else {
      console.log('❌ Samples request failed');
    }
    console.log('');

    // Test 3: Execute a simple SELECT query
    console.log('3️⃣ Testing POST /api/sql/execute');
    const queryData = {
      query: 'SELECT COUNT(*) as total_students FROM students;'
    };
    
    const executeResponse = await fetch(`${API_BASE_URL}/sql/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryData)
    });
    
    console.log(`Status: ${executeResponse.status}`);
    
    if (executeResponse.ok) {
      const executeData = await executeResponse.json();
      console.log(`✅ Query executed successfully`);
      console.log(`   Execution time: ${executeData.data.executionTime}`);
      console.log(`   Rows returned: ${executeData.data.rowCount}`);
      console.log(`   Result: ${JSON.stringify(executeData.data.rows[0])}`);
    } else {
      const errorData = await executeResponse.json();
      console.log(`❌ Query execution failed: ${errorData.message}`);
    }
    console.log('');

    // Test 4: Test security - try a forbidden operation
    console.log('4️⃣ Testing security (should fail)');
    const forbiddenQuery = {
      query: 'DROP TABLE students;'
    };
    
    const forbiddenResponse = await fetch(`${API_BASE_URL}/sql/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(forbiddenQuery)
    });
    
    console.log(`Status: ${forbiddenResponse.status}`);
    
    if (forbiddenResponse.status === 403) {
      const errorData = await forbiddenResponse.json();
      console.log(`✅ Security working: ${errorData.message}`);
    } else {
      console.log('❌ Security check failed - dangerous query was allowed!');
    }
    console.log('');

    // Test 5: Test a more complex query
    console.log('5️⃣ Testing complex query');
    const complexQuery = {
      query: `
        SELECT 
          s.name as student_name,
          COUNT(sub.id) as total_submissions,
          COALESCE(MAX(sub.score), 0) as highest_score
        FROM students s
        LEFT JOIN submissions sub ON s.id = sub.student_id
        GROUP BY s.id, s.name
        ORDER BY highest_score DESC
        LIMIT 5;
      `
    };
    
    const complexResponse = await fetch(`${API_BASE_URL}/sql/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(complexQuery)
    });
    
    console.log(`Status: ${complexResponse.status}`);
    
    if (complexResponse.ok) {
      const complexData = await complexResponse.json();
      console.log(`✅ Complex query executed successfully`);
      console.log(`   Execution time: ${complexData.data.executionTime}`);
      console.log(`   Rows returned: ${complexData.data.rowCount}`);
      if (complexData.data.rows.length > 0) {
        console.log(`   Top student: ${complexData.data.rows[0].student_name} (Score: ${complexData.data.rows[0].highest_score})`);
      }
    } else {
      const errorData = await complexResponse.json();
      console.log(`❌ Complex query failed: ${errorData.message}`);
    }

    console.log('\n🎉 SQL API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSqlAPI();