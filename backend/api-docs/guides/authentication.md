# Authentication Guide

## Overview

The AASTU FMS API uses JWT (JSON Web Token) based authentication with refresh tokens for secure access. All protected endpoints require a valid access token.

## Authentication Flow

### 1. Login Process

**Endpoint**: `POST /auth/login`

**Request:**
```json
{
  "email": "user@aastu.edu.et",
  "password": "your-password",
  "device_id": "optional-device-identifier"
}
```

**Success Response:**
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
      "email": "user@aastu.edu.et",
      "role": "reporter",
      "full_name": "John Doe",
      "permissions": ["report:create", "report:view_own"]
    }
  }
}
```

### 2. Using Access Tokens

Include the access token in the `Authorization` header:

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Example Request:**
```bash
curl -X GET https://api-fms.aastu.edu.et/v1/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Token Refresh

When an access token expires (after 1 hour), use the refresh token to get a new one.

**Endpoint**: `POST /auth/refresh`

**Request Headers:**
```http
Authorization: Bearer YOUR_REFRESH_TOKEN
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "new_access_token_here",
    "refresh_token": "new_refresh_token_here",
    "token_type": "bearer",
    "expires_in": 3600
  }
}
```

### 4. Logout

**Endpoint**: `POST /auth/logout`

**Request Headers:**
```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

This invalidates both access and refresh tokens.

## Email Validation

The API only accepts AASTU email addresses:
- `@aastu.edu.et` (staff)
- `@aastustudent.edu.et` (students)

## User Roles and Permissions

### Reporter (Student/Staff)
- Submit maintenance reports
- View own reports
- Rate completed work
- Receive notifications

**Permissions:**
- `report:create`
- `report:view_own`
- `report:rate`
- `notification:view_own`

### Coordinator (Building Manager/Proctor)
- Review and approve reports for assigned blocks
- Assign priorities
- View building statistics
- Submit reports (auto-approved)

**Permissions:**
- `report:review`
- `report:approve`
- `report:assign_priority`
- `report:view_assigned`
- `dashboard:coordinator`

### Electrical Fixer
- View assigned electrical jobs
- Update job status
- Complete electrical repairs

**Permissions:**
- `job:view_electrical`
- `job:update_status`
- `job:complete`
- `dashboard:fixer`

### Mechanical Fixer
- View assigned mechanical jobs
- Update job status
- Complete mechanical repairs

**Permissions:**
- `job:view_mechanical`
- `job:update_status`
- `job:complete`
- `dashboard:fixer`

### Admin
- Full system access
- User management
- System configuration
- Analytics and reporting

**Permissions:**
- `*` (all permissions)

## Token Security

### Access Token
- **Lifetime**: 1 hour
- **Purpose**: API access
- **Storage**: Memory/session storage (not localStorage)
- **Transmission**: Authorization header only

### Refresh Token
- **Lifetime**: 7 days
- **Purpose**: Renew access tokens
- **Storage**: Secure HTTP-only cookie (recommended)
- **Transmission**: Authorization header for refresh endpoint

## Implementation Examples

### JavaScript/Frontend

```javascript
class AuthService {
  constructor() {
    this.baseURL = 'https://api-fms.aastu.edu.et/v1';
    this.accessToken = null;
    this.refreshToken = null;
  }

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        device_id: 'web-client-' + Date.now()
      })
    });

    const data = await response.json();
    
    if (data.success) {
      this.accessToken = data.data.access_token;
      this.refreshToken = data.data.refresh_token;
      
      // Store refresh token securely
      localStorage.setItem('refresh_token', this.refreshToken);
      
      return data.data.user;
    } else {
      throw new Error(data.message);
    }
  }

  async makeAuthenticatedRequest(url, options = {}) {
    if (!this.accessToken) {
      await this.refreshAccessToken();
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (response.status === 401) {
      // Token expired, try to refresh
      await this.refreshAccessToken();
      
      // Retry original request
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
    }

    return response;
  }

  async refreshAccessToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshToken}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      this.accessToken = data.data.access_token;
      this.refreshToken = data.data.refresh_token;
      localStorage.setItem('refresh_token', this.refreshToken);
    } else {
      // Refresh failed, redirect to login
      this.logout();
      throw new Error('Session expired');
    }
  }

  async logout() {
    if (this.accessToken) {
      await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
    }

    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('refresh_token');
  }
}
```

### Python/Backend

```python
import requests
import jwt
from datetime import datetime, timedelta

class AAStuFMSClient:
    def __init__(self, base_url="https://api-fms.aastu.edu.et/v1"):
        self.base_url = base_url
        self.access_token = None
        self.refresh_token = None
        self.session = requests.Session()

    def login(self, email, password):
        response = self.session.post(f"{self.base_url}/auth/login", json={
            "email": email,
            "password": password,
            "device_id": "python-client"
        })
        
        data = response.json()
        
        if data["success"]:
            self.access_token = data["data"]["access_token"]
            self.refresh_token = data["data"]["refresh_token"]
            
            # Set default authorization header
            self.session.headers.update({
                "Authorization": f"Bearer {self.access_token}"
            })
            
            return data["data"]["user"]
        else:
            raise Exception(data["message"])

    def refresh_access_token(self):
        if not self.refresh_token:
            raise Exception("No refresh token available")
            
        response = self.session.post(f"{self.base_url}/auth/refresh", 
                                   headers={"Authorization": f"Bearer {self.refresh_token}"})
        
        data = response.json()
        
        if data["success"]:
            self.access_token = data["data"]["access_token"]
            self.refresh_token = data["data"]["refresh_token"]
            
            # Update session header
            self.session.headers.update({
                "Authorization": f"Bearer {self.access_token}"
            })
        else:
            raise Exception("Token refresh failed")

    def make_request(self, method, endpoint, **kwargs):
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)
        
        if response.status_code == 401:
            # Try to refresh token
            self.refresh_access_token()
            # Retry request
            response = self.session.request(method, url, **kwargs)
        
        return response.json()
```

## Error Handling

### Authentication Errors

| Error Code | HTTP Status | Description | Action |
|------------|-------------|-------------|---------|
| AUTH_001 | 401 | Invalid credentials | Check email/password |
| AUTH_002 | 401 | Token expired | Refresh token |
| AUTH_003 | 403 | Insufficient permissions | Check user role |

### Common Error Responses

**Invalid Credentials:**
```json
{
  "success": false,
  "data": null,
  "message": "Invalid credentials",
  "error_code": "AUTH_001",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

**Token Expired:**
```json
{
  "success": false,
  "data": null,
  "message": "Access token expired",
  "error_code": "AUTH_002",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

**Insufficient Permissions:**
```json
{
  "success": false,
  "data": null,
  "message": "Insufficient permissions for this action",
  "error_code": "AUTH_003",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

## Security Best Practices

1. **Store tokens securely**:
   - Access tokens: Memory/session storage
   - Refresh tokens: Secure HTTP-only cookies

2. **Handle token expiration**:
   - Implement automatic token refresh
   - Graceful fallback to login

3. **Validate email format**:
   - Only accept AASTU email domains
   - Implement client-side validation

4. **Use HTTPS**:
   - Always use HTTPS in production
   - Never send tokens over HTTP

5. **Implement logout**:
   - Clear all stored tokens
   - Call logout endpoint to invalidate server-side

6. **Monitor for suspicious activity**:
   - Track failed login attempts
   - Implement account lockout if needed