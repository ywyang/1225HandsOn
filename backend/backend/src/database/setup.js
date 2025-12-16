import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'training_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Create tables
const createTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('Creating database tables...');
    
    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Create administrators table
    await client.query(`
      CREATE TABLE IF NOT EXISTS administrators (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP
      )
    `);
    
    // Create students table
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        access_key VARCHAR(50) UNIQUE NOT NULL,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create exercises table
    await client.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        requirements TEXT NOT NULL,
        difficulty VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
        max_score INTEGER DEFAULT 100 CHECK (max_score > 0 AND max_score <= 1000),
        is_published BOOLEAN DEFAULT false,
        created_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create submissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        client_ip_address INET NOT NULL,
        operating_system VARCHAR(100) NOT NULL,
        ami_id VARCHAR(50) NOT NULL,
        internal_ip_address INET NOT NULL,
        instance_type VARCHAR(50) NOT NULL,
        score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 1000),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed'))
      )
    `);
    
    // Create indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_students_name ON students(name)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_students_access_key ON students(access_key)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_submissions_exercise_id ON submissions(exercise_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at)');
    
    console.log('✅ Database tables created successfully');
    
    // Insert default exercise if it doesn't exist
    const exerciseCheck = await client.query("SELECT id FROM exercises WHERE title = 'Hands-on Exercise 1'");
    
    if (exerciseCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO exercises (title, description, requirements, difficulty, max_score, is_published, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'Hands-on Exercise 1',
        'Submit EC2 instance information via API call',
        'Develop a local program that calls the submission API with student information and EC2 instance details including operating system, AMI ID, internal IP address, and instance type.',
        'beginner',
        100,
        true,
        'system'
      ]);
      
      console.log('✅ Default exercise created');
    }
    
    // Insert default admin if it doesn't exist
    const adminCheck = await client.query("SELECT id FROM administrators WHERE username = 'admin'");
    
    if (adminCheck.rows.length === 0) {
      // Default password: admin123 (should be changed in production)
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      await client.query(`
        INSERT INTO administrators (username, password_hash, email)
        VALUES ($1, $2, $3)
      `, ['admin', passwordHash, 'admin@training.local']);
      
      console.log('✅ Default admin user created (username: admin, password: admin123)');
      console.log('⚠️  Please change the default password in production!');
    }
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Main setup function
const setupDatabase = async () => {
  console.log('🚀 Setting up database...');
  
  const connected = await testConnection();
  if (!connected) {
    console.error('Cannot proceed without database connection');
    process.exit(1);
  }
  
  await createTables();
  
  console.log('🎉 Database setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('   1. Start the API server: npm run start');
  console.log('   2. Test the API: npm run test:api');
  console.log('   3. Run student example: npm run example');
  
  await pool.end();
};

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase().catch(console.error);
}

export { setupDatabase, testConnection, pool };