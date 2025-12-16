import { 
  mapAdministratorRow,
  mapStudentRow,
  mapExerciseRow,
  mapSubmissionRow,
  generateAccessKey,
  validateEmail,
  validateAccessKey,
  validateUUID,
  validateIPAddress,
  DatabaseError,
  NotFoundError,
  DuplicateError,
  ValidationError
} from '../database/utils.js';

describe('Data Models and Utilities', () => {
  describe('Model Mapping Functions', () => {
    test('mapAdministratorRow should correctly map database row to model', () => {
      const row = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'admin',
        password_hash: '$2a$10$hashedpassword',
        email: 'admin@example.com',
        created_at: new Date('2023-01-01T00:00:00Z'),
        last_login_at: new Date('2023-01-02T00:00:00Z')
      };

      const admin = mapAdministratorRow(row);

      expect(admin.id).toBe(row.id);
      expect(admin.username).toBe(row.username);
      expect(admin.passwordHash).toBe(row.password_hash);
      expect(admin.email).toBe(row.email);
      expect(admin.createdAt).toBe(row.created_at);
      expect(admin.lastLoginAt).toBe(row.last_login_at);
    });

    test('mapStudentRow should correctly map database row to model', () => {
      const row = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'John Doe',
        access_key: 'ABC12345',
        registered_at: new Date('2023-01-01T00:00:00Z'),
        last_active_at: new Date('2023-01-02T00:00:00Z')
      };

      const student = mapStudentRow(row);

      expect(student.id).toBe(row.id);
      expect(student.name).toBe(row.name);
      expect(student.accessKey).toBe(row.access_key);
      expect(student.registeredAt).toBe(row.registered_at);
      expect(student.lastActiveAt).toBe(row.last_active_at);
    });

    test('mapExerciseRow should correctly map database row to model', () => {
      const row = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        title: 'Test Exercise',
        description: 'A test exercise',
        requirements: 'Complete the task',
        difficulty: 'beginner',
        max_score: 100,
        is_published: true,
        created_by: '123e4567-e89b-12d3-a456-426614174000',
        created_at: new Date('2023-01-01T00:00:00Z'),
        updated_at: new Date('2023-01-02T00:00:00Z')
      };

      const exercise = mapExerciseRow(row);

      expect(exercise.id).toBe(row.id);
      expect(exercise.title).toBe(row.title);
      expect(exercise.description).toBe(row.description);
      expect(exercise.requirements).toBe(row.requirements);
      expect(exercise.difficulty).toBe(row.difficulty);
      expect(exercise.maxScore).toBe(row.max_score);
      expect(exercise.isPublished).toBe(row.is_published);
      expect(exercise.createdBy).toBe(row.created_by);
      expect(exercise.createdAt).toBe(row.created_at);
      expect(exercise.updatedAt).toBe(row.updated_at);
    });

    test('mapSubmissionRow should correctly map database row to model', () => {
      const row = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        student_id: '123e4567-e89b-12d3-a456-426614174001',
        exercise_id: '123e4567-e89b-12d3-a456-426614174002',
        client_ip_address: '192.168.1.100',
        operating_system: 'Ubuntu 20.04',
        ami_id: 'ami-12345678',
        internal_ip_address: '10.0.1.100',
        instance_type: 't2.micro',
        score: 85,
        submitted_at: new Date('2023-01-01T00:00:00Z'),
        processing_status: 'processed'
      };

      const submission = mapSubmissionRow(row);

      expect(submission.id).toBe(row.id);
      expect(submission.studentId).toBe(row.student_id);
      expect(submission.exerciseId).toBe(row.exercise_id);
      expect(submission.clientIpAddress).toBe(row.client_ip_address);
      expect(submission.ec2InstanceInfo.operatingSystem).toBe(row.operating_system);
      expect(submission.ec2InstanceInfo.amiId).toBe(row.ami_id);
      expect(submission.ec2InstanceInfo.internalIpAddress).toBe(row.internal_ip_address);
      expect(submission.ec2InstanceInfo.instanceType).toBe(row.instance_type);
      expect(submission.score).toBe(row.score);
      expect(submission.submittedAt).toBe(row.submitted_at);
      expect(submission.processingStatus).toBe(row.processing_status);
    });
  });

  describe('Utility Functions', () => {
    test('generateAccessKey should generate valid access keys', () => {
      const accessKey = generateAccessKey();
      
      expect(accessKey).toHaveLength(8);
      expect(accessKey).toMatch(/^[A-Z0-9]{8}$/);
    });

    test('generateAccessKey should generate unique keys', () => {
      const keys = new Set();
      for (let i = 0; i < 100; i++) {
        keys.add(generateAccessKey());
      }
      
      // Should have generated 100 unique keys (very high probability)
      expect(keys.size).toBeGreaterThan(90);
    });

    test('validateEmail should validate email addresses correctly', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    test('validateAccessKey should validate access keys correctly', () => {
      expect(validateAccessKey('ABC12345')).toBe(true);
      expect(validateAccessKey('XYZ98765')).toBe(true);
      expect(validateAccessKey('abc12345')).toBe(false); // lowercase not allowed
      expect(validateAccessKey('ABC1234')).toBe(false); // too short
      expect(validateAccessKey('ABC123456')).toBe(false); // too long
      expect(validateAccessKey('ABC1234!')).toBe(false); // special characters not allowed
      expect(validateAccessKey('')).toBe(false);
    });

    test('validateUUID should validate UUIDs correctly', () => {
      expect(validateUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(validateUUID('invalid-uuid')).toBe(false);
      expect(validateUUID('123e4567-e89b-12d3-a456')).toBe(false); // too short
      expect(validateUUID('')).toBe(false);
    });

    test('validateIPAddress should validate IP addresses correctly', () => {
      expect(validateIPAddress('192.168.1.1')).toBe(true);
      expect(validateIPAddress('10.0.0.1')).toBe(true);
      expect(validateIPAddress('255.255.255.255')).toBe(true);
      expect(validateIPAddress('0.0.0.0')).toBe(true);
      expect(validateIPAddress('256.1.1.1')).toBe(false); // invalid octet
      expect(validateIPAddress('192.168.1')).toBe(false); // incomplete
      expect(validateIPAddress('192.168.1.1.1')).toBe(false); // too many octets
      expect(validateIPAddress('invalid-ip')).toBe(false);
      expect(validateIPAddress('')).toBe(false);
    });
  });

  describe('Error Classes', () => {
    test('DatabaseError should be instantiable', () => {
      const error = new DatabaseError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DatabaseError');
      expect(error.message).toBe('Test error');
    });

    test('NotFoundError should be instantiable', () => {
      const error = new NotFoundError('User', '123');
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe('User with id 123 not found');
    });

    test('DuplicateError should be instantiable', () => {
      const error = new DuplicateError('User', 'email', 'test@example.com');
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.name).toBe('DuplicateError');
      expect(error.message).toBe("User with email 'test@example.com' already exists");
    });

    test('ValidationError should be instantiable', () => {
      const error = new ValidationError('Invalid input');
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid input');
    });
  });
});