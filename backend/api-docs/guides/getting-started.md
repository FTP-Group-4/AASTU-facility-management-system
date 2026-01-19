# Getting Started with AASTU FMS API

## Quick Start Guide

This guide will help you get started with the AASTU Facilities Management System API in just a few minutes.

## Prerequisites

- Basic understanding of REST APIs
- HTTP client (Postman, curl, or your preferred tool)
- Valid AASTU email credentials for testing

## Base URL

All API endpoints are relative to:
```
https://api-fms.aastu.edu.et/v1
```

## Authentication Flow

### 1. Login and Get Token

```bash
curl -X POST https://api-fms.aastu.edu.et/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@aastu.edu.et",
    "password": "your-password",
    "device_id": "web-client-001"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": "USR-2024-00123",
      "email": "your-email@aastu.edu.et",
      "role": "reporter",
      "full_name": "Your Name"
    }
  }
}
```

### 2. Use Token in Requests

Include the access token in the Authorization header:
```bash
curl -X GET https://api-fms.aastu.edu.et/v1/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Common API Patterns

### Standard Response Format

All API responses follow this format:
```json
{
  "success": boolean,
  "data": object | array | null,
  "message": string,
  "error_code": string | null,
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### Error Responses

```json
{
  "success": false,
  "data": null,
  "message": "Invalid credentials",
  "error_code": "AUTH_001",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

## Basic Workflows

### 1. Submit a Report (Reporter Role)

```bash
# Submit a new maintenance report
curl -X POST https://api-fms.aastu.edu.et/v1/reports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "electrical",
    "location": {
      "type": "specific",
      "block_id": 57,
      "room_number": "201"
    },
    "equipment_description": "Projector in classroom 201",
    "problem_description": "Projector won't turn on. No power light when button pressed.",
    "photos": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."]
  }'
```

### 2. Get My Reports

```bash
# Get all reports submitted by current user
curl -X GET "https://api-fms.aastu.edu.et/v1/reports/my?status=submitted&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Check Notifications

```bash
# Get unread notifications
curl -X GET "https://api-fms.aastu.edu.et/v1/notifications?unread_only=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Role-Specific Examples

### Reporter Actions
- Submit reports: `POST /reports`
- Track reports: `GET /reports/my`
- Rate completed work: `POST /reports/{id}/rate`
- View notifications: `GET /notifications`

### Coordinator Actions
- View dashboard: `GET /coordinator/dashboard`
- Review reports: `POST /coordinator/reports/{id}/review`
- Get assigned reports: `GET /coordinator/reports`

### Fixer Actions
- View job queue: `GET /fixer/dashboard`
- Update job status: `POST /fixer/jobs/{id}/status`
- Get priority queue: `GET /fixer/queue`

### Admin Actions
- System dashboard: `GET /admin/dashboard`
- Manage users: `POST /admin/users`
- Generate reports: `POST /admin/reports/generate`

## Testing with Postman

1. **Import Collection**: Download and import [AASTU-FMS.postman_collection.json](../postman/AASTU-FMS.postman_collection.json)
2. **Set Environment**: Import [AASTU-FMS.postman_environment.json](../postman/AASTU-FMS.postman_environment.json)
3. **Configure Variables**:
   - `base_url`: `https://api-fms.aastu.edu.et/v1`
   - `email`: Your AASTU email
   - `password`: Your password
4. **Run Authentication**: Execute the login request to get tokens
5. **Test Endpoints**: All other requests will use the stored token automatically

## Rate Limiting

The API implements rate limiting:
- **General endpoints**: 100 requests/minute per user
- **Report submission**: 10 requests/minute per user
- **Admin endpoints**: 50 requests/minute per user

When rate limited, you'll receive a `429 Too Many Requests` response.

## Error Handling

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate report)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Next Steps

1. **Explore Endpoints**: Check the [endpoints documentation](../endpoints/) for detailed API reference
2. **Understand Data Models**: Review [schemas](../schemas/) for request/response formats
3. **Handle Errors**: Read the [error handling guide](error-handling.md)
4. **Production Setup**: Follow the [deployment guide](../deployment/setup.md)

## Support

- **API Reference**: [OpenAPI Specification](../openapi/openapi.yaml)
- **Interactive Testing**: [Swagger UI](../openapi/swagger-ui.html)
- **Error Codes**: [Error Handling Guide](error-handling.md)
- **Authentication**: [Authentication Guide](authentication.md)