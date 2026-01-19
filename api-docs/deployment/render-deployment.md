# Render Deployment Guide

## Overview

This guide covers deploying the AASTU Facilities Management System API to Render, a modern cloud platform that provides easy deployment for Node.js applications. Render offers free tier hosting perfect for development and testing, with easy scaling options for production.

## Prerequisites

- GitHub repository with your AASTU FMS backend code
- Render account (free at [render.com](https://render.com))
- PostgreSQL database (can be created on Render)
- Basic understanding of environment variables

## Step-by-Step Deployment

### 1. Prepare Your Repository

#### Create render.yaml (Optional but Recommended)
Create a `render.yaml` file in your project root for infrastructure as code:

```yaml
services:
  - type: web
    name: aastu-fms-api
    env: node
    plan: free  # or starter/standard for production
    buildCommand: npm install && npx prisma generate
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        fromDatabase:
          name: aastu-fms-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
    healthCheckPath: /health

databases:
  - name: aastu-fms-db
    databaseName: aastu_fms
    user: aastu_fms_user
    plan: free  # or starter for production
```

#### Update package.json Scripts
Ensure your `package.json` has the correct scripts:

```json
{
  "scripts": {
    "start": "node src/app.js",
    "build": "npx prisma generate",
    "postinstall": "npx prisma generate",
    "deploy": "npx prisma migrate deploy && npm run seed",
    "seed": "node prisma/seed.js"
  }
}
```

#### Create Procfile (Alternative)
If not using render.yaml, create a `Procfile`:

```
web: npm start
```

### 2. Database Setup on Render

#### Option A: Using Render PostgreSQL (Recommended)

1. **Log into Render Dashboard**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "PostgreSQL"

2. **Configure Database**
   ```
   Name: aastu-fms-db
   Database: aastu_fms
   User: aastu_fms_user
   Region: Oregon (US West) or closest to your users
   Plan: Free (for development) or Starter ($7/month for production)
   ```

3. **Get Connection Details**
   After creation, note down:
   - **Internal Database URL**: For connecting from your Render service
   - **External Database URL**: For local development and migrations

#### Option B: External Database Provider

You can also use:
- **Supabase** (free PostgreSQL with 500MB)
- **ElephantSQL** (free 20MB PostgreSQL)
- **Neon** (free PostgreSQL with branching)

### 3. Web Service Deployment

#### Method A: Using Render Dashboard

1. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your AASTU FMS backend

2. **Configure Service**
   ```
   Name: aastu-fms-api
   Environment: Node
   Region: Oregon (US West)
   Branch: main (or your deployment branch)
   Build Command: npm install && npx prisma generate
   Start Command: npm start
   Plan: Free (for development)
   ```

3. **Advanced Settings**
   ```
   Auto-Deploy: Yes
   Health Check Path: /health
   ```

#### Method B: Using render.yaml (Recommended)

1. **Commit render.yaml** to your repository
2. **Import from render.yaml**
   - In Render dashboard, click "New +" → "Blueprint"
   - Connect repository and select render.yaml
   - Review and create services

### 4. Environment Variables Configuration

Set these environment variables in your Render service:

#### Required Variables
```bash
# Server Configuration
NODE_ENV=production
PORT=10000
HOST=0.0.0.0

# Database (automatically set if using Render PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database

# JWT Configuration (use Render's secret generator)
JWT_SECRET=your_generated_jwt_secret_here
JWT_REFRESH_SECRET=your_generated_refresh_secret_here
JWT_EXPIRES_IN=3600
JWT_REFRESH_EXPIRES_IN=604800

# Email Configuration (use your SMTP provider)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload Configuration
UPLOAD_MAX_SIZE=5242880
UPLOAD_MAX_FILES=3
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# CORS Configuration (set to your frontend domain)
CORS_ORIGIN=https://your-frontend-app.onrender.com
CORS_CREDENTIALS=true

# Notification Configuration
NOTIFICATION_FROM_EMAIL=noreply@aastu.edu.et
NOTIFICATION_FROM_NAME=AASTU Facilities Management
```

#### Setting Variables in Render Dashboard
1. Go to your service → "Environment"
2. Add each variable with its value
3. Use "Generate" for JWT secrets
4. Save changes (triggers automatic redeploy)

### 5. Database Migration and Seeding

#### Option A: Using Deploy Hook (Recommended)
Add a deploy hook in your service settings:

```bash
npx prisma migrate deploy && npm run seed
```

#### Option B: Manual Migration
1. **Connect to your service shell**:
   ```bash
   # In Render dashboard, go to service → Shell
   npx prisma migrate deploy
   npm run seed
   ```

#### Option C: Local Migration to Remote DB
```bash
# Set DATABASE_URL to your Render database external URL
export DATABASE_URL="postgresql://username:password@host:port/database"
npx prisma migrate deploy
npm run seed
```

### 6. Custom Domain Setup (Optional)

#### Using Render Custom Domain
1. Go to service → "Settings" → "Custom Domains"
2. Add your domain: `api-fms.aastu.edu.et`
3. Configure DNS records as instructed
4. SSL certificate is automatically provisioned

#### DNS Configuration
Add these records to your domain:
```
Type: CNAME
Name: api-fms
Value: your-service-name.onrender.com
```

### 7. File Storage Configuration

#### Option A: Local Storage (Free Tier)
```javascript
// In your upload configuration
const uploadPath = process.env.NODE_ENV === 'production' 
  ? '/opt/render/project/src/uploads' 
  : './uploads';
```

**Note**: Files are ephemeral on Render free tier and will be lost on redeploys.

#### Option B: Cloud Storage (Recommended for Production)
Use cloud storage services:

**Cloudinary Integration**:
```bash
# Add to environment variables
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**AWS S3 Integration**:
```bash
# Add to environment variables
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=aastu-fms-uploads
```

### 8. Monitoring and Logging

#### Built-in Monitoring
Render provides:
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Health Checks**: Automatic monitoring of `/health` endpoint
- **Alerts**: Email notifications for service issues

#### Custom Monitoring
Add monitoring endpoints:

```javascript
// Add to your app.js
app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});
```

### 9. Production Optimizations

#### Performance Settings
```bash
# Add to environment variables
NODE_OPTIONS=--max-old-space-size=512
WEB_CONCURRENCY=1
```

#### Database Connection Pooling
```javascript
// In your database configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pooling for production
  __internal: {
    engine: {
      connectionLimit: 10,
    },
  },
});
```

### 10. Deployment Workflow

#### Automatic Deployment
1. **Push to GitHub**: Any push to your main branch triggers deployment
2. **Build Process**: Render runs `npm install && npx prisma generate`
3. **Health Check**: Render checks `/health` endpoint
4. **Live**: Service becomes available at your Render URL

#### Manual Deployment
1. Go to service dashboard
2. Click "Manual Deploy" → "Deploy latest commit"
3. Monitor build logs for any issues

### 11. Frontend Integration

#### API Base URL
Your frontend team should use:
```javascript
// For production
const API_BASE_URL = 'https://your-service-name.onrender.com';

// Or with custom domain
const API_BASE_URL = 'https://api-fms.aastu.edu.et';
```

#### CORS Configuration
Ensure your frontend domain is added to CORS_ORIGIN:
```bash
# Single domain
CORS_ORIGIN=https://aastu-fms-frontend.onrender.com

# Multiple domains (comma-separated)
CORS_ORIGIN=https://aastu-fms-frontend.onrender.com,https://localhost:3000
```

#### Example Frontend Configuration
```javascript
// Frontend API client configuration
const apiClient = axios.create({
  baseURL: 'https://your-api-service.onrender.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // If using cookies
});

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 12. Troubleshooting

#### Common Issues

**Build Failures**:
```bash
# Check build logs in Render dashboard
# Common fixes:
npm install --production=false  # If dev dependencies needed
npx prisma generate  # Ensure Prisma client is generated
```

**Database Connection Issues**:
```bash
# Verify DATABASE_URL format
postgresql://username:password@host:port/database

# Check database status in Render dashboard
# Ensure database is in same region as web service
```

**Environment Variable Issues**:
```bash
# Check all required variables are set
# Use Render's secret generator for JWT secrets
# Verify CORS_ORIGIN matches your frontend domain
```

**File Upload Issues**:
```bash
# For production, use cloud storage
# Local storage is ephemeral on Render
# Check upload directory permissions
```

#### Health Check Failures
Ensure your health endpoint returns proper status:
```javascript
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### 13. Cost Optimization

#### Free Tier Limitations
- **Web Service**: 750 hours/month (sleeps after 15 min inactivity)
- **Database**: 1GB storage, 1 month retention
- **Bandwidth**: 100GB/month
- **Build Minutes**: 500 minutes/month

#### Upgrading for Production
- **Starter Plan** ($7/month): Always-on, custom domains, more resources
- **Standard Plan** ($25/month): Horizontal scaling, advanced metrics
- **Database Plans**: Start at $7/month for persistent storage

### 14. Security Best Practices

#### Environment Security
```bash
# Never commit secrets to repository
# Use Render's secret generator for sensitive values
# Rotate secrets regularly
# Use different secrets for different environments
```

#### Network Security
```bash
# Enable HTTPS only (automatic on Render)
# Configure proper CORS origins
# Use rate limiting
# Validate all inputs
```

### 15. Backup and Recovery

#### Database Backups
```bash
# Render PostgreSQL includes automatic backups
# For additional backups, use pg_dump:
pg_dump $DATABASE_URL > backup.sql

# Restore from backup:
psql $DATABASE_URL < backup.sql
```

#### Code Backups
- Code is backed up in your GitHub repository
- Render maintains deployment history
- Use GitHub releases for version tagging

## Quick Start Checklist

- [ ] Repository prepared with correct package.json scripts
- [ ] render.yaml created (optional but recommended)
- [ ] Render account created
- [ ] PostgreSQL database created on Render
- [ ] Web service created and connected to repository
- [ ] Environment variables configured
- [ ] Database migrated and seeded
- [ ] Health check endpoint working
- [ ] CORS configured for frontend domain
- [ ] Custom domain configured (if needed)
- [ ] Frontend team provided with API URL

## Support Resources

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Render Community**: [community.render.com](https://community.render.com)
- **Render Status**: [status.render.com](https://status.render.com)
- **Support**: Available through Render dashboard

Your AASTU FMS API will be accessible at:
- **Default URL**: `https://your-service-name.onrender.com`
- **Custom Domain**: `https://api-fms.aastu.edu.et` (if configured)
- **Health Check**: `https://your-service-name.onrender.com/health`
- **API Documentation**: `https://your-service-name.onrender.com/api-docs` (if served)