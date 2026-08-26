# Authentication

## Overview

CivicOps uses JWT-based authentication with refresh token rotation.

## Flow

```
1. User sends email + password to POST /api/v1/auth/login
2. Server validates credentials (bcrypt compare)
3. Server creates a session record
4. Server generates:
   - Access Token (JWT, 15min expiry)
   - Refresh Token (UUID, 7 day expiry, stored in DB)
5. Client stores tokens
6. Client sends Access Token in Authorization header for API calls
7. When Access Token expires, client calls POST /api/v1/auth/refresh
8. Server validates refresh token, rotates it, issues new pair
```

## Token Structure

### Access Token (JWT)
```json
{
  "sub": "user-uuid",
  "tenantId": "tenant-uuid",
  "iat": 1234567890,
  "exp": 1234568790
}
```

### Refresh Token
- Random UUID stored in database
- One-time use (rotation on every refresh)
- Revoked on logout

## Security Measures

- Passwords hashed with bcrypt (12 rounds)
- Access tokens are short-lived (15 minutes)
- Refresh tokens are rotated on every use
- All refresh tokens revoked on logout
- Sessions tracked with IP and user agent
- Rate limiting on auth endpoints (5 attempts per minute)
