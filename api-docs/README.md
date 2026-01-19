# AASTU Facilities Management System - API Documentation

## Overview

This directory contains comprehensive API documentation for the AASTU Facilities Management System backend. The documentation is organized into multiple formats to serve different needs:

## Documentation Structure

```
api-docs/
├── README.md                    # This file - overview and navigation
├── openapi/                     # OpenAPI/Swagger specifications
│   ├── openapi.yaml            # Complete OpenAPI 3.0 specification
│   └── swagger-ui.html         # Interactive Swagger UI
├── postman/                     # Postman collections
│   ├── AASTU-FMS.postman_collection.json
│   └── AASTU-FMS.postman_environment.json
├── endpoints/                   # Detailed endpoint documentation
│   ├── authentication.md       # Auth endpoints
│   ├── users.md                # User management
│   ├── reports.md              # Report management
│   ├── coordinator.md          # Coordinator endpoints
│   ├── fixer.md                # Fixer endpoints
│   ├── admin.md                # Admin endpoints
│   ├── notifications.md        # Notification system
│   ├── analytics.md            # Analytics endpoints
│   └── uploads.md              # File upload system
├── guides/                      # Integration guides
│   ├── getting-started.md      # Quick start guide
│   ├── authentication.md       # Auth implementation guide
│   ├── error-handling.md       # Error handling patterns
│   └── rate-limiting.md        # Rate limiting guide
├── schemas/                     # Data models and schemas
│   ├── user.md                 # User data models
│   ├── report.md               # Report data models
│   ├── notification.md         # Notification models
│   └── common.md               # Common response formats
└── deployment/                  # Deployment documentation
    ├── setup.md                # Server setup guide
    ├── render-deployment.md    # Render cloud deployment guide
    ├── environment.md          # Environment configuration
    └── monitoring.md           # Monitoring and logging
```

## Quick Links

### For Frontend Developers
- [Getting Started Guide](guides/getting-started.md) - Start here for quick integration
- [Authentication Guide](guides/authentication.md) - JWT token implementation
- [Interactive API Explorer](openapi/swagger-ui.html) - Test endpoints directly
- [Postman Collection](postman/AASTU-FMS.postman_collection.json) - Import for testing

### For Backend Developers
- [OpenAPI Specification](openapi/openapi.yaml) - Complete API specification
- [Error Handling](guides/error-handling.md) - Error response patterns
- [Data Models](schemas/) - Request/response schemas

### For DevOps/Deployment
- [Server Setup Guide](deployment/setup.md) - Complete production server configuration
- [Render Deployment](deployment/render-deployment.md) - Easy cloud deployment for frontend teams
- [Environment Variables](deployment/environment.md) - Configuration reference
- [Monitoring](deployment/monitoring.md) - Logging and metrics

## API Base Information

- **Base URL**: `https://api-fms.aastu.edu.et/v1`
- **Authentication**: JWT Bearer tokens
- **Content Type**: `application/json`
- **Rate Limiting**: 100 requests/minute per user
- **API Version**: v1.0.0

## Key Features

### Authentication System
- JWT-based authentication with refresh tokens
- Role-based access control (Reporter, Coordinator, Fixer, Admin)
- AASTU email domain validation

### Report Management
- Complete report lifecycle (Submit → Review → Assign → Fix → Rate)
- Photo upload support (up to 3 photos per report)
- Duplicate detection system
- Priority-based workflow routing

### User Roles & Permissions
- **Reporter**: Submit and track reports
- **Coordinator**: Review and approve reports for assigned blocks
- **Fixer**: Handle assigned maintenance tasks
- **Admin**: System configuration and user management

### Real-time Features
- Notification system with priority-based delivery
- SLA monitoring and alerts
- Real-time status updates

## Getting Started

1. **Authentication**: Start with the [Authentication Guide](guides/authentication.md)
2. **Test Endpoints**: Use the [Postman Collection](postman/AASTU-FMS.postman_collection.json)
3. **Explore API**: Browse the [Interactive Documentation](openapi/swagger-ui.html)
4. **Integration**: Follow the [Getting Started Guide](guides/getting-started.md)

## Support

For technical support or questions about the API:
- Review the documentation in this directory
- Check the error handling guide for common issues
- Refer to the OpenAPI specification for detailed endpoint information

## Version History

- **v1.0.0** (January 2026) - Initial release with complete feature set
  - Authentication system
  - Report management workflow
  - User role management
  - Notification system
  - Analytics and reporting
  - File upload system