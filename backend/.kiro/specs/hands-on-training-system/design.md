# Design Document

## Overview

The Hands-on Training System is a cloud-native web application designed to facilitate programming training exercises. The system employs a modern three-tier architecture with a React-based frontend, Node.js/Express backend, and PostgreSQL database, all deployed on AWS infrastructure. The application serves two distinct user roles: administrators who manage exercises and monitor progress, and students who participate in hands-on coding challenges.

## Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React SPA)   │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│   - Admin UI    │    │   - REST API    │    │   - User Data   │
│   - Student UI  │    │   - Auth        │    │   - Exercises   │
│   - Dashboard   │    │   - Business    │    │   - Submissions │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AWS S3        │    │   AWS EC2       │    │   AWS RDS       │
│   Static Assets │    │   Application   │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Deployment Architecture
- **Frontend**: React SPA hosted on AWS S3 with CloudFront CDN
- **Backend**: Node.js application on AWS EC2 behind Application Load Balancer
- **Database**: AWS RDS PostgreSQL with automated backups
- **Security**: VPC with private subnets, security groups, and IAM roles

## Components and Interfaces

### Frontend Components

#### Admin Interface
- **LoginComponent**: Administrator authentication form
- **DashboardComponent**: Overview of system statistics and quick actions
- **ExerciseManagementComponent**: CRUD operations for exercises
- **StatisticsComponent**: Student progress visualization with charts
- **RankingComponent**: Real-time student rankings display

#### Student Interface  
- **StudentLoginComponent**: Name-based registration and access key retrieval
- **ExerciseListComponent**: Display of available exercises
- **ExerciseDetailComponent**: Detailed exercise instructions and requirements
- **ResultsComponent**: Personal progress and score display
- **ProfileComponent**: Student information and access key management

### Backend Services

#### Authentication Service
- JWT token generation and validation
- Role-based access control (admin/student)
- Session management and security

#### Exercise Service
- Exercise CRUD operations
- Exercise publishing/unpublishing
- Exercise metadata management

#### Submission Service
- API endpoint for exercise submissions
- Data validation and processing
- Score calculation and storage

#### Statistics Service
- Real-time ranking calculations
- Progress tracking and analytics
- Performance metrics aggregation

### API Endpoints

#### Authentication Endpoints
- `POST /api/auth/admin/login` - Administrator login
- `POST /api/auth/student/register` - Student registration
- `GET /api/auth/student/lookup/:name` - Access key lookup

#### Exercise Management Endpoints
- `GET /api/exercises` - List exercises (filtered by role)
- `POST /api/exercises` - Create exercise (admin only)
- `PUT /api/exercises/:id` - Update exercise (admin only)
- `DELETE /api/exercises/:id` - Delete exercise (admin only)
- `POST /api/exercises/:id/publish` - Publish exercise (admin only)

#### Submission Endpoints
- `POST /api/submissions` - Submit exercise completion data
- `GET /api/submissions/student/:accessKey` - Get student submissions
- `GET /api/submissions/exercise/:id` - Get exercise submissions (admin only)

#### Statistics Endpoints
- `GET /api/statistics/rankings` - Get student rankings
- `GET /api/statistics/progress` - Get completion statistics
- `GET /api/statistics/student/:accessKey` - Get individual student stats

## Data Models

### User Model
```typescript
interface Administrator {
  id: string;
  username: string;
  passwordHash: string;
  email: string;
  createdAt: Date;
  lastLoginAt: Date;
}

interface Student {
  id: string;
  name: string;
  accessKey: string;
  registeredAt: Date;
  lastActiveAt: Date;
}
```

### Exercise Model
```typescript
interface Exercise {
  id: string;
  title: string;
  description: string;
  requirements: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  maxScore: number;
  isPublished: boolean;
  createdBy: string; // Administrator ID
  createdAt: Date;
  updatedAt: Date;
}
```

### Submission Model
```typescript
interface Submission {
  id: string;
  studentId: string;
  exerciseId: string;
  clientIpAddress: string;
  ec2InstanceInfo: {
    operatingSystem: string;
    amiId: string;
    internalIpAddress: string;
    instanceType: string;
  };
  score: number;
  submittedAt: Date;
  processingStatus: 'pending' | 'processed' | 'failed';
}
```

### Statistics Model
```typescript
interface StudentRanking {
  studentId: string;
  studentName: string;
  totalScore: number;
  completedExercises: number;
  averageCompletionTime: number;
  rank: number;
}

interface ExerciseStatistics {
  exerciseId: string;
  exerciseTitle: string;
  totalSubmissions: number;
  averageScore: number;
  completionRate: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication validation
*For any* administrator credentials, the authentication system should accept valid credentials and reject invalid ones, with appropriate session management
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Exercise CRUD operations
*For any* valid exercise data, creating and updating exercises should result in proper storage and availability according to publication status
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 3: Ranking calculation consistency
*For any* set of student submissions, rankings should be ordered by score first, then by completion time, with consistent tie-breaking rules
**Validates: Requirements 3.1, 3.2, 3.4**

### Property 4: Statistics data completeness
*For any* statistics request, all required student progress information including timestamps and scores should be included in the response
**Validates: Requirements 3.3**

### Property 5: Access key uniqueness and consistency
*For any* student registration, access keys should be unique across all students and consistent for repeated registrations of the same name
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 6: Student lookup functionality
*For any* name query, the system should return the correct access key for registered names and appropriate error messages for unregistered names
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 7: Exercise visibility control
*For any* exercise publication status, only published exercises should be visible to students while maintaining complete information display
**Validates: Requirements 6.1, 6.2**

### Property 8: Student results accuracy
*For any* student with multiple submissions, the results should show the best score achieved with proper timestamps and ranking information
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 9: API submission processing
*For any* submission request, valid data should be accepted and processed while invalid data should be rejected with appropriate error messages
**Validates: Requirements 8.1, 8.4, 8.5**

### Property 10: Submission data completeness
*For any* valid submission, all required fields including student information, client IP, and EC2 instance details should be captured and stored
**Validates: Requirements 8.2, 8.3**

## Error Handling

### Authentication Errors
- Invalid credentials return standardized error responses
- Session expiration triggers automatic logout with clear messaging
- Rate limiting prevents brute force attacks on login endpoints

### Data Validation Errors
- Malformed API requests return detailed validation error messages
- Missing required fields are clearly identified in error responses
- Invalid data types are rejected with appropriate HTTP status codes

### System Errors
- Database connection failures are handled gracefully with retry logic
- AWS service outages trigger fallback mechanisms where possible
- Unhandled exceptions are logged and return generic error messages to users

### Business Logic Errors
- Duplicate student registrations are handled by returning existing access keys
- Attempts to access unpublished exercises return appropriate authorization errors
- Invalid exercise operations (e.g., deleting exercises with submissions) are prevented

## Testing Strategy

### Dual Testing Approach
The system will employ both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties that should hold across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Unit Testing Requirements
Unit tests will cover:
- Specific authentication scenarios with known credentials
- Exercise CRUD operations with predefined data sets
- API endpoint responses for known input/output pairs
- Integration points between frontend and backend components
- Error handling for specific failure scenarios

### Property-Based Testing Requirements
- **Testing Library**: fast-check for JavaScript/TypeScript property-based testing
- **Test Configuration**: Minimum 100 iterations per property test to ensure thorough random testing
- **Property Tagging**: Each property-based test must include a comment with the format: `**Feature: hands-on-training-system, Property {number}: {property_text}**`
- **Property Implementation**: Each correctness property must be implemented by a single property-based test
- **Test Coverage**: All 10 correctness properties must have corresponding property-based tests

### Integration Testing
- End-to-end API testing for complete user workflows
- Database integration testing with test data sets
- AWS service integration testing in staging environment
- Cross-browser compatibility testing for frontend components

### Performance Testing
- Load testing for concurrent user scenarios
- API response time validation under normal and peak loads
- Database query performance optimization validation
- AWS resource utilization monitoring during testing