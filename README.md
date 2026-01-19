# AASTU Facilities Management System - Backend API

A comprehensive backend API system for managing campus maintenance requests at Addis Ababa Science & Technology University.

## Features

- 🔐 JWT-based authentication with role-based access control
- 📝 Maintenance report submission and tracking
- 📸 Photo upload and management
- 🔄 Workflow management for coordinators and fixers
- 📊 Analytics and reporting dashboard
- 🔔 Real-time notifications
- 🛡️ Security features (rate limiting, input validation, audit logging)

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt
- **File Processing**: Sharp for image optimization
- **Testing**: Jest with property-based testing (fast-check)

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── models/          # Prisma schema and types
│   ├── middleware/      # Authentication, validation, logging
│   ├── routes/          # API route definitions
│   ├── utils/           # Helper functions
│   ├── config/          # Configuration files
│   └── app.js           # Express app setup
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # API integration tests
│   └── fixtures/        # Test data
├── uploads/             # File storage directory
└── docs/                # API documentation
```

## Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd aastu-facilities-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
# Create database and run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### Health Check

Visit `http://localhost:3001/health` to verify the API is running.

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - User logout

### User Management
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile

### Reports
- `POST /reports` - Submit maintenance report
- `GET /reports` - Get user's reports
- `GET /reports/:id` - Get specific report
- `POST /reports/:id/rate` - Rate completed work

### Coordinator Dashboard
- `GET /coordinator/dashboard` - Coordinator overview
- `POST /coordinator/reports/:id/review` - Approve/reject reports

### Fixer Dashboard
- `GET /fixer/dashboard` - Fixer job overview
- `GET /fixer/queue` - Priority-sorted job queue
- `POST /fixer/jobs/:id/status` - Update job status

### Admin Functions
- `GET /admin/dashboard` - System overview
- `POST /admin/users` - Create users
- `GET /admin/analytics` - System analytics

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Database Operations

```bash
# Generate Prisma client
npm run db:generate

# Create new migration
npm run db:migrate

# Reset database (development only)
npm run db:reset
```

## User Roles

- **Reporter**: Students and staff who submit maintenance requests
- **Coordinator**: Building managers who review and prioritize reports
- **Electrical Fixer**: Maintenance staff specializing in electrical issues
- **Mechanical Fixer**: Maintenance staff specializing in mechanical issues
- **Admin**: System administrators with full access

## Security Features

- JWT token authentication with refresh mechanism
- Role-based access control (RBAC)
- Rate limiting (100 requests/minute per IP)
- Input validation and sanitization
- Secure file upload with type and size validation
- Audit logging for all system actions
- CORS and security headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.