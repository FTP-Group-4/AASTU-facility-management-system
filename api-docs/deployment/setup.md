# Deployment Setup Guide

## Overview

This guide covers the complete setup and deployment of the AASTU Facilities Management System backend API. The system is built with Node.js, Express, PostgreSQL, and includes comprehensive authentication, file upload, and notification systems.

## Prerequisites

### System Requirements
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Redis**: v6.0 or higher (for caching and sessions)
- **Operating System**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: Minimum 20GB free space
- **Network**: HTTPS-capable domain with SSL certificate

### Required Services
- **Database**: PostgreSQL instance
- **Cache**: Redis instance
- **Email**: SMTP server for notifications
- **Storage**: File system or cloud storage for photo uploads
- **Reverse Proxy**: Nginx or Apache (recommended)

## Installation Steps

### 1. Server Preparation

#### Ubuntu/Debian
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y

# Install Nginx (optional but recommended)
sudo apt install nginx -y

# Install PM2 for process management
sudo npm install -g pm2
```

#### CentOS/RHEL
```bash
# Update system packages
sudo yum update -y

# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PostgreSQL
sudo yum install postgresql-server postgresql-contrib -y
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Install Redis
sudo yum install redis -y
sudo systemctl enable redis
sudo systemctl start redis

# Install Nginx
sudo yum install nginx -y

# Install PM2
sudo npm install -g pm2
```

### 2. Database Setup

#### Create Database and User
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE aastu_fms;
CREATE USER aastu_fms_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE aastu_fms TO aastu_fms_user;

# Exit PostgreSQL
\q
```

#### Configure PostgreSQL
```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf

# Update these settings:
listen_addresses = 'localhost'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB

# Edit pg_hba.conf for authentication
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add this line for local connections:
local   aastu_fms    aastu_fms_user                     md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 3. Application Deployment

#### Clone and Setup Application
```bash
# Create application directory
sudo mkdir -p /opt/aastu-fms
sudo chown $USER:$USER /opt/aastu-fms
cd /opt/aastu-fms

# Clone repository (replace with your repository URL)
git clone https://github.com/your-org/aastu-facility-management-system.git .

# Install dependencies
npm install --production

# Create uploads directory
mkdir -p uploads/photos uploads/thumbnails

# Set proper permissions
chmod 755 uploads
chmod 755 uploads/photos
chmod 755 uploads/thumbnails
```

#### Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Environment Variables (.env):**
```env
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://aastu_fms_user:your_secure_password@localhost:5432/aastu_fms

# JWT Configuration
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_very_long_and_secure_refresh_secret_key_here
JWT_EXPIRES_IN=3600
JWT_REFRESH_EXPIRES_IN=604800

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Email Configuration (SMTP)
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

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com
CORS_CREDENTIALS=true

# Notification Configuration
NOTIFICATION_FROM_EMAIL=noreply@aastu.edu.et
NOTIFICATION_FROM_NAME=AASTU Facilities Management

# SLA Configuration (in hours)
SLA_EMERGENCY=2
SLA_HIGH=24
SLA_MEDIUM=72
SLA_LOW=168
```

#### Database Migration
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial data
npm run seed
```

### 4. Process Management with PM2

#### Create PM2 Ecosystem File
```bash
# Create ecosystem.config.js
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'aastu-fms-api',
    script: 'src/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

#### Start Application
```bash
# Create logs directory
mkdir -p logs

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions provided by the command

# Check application status
pm2 status
pm2 logs aastu-fms-api
```

### 5. Nginx Reverse Proxy Setup

#### Create Nginx Configuration
```bash
# Create site configuration
sudo nano /etc/nginx/sites-available/aastu-fms-api
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name api-fms.aastu.edu.et;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api-fms.aastu.edu.et;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Client Max Body Size (for file uploads)
    client_max_body_size 20M;

    # Proxy Configuration
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static file serving for uploads
    location /uploads/ {
        alias /opt/aastu-fms/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:3000/health;
    }

    # Logging
    access_log /var/log/nginx/aastu-fms-api.access.log;
    error_log /var/log/nginx/aastu-fms-api.error.log;
}
```

#### Enable Site and Restart Nginx
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/aastu-fms-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 6. SSL Certificate Setup

#### Using Let's Encrypt (Recommended)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d api-fms.aastu.edu.et

# Test automatic renewal
sudo certbot renew --dry-run

# Setup automatic renewal cron job
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 7. Monitoring and Logging

#### Setup Log Rotation
```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/aastu-fms
```

**Logrotate Configuration:**
```
/opt/aastu-fms/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reload aastu-fms-api
    endscript
}
```

#### Setup System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Setup basic monitoring script
nano /opt/aastu-fms/scripts/monitor.sh
```

