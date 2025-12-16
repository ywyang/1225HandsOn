# Hands-on Training System

A web-based platform for managing programming training exercises with separate interfaces for administrators and students.

## Features

### For Administrators
- Secure login system
- Exercise management (create, edit, publish/unpublish)
- Student progress tracking and statistics
- Real-time ranking system based on scores and completion times

### For Students
- Name-based registration with unique access keys
- Access key lookup functionality
- View available exercises and requirements
- Submit exercise completion data via API
- View personal results and rankings

## Architecture

- **Frontend**: React with TypeScript, Vite, and Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Deployment**: AWS (EC2, RDS, S3, CloudFront)

## Project Structure

```
.
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── database/       # Database schema and migrations
│   │   └── index.js        # Main application entry point
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── App.tsx         # Main React component
│   │   └── main.tsx        # Application entry point
│   └── package.json
├── docs/                   # Documentation
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hands-on-training-system
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run migrate  # Set up database schema
   npm run dev      # Start development server
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev      # Start development server
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb hands_on_training
   
   # Run migrations
   cd backend
   npm run migrate
   ```

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database connection
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Backend server port (default: 3000)

### Default Admin Account

- Username: `admin`
- Password: `admin123`

## API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Administrator login
- `POST /api/auth/student/register` - Student registration
- `GET /api/auth/student/lookup/:name` - Access key lookup

### Exercises
- `GET /api/exercises` - List exercises
- `POST /api/exercises` - Create exercise (admin)
- `PUT /api/exercises/:id` - Update exercise (admin)
- `DELETE /api/exercises/:id` - Delete exercise (admin)

### Submissions
- `POST /api/submissions` - Submit exercise completion
- `GET /api/submissions/student/:accessKey` - Get student submissions

### Statistics
- `GET /api/statistics/rankings` - Get student rankings
- `GET /api/statistics/progress` - Get completion statistics

## Development Commands

### Backend
```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm test         # Run tests
npm run migrate  # Run database migrations
```

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm test         # Run tests
```

## Testing

The project uses Jest for backend testing and Vitest for frontend testing, with property-based testing using fast-check.

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Deployment

The system is designed for AWS deployment:

- **Frontend**: S3 + CloudFront
- **Backend**: EC2 with Application Load Balancer
- **Database**: RDS PostgreSQL
- **Infrastructure**: VPC with proper security groups

## Contributing

1. Follow the existing code style and conventions
2. Write tests for new functionality
3. Update documentation as needed
4. Use meaningful commit messages

## License

MIT License