# Database Setup

## Prerequisites
- PostgreSQL 14+ installed and running
- Node.js 18+ with npm

## Quick Setup

1. **Create Database**
   ```bash
   psql -U postgres -h localhost
   CREATE DATABASE aastu_facilities;
   \q
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Update DATABASE_URL in .env with your PostgreSQL credentials
   ```

3. **Initialize Database**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

## Verification
```bash
psql -U postgres -h localhost -d aastu_facilities
\dt  # Should show 11 tables
```

## Sample Users
- Admin: `admin@aastu.edu.et` / `admin123`
- Coordinator: `coordinator@aastu.edu.et` / `coordinator123`
- Electrical Fixer: `electrical.fixer@aastu.edu.et` / `fixer123`
- Mechanical Fixer: `mechanical.fixer@aastu.edu.et` / `fixer123`
- Student: `student@aastustudent.edu.et` / `student123`