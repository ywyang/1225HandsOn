#!/usr/bin/env node

import http from 'http';

const checkHealth = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/health', (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Backend health check passed');
          console.log('Response:', JSON.parse(data));
          resolve(true);
        } else {
          console.log('❌ Backend health check failed');
          console.log('Status:', res.statusCode);
          reject(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Backend health check failed');
      console.log('Error:', err.message);
      reject(false);
    });

    req.setTimeout(5000, () => {
      console.log('❌ Backend health check timed out');
      req.destroy();
      reject(false);
    });
  });
};

checkHealth().catch(() => process.exit(1));