**Monitor Script:**
```bash
#!/bin/bash
# Basic monitoring script

LOG_FILE="/opt/aastu-fms/logs/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check if application is running
if ! pm2 list | grep -q "aastu-fms-api.*online"; then
    echo "[$DATE] ERROR: Application is not running" >> $LOG_FILE
    pm2 restart aastu-fms-api
fi

# Check disk space
DISK_USAGE=$(df /opt/aastu-fms | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "[$DATE] WARNING: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "[$DATE] WARNING: Memory usage is ${MEMORY_USAGE}%" >> $LOG_FILE
fi
```

```bash
# Make script executable
chmod +x /opt/aastu-fms/scripts/monitor.sh

# Add to crontab
crontab -e
# Add this line to run every 5 minutes:
*/5 * * * * /opt/aastu-fms/scripts/monitor.sh
```

### 8. Backup Configuration

#### Database Backup Script
```bash
# Create backup directory
sudo mkdir -p /opt/backups/aastu-fms
sudo chown $USER:$USER /opt/backups/aastu-fms

# Create backup script
nano /opt/aastu-fms/scripts/backup.sh
```

**Backup Script:**
```bash
#!/bin/bash

BACKUP_DIR="/opt/backups/aastu-fms"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="aastu_fms"
DB_USER="aastu_fms_user"

# Database backup
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Application files backup (excluding node_modules and logs)
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='.git' \
    -C /opt/aastu-fms .

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# Make script executable
chmod +x /opt/aastu-fms/scripts/backup.sh

# Add to crontab for daily backups at 2 AM
crontab -e
# Add this line:
0 2 * * * /opt/aastu-fms/scripts/backup.sh >> /opt/aastu-fms/logs/backup.log 2>&1
```

### 9. Security Hardening

#### Firewall Configuration
```bash
# Install and configure UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (adjust port if needed)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL only from localhost
sudo ufw allow from 127.0.0.1 to any port 5432

# Check status
sudo ufw status verbose
```

#### Application Security
```bash
# Set proper file permissions
sudo chown -R $USER:$USER /opt/aastu-fms
sudo chmod -R 755 /opt/aastu-fms
sudo chmod 600 /opt/aastu-fms/.env

# Secure uploads directory
sudo chmod 755 /opt/aastu-fms/uploads
sudo chmod 644 /opt/aastu-fms/uploads/photos/*
```

### 10. Health Checks and Monitoring

#### Application Health Check
The application includes a health check endpoint at `/health` that returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00Z",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected"
}
```

#### Monitoring Commands
```bash
# Check application status
pm2 status
pm2 monit

# Check logs
pm2 logs aastu-fms-api --lines 100

# Check system resources
htop
df -h
free -h

# Check network connections
netstat -tulpn | grep :3000

# Check Nginx status
sudo systemctl status nginx
sudo nginx -t

# Check database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='aastu_fms';"
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
pm2 logs aastu-fms-api

# Check environment variables
cat .env

# Check database connection
npm run test:db

# Restart application
pm2 restart aastu-fms-api
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database connectivity
psql -U aastu_fms_user -h localhost -d aastu_fms -c "SELECT 1;"

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### High Memory Usage
```bash
# Check memory usage by process
ps aux --sort=-%mem | head

# Restart application to clear memory
pm2 restart aastu-fms-api

# Check for memory leaks in logs
pm2 logs aastu-fms-api | grep -i memory
```

#### File Upload Issues
```bash
# Check upload directory permissions
ls -la uploads/

# Check disk space
df -h /opt/aastu-fms

# Check Nginx client_max_body_size
sudo nginx -T | grep client_max_body_size
```

### Performance Optimization

#### Database Optimization
```sql
-- Connect to database
psql -U aastu_fms_user -h localhost -d aastu_fms

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Analyze table statistics
ANALYZE;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename = 'reports';
```

#### Application Optimization
```bash
# Enable Node.js production optimizations
export NODE_ENV=production

# Increase Node.js memory limit if needed
node --max-old-space-size=2048 src/app.js

# Use PM2 cluster mode for better CPU utilization
pm2 start ecosystem.config.js
```

## Maintenance

### Regular Maintenance Tasks

#### Daily
- Check application logs for errors
- Monitor disk space and memory usage
- Verify backup completion

#### Weekly
- Review security logs
- Check for application updates
- Monitor database performance

#### Monthly
- Update system packages
- Review and rotate logs
- Test backup restoration
- Security audit

### Update Procedure
```bash
# 1. Backup current version
/opt/aastu-fms/scripts/backup.sh

# 2. Pull latest changes
cd /opt/aastu-fms
git pull origin main

# 3. Install new dependencies
npm install --production

# 4. Run database migrations
npx prisma migrate deploy

# 5. Restart application
pm2 restart aastu-fms-api

# 6. Verify deployment
curl -f http://localhost:3000/health
```

This completes the comprehensive deployment setup guide for the AASTU Facilities Management System API.