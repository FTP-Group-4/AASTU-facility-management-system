# Error Handling Guide

## Overview

The AASTU FMS API uses standard HTTP status codes and provides detailed error information in a consistent format. This guide covers error handling patterns, common errors, and best practices.

## Error Response Format

All error responses follow this standard format:

```json
{
  "success": false,
  "data": null,
  "message": "Human-readable error description",
  "error_code": "MACHINE_READABLE_CODE",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### Fields Explanation

- **success**: Always `false` for error responses
- **data**: Always `null` for error responses
- **message**: Human-readable error description for display to users
- **error_code**: Machine-readable code for programmatic handling
- **timestamp**: ISO 8601 timestamp when the error occurred

## HTTP Status Codes

### 2xx Success
- **200 OK**: Request successful
- **201 Created**: Resource created successfully

### 4xx Client Errors
- **400 Bad Request**: Invalid request data or validation error
- **401 Unauthorized**: Authentication required or invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., duplicate report)
- **422 Unprocessable Entity**: Validation error with detailed field information
- **429 Too Many Requests**: Rate limit exceeded

### 5xx Server Errors
- **500 Internal Server Error**: Unexpected server error
- **503 Service Unavailable**: Service temporarily unavailable

## Error Codes Reference

### Authentication Errors (AUTH_xxx)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| AUTH_001 | 401 | Invalid credentials | Verify email and password |
| AUTH_002 | 401 | Token expired | Refresh access token |
| AUTH_003 | 403 | Insufficient permissions | Check user role and permissions |
| AUTH_004 | 400 | Invalid email format | Use valid AASTU email |
| AUTH_005 | 401 | Account disabled | Contact administrator |

### Validation Errors (VALID_xxx)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| VALID_001 | 400 | Invalid block number | Use block number 1-100 |
| VALID_002 | 400 | Required field missing | Provide all required fields |
| VALID_003 | 400 | Invalid priority level | Use: emergency, high, medium, low |
| VALID_004 | 400 | Invalid file format | Use supported image formats |
| VALID_005 | 400 | File too large | Reduce file size (max 5MB) |
| VALID_006 | 400 | Too many files | Maximum 3 photos per report |

### Report Errors (REPORT_xxx)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| REPORT_001 | 409 | Duplicate report detected | Review existing report or proceed anyway |
| REPORT_002 | 404 | Report not found | Verify ticket ID |
| REPORT_003 | 403 | Not authorized to view report | Check permissions |
| REPORT_004 | 400 | Invalid status transition | Check valid status transitions |
| REPORT_005 | 400 | Cannot rate incomplete report | Wait for completion |

### User Errors (USER_xxx)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| USER_001 | 404 | User not found | Verify user ID |
| USER_002 | 409 | Email already exists | Use different email |
| USER_003 | 400 | Invalid role assignment | Use valid role |

### System Errors (SYSTEM_xxx)

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| SYSTEM_001 | 500 | Internal server error | Retry request, contact support if persistent |
| SYSTEM_002 | 503 | Service temporarily unavailable | Retry after delay |
| SYSTEM_003 | 500 | Database connection error | Retry request |

## Validation Error Details

For validation errors (422 status), the API provides detailed field-level errors:

```json
{
  "success": false,
  "data": {
    "validation_errors": {
      "email": ["Invalid email format"],
      "password": ["Password must be at least 8 characters"],
      "block_id": ["Block ID must be between 1 and 100"]
    }
  },
  "message": "Validation failed",
  "error_code": "VALID_002",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

## Rate Limiting Errors

When rate limits are exceeded:

```json
{
  "success": false,
  "data": {
    "retry_after": 60,
    "limit": 100,
    "remaining": 0,
    "reset_time": "2024-01-20T11:00:00Z"
  },
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "error_code": "RATE_001",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

## Error Handling Best Practices

### 1. Client-Side Error Handling

```javascript
async function handleApiRequest(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!data.success) {
      throw new ApiError(data.message, data.error_code, response.status);
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof ApiError) {
      handleApiError(error);
    } else {
      handleNetworkError(error);
    }
    throw error;
  }
}

