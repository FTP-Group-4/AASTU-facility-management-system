# Authentication Endpoints

## Overview

The AASTU FMS API uses JWT (JSON Web Token) based authentication. All protected endpoints require a valid access token in the Authorization header.

## Base URL
```
https://api-fms.aastu.edu.et/v1
```

## Endpoints

### POST /auth/login

Authenticate user with AASTU email and password.

**Access:** Public (no authentication required)

**Request Body:**
```json
{
  "email": "user@aastu.edu.et",
  "password": "password123",
  "device_id": "mobile-12345"  // Optional
}
```

**Success Response (200):**
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
  },
  "message": "Login successful",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

**Error Responses:**

**400 Bad Request - Invalid Email Format:**
```json
{
  "success": false,
  "data": null,
  "message": "Invalid AASTU email format. Please use @aastu.edu.et or @aastustudent.edu.et",
  "error_code": "AUTH_004",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

**401 Unauthorized - Invalid Credentials:**
```json
{
  "success": false,
  "data": null,
  "message": "Invalid credentials",
  "error_code": "AUTH_001",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

**Example Usage:**
```bash
curl -X POST https://api-fms.aastu.edu.et/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@aastustudent.edu.et",
    "password": "mypassword",
    "device_id": "web-client-001"
  }'
```

---

### POST /auth/refresh

Get new access token using refresh token.

**Authentication:** Bearer token (refresh token)

**Headers:**
```
Authorization: Bearer {refresh_token}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "new_access_token_here",
    "refresh_token": "new_refresh_token_here",
    "token_type": "bearer",
    "expires_in": 3600
  },
  "message": "Token refreshed successfully",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

**Error Responses:**

**401 Unauthorized - Invalid Refresh Token:**
```json
{
  "success": false,
  "data": null,
  "message": "Invalid refresh token",
  "error_code": "AUTH_002",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

**Example Usage:**
```bash
curl -X POST https://api-fms.aastu.edu.et/v1/auth/refresh \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
```

---

### POST /auth/logout

Logout user and invalidate both access and refresh tokens.

**Authentication:** Bearer token (access token)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Logout successful",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

**Error Responses:**

**401 Unauthorized - Invalid Token:**
```json
{
  "success": false,
  "data": null,
  "message": "Invalid or expired token",
  "error_code": "AUTH_002",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

**Example Usage:**
```bash
curl -X POST https://api-fms.aastu.edu.et/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Authentication Flow

### 1. Initial Login
1. User provides AASTU email and password
2. API validates credentials
3. API returns access token (1 hour expiry) and refresh token (7 days expiry)
4. Client stores tokens securely

### 2. Making Authenticated Requests
1. Include access token in Authorization header: `Bearer {access_token}`
2. If request returns 401, token may be expired
3. Use refresh token to get new access token
4. Retry original request with new token

### 3. Token Refresh
1. When access token expires, use refresh token
2. Call `/auth/refresh` with refresh token in Authorization header
3. Receive new access and refresh tokens
4. Update stored tokens

### 4. Logout
1. Call `/auth/logout` to invalidate tokens server-side
2. Clear stored tokens client-side

## Email Validation

The API only accepts AASTU email addresses:
- **Staff**: `@aastu.edu.et`
- **Students**: `@aastustudent.edu.et`

## User Roles

After successful login, users are assigned one of these roles:

| Role | Description | Permissions |
|------|-------------|-------------|
| `reporter` | Students and staff who submit reports | Submit reports, view own reports, rate completed work |
| `coordinator` | Building managers/proctors | Review and approve reports for assigned blocks |
| `electrical_fixer` | Electrical maintenance staff | Handle electrical repair jobs |
| `mechanical_fixer` | Mechanical maintenance staff | Handle mechanical repair jobs |
| `admin` | System administrators | Full system access and configuration |

## Security Considerations

### Token Storage
- **Access tokens**: Store in memory or session storage (not localStorage)
- **Refresh tokens**: Store in secure HTTP-only cookies when possible

### Token Expiry
- **Access tokens**: 1 hour (3600 seconds)
- **Refresh tokens**: 7 days (604800 seconds)

### Rate Limiting
Authentication endpoints have specific rate limits:
- Login attempts: 5 per minute per IP
- Token refresh: 10 per minute per user
- General authentication: 20 per minute per user

## Error Codes Reference

| Code | HTTP Status | Description | Action |
|------|-------------|-------------|---------|
| AUTH_001 | 401 | Invalid credentials | Check email/password |
| AUTH_002 | 401 | Token expired/invalid | Refresh token or re-login |
| AUTH_003 | 403 | Insufficient permissions | Check user role |
| AUTH_004 | 400 | Invalid email format | Use AASTU email |
| AUTH_005 | 401 | Account disabled | Contact administrator |

## Implementation Examples

### JavaScript/Frontend
```javascript
class AuthService {
  constructor() {
    this.baseURL = 'https://api-fms.aastu.edu.et/v1';
    this.accessToken = null;
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, device_id: 'web-client' })
    });

    const data = await response.json();
    
    if (data.success) {
      this.accessToken = data.data.access_token;
      this.refreshToken = data.data.refresh_token;
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

    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (response.status === 401) {
      await this.refreshAccessToken();
      response = await fetch(url, {
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
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.refreshToken}` }
    });

    const data = await response.json();
    
    if (data.success) {
      this.accessToken = data.data.access_token;
      this.refreshToken = data.data.refresh_token;
      localStorage.setItem('refresh_token', this.refreshToken);
    } else {
      this.logout();
      throw new Error('Session expired');
    }
  }

  async logout() {
    if (this.accessToken) {
      await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
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
from datetime import datetime, timedelta

class AAStuFMSAuth:
    def __init__(self, base_url="https://api-fms.aastu.edu.et/v1"):
        self.base_url = base_url
        self.access_token = None
        self.refresh_token = None
        self.token_expiry = None

    def login(self, email, password):
        response = requests.post(f"{self.base_url}/auth/login", json={
            "email": email,
            "password": password,
            "device_id": "python-client"
        })
        
        data = response.json()
        
        if data["success"]:
            self.access_token = data["data"]["access_token"]
            self.refresh_token = data["data"]["refresh_token"]
            self.token_expiry = datetime.now() + timedelta(seconds=data["data"]["expires_in"])
            return data["data"]["user"]
        else:
            raise Exception(data["message"])

    def get_auth_headers(self):
        if not self.access_token or datetime.now() >= self.token_expiry:
            self.refresh_access_token()
        
        return {"Authorization": f"Bearer {self.access_token}"}

    def refresh_access_token(self):
        if not self.refresh_token:
            raise Exception("No refresh token available")
            
        response = requests.post(f"{self.base_url}/auth/refresh", 
                               headers={"Authorization": f"Bearer {self.refresh_token}"})
        
        data = response.json()
        
        if data["success"]:
            self.access_token = data["data"]["access_token"]
            self.refresh_token = data["data"]["refresh_token"]
            self.token_expiry = datetime.now() + timedelta(seconds=data["data"]["expires_in"])
        else:
            raise Exception("Token refresh failed")

    def logout(self):
        if self.access_token:
            requests.post(f"{self.base_url}/auth/logout", 
                         headers=self.get_auth_headers())
        
        self.access_token = None
        self.refresh_token = None
        self.token_expiry = None
```