class ApiError extends Error {
  constructor(message, errorCode, statusCode) {
    super(message);
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

function handleApiError(error) {
  switch (error.errorCode) {
    case 'AUTH_002':
      // Token expired - refresh token
      refreshToken();
      break;
    case 'AUTH_003':
      // Insufficient permissions
      showPermissionError();
      break;
    case 'REPORT_001':
      // Duplicate report
      showDuplicateWarning();
      break;
    case 'VALID_001':
      // Invalid block number
      highlightBlockField();
      break;
    default:
      showGenericError(error.message);
  }
}
```

### 2. Retry Logic

```javascript
async function apiRequestWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }
      
      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new ApiError(data.message, data.error_code, response.status);
      }
      
      // Retry server errors (5xx)
      if (attempt === maxRetries) {
        throw new ApiError(data.message, data.error_code, response.status);
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      
    } catch (error) {
      if (attempt === maxRetries || error instanceof ApiError) {
        throw error;
      }
      
      // Network error - retry with backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}
```

### 3. User-Friendly Error Messages

```javascript
function getDisplayMessage(errorCode, defaultMessage) {
  const userFriendlyMessages = {
    'AUTH_001': 'Invalid email or password. Please try again.',
    'AUTH_002': 'Your session has expired. Please log in again.',
    'AUTH_003': 'You don\'t have permission to perform this action.',
    'VALID_001': 'Please select a valid block number (1-100).',
    'VALID_002': 'Please fill in all required fields.',
    'REPORT_001': 'A similar report already exists. Would you like to view it?',
    'REPORT_002': 'Report not found. It may have been deleted.',
    'SYSTEM_001': 'Something went wrong. Please try again.',
    'SYSTEM_002': 'Service is temporarily unavailable. Please try again later.'
  };
  
  return userFriendlyMessages[errorCode] || defaultMessage;
}
```

### 4. Logging and Monitoring

```javascript
function logError(error, context) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error_code: error.errorCode,
    message: error.message,
    status_code: error.statusCode,
    context: context,
    user_agent: navigator.userAgent,
    url: window.location.href
  };
  
  // Send to logging service
  sendToLoggingService(errorLog);
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', errorLog);
  }
}
```

## Common Error Scenarios

### 1. Authentication Flow Errors

```javascript
// Handle login errors
try {
  await authService.login(email, password);
} catch (error) {
  switch (error.errorCode) {
    case 'AUTH_001':
      showError('Invalid credentials');
      break;
    case 'AUTH_004':
      showError('Please use your AASTU email address');
      break;
    case 'AUTH_005':
      showError('Account disabled. Contact administrator.');
      break;
    default:
      showError('Login failed. Please try again.');
  }
}
```

### 2. Report Submission Errors

```javascript
// Handle report submission
try {
  await submitReport(reportData);
} catch (error) {
  switch (error.errorCode) {
    case 'REPORT_001':
      // Duplicate report - show options
      showDuplicateDialog(error.data.duplicate_ticket_id);
      break;
    case 'VALID_005':
      showError('Photo file is too large. Please use a smaller image.');
      break;
    case 'VALID_006':
      showError('Maximum 3 photos allowed per report.');
      break;
    default:
      showError('Failed to submit report. Please try again.');
  }
}
```

### 3. Permission Errors

```javascript
// Handle permission errors
function handlePermissionError(error) {
  const roleMessages = {
    'reporter': 'This action is only available to coordinators and admins.',
    'coordinator': 'This action is only available to admins.',
    'fixer': 'You can only update jobs assigned to you.'
  };
  
  const userRole = getCurrentUserRole();
  const message = roleMessages[userRole] || 'Insufficient permissions.';
  
  showPermissionDialog(message);
}
```

## Testing Error Scenarios

### Using Postman

Create test cases for common error scenarios:

1. **Invalid Authentication**:
   - Remove Authorization header
   - Use expired token
   - Use invalid token format

2. **Validation Errors**:
   - Send empty required fields
   - Use invalid data formats
   - Exceed field length limits

3. **Permission Errors**:
   - Access endpoints with wrong role
   - Try to modify other users' data

4. **Rate Limiting**:
   - Send requests rapidly to trigger limits

### Example Test Script

```javascript
// Test error handling
describe('Error Handling', () => {
  test('should handle authentication errors', async () => {
    const response = await fetch('/api/users/profile');
    expect(response.status).toBe(401);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error_code).toBe('AUTH_002');
  });
  
  test('should handle validation errors', async () => {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ /* invalid data */ })
    });
    
    expect(response.status).toBe(422);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.data.validation_errors).toBeDefined();
  });
});
```

## Support and Debugging

When encountering persistent errors:

1. **Check the error code** against this reference
2. **Verify request format** matches API documentation
3. **Check authentication** and permissions
4. **Review rate limiting** if getting 429 errors
5. **Contact support** with error details if issues persist

Include these details when reporting errors:
- Error code and message
- Request URL and method
- Request headers and body
- User role and permissions
- Timestamp of the error