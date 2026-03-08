# 🔧 ROUTE NOT FOUND - TROUBLESHOOTING GUIDE

## ✅ Issues Fixed

### 1. Removed Global checkPlanExpiry Middleware
**Problem**: `checkPlanExpiry` was running on ALL routes including superadmin
**Fix**: Removed from global middleware (line 147 in server.js)
**Impact**: Superadmin routes no longer blocked by plan expiry checks

### 2. Added Test Endpoint
**Endpoint**: `GET /api/superadmin/test`
**Purpose**: Verify superadmin routes are loading
**Response**: `{ message: 'Superadmin routes working', user: {...} }`

### 3. Added Route Registration Logging
**Location**: server.js after route registration
**Output**: Confirms all routes including superadmin are registered

---

## 🧪 Testing Superadmin Routes

### Step 1: Test Basic Connectivity
```bash
# Test health endpoint (no auth required)
curl http://localhost:5002/api/health

# Expected: { "status": "healthy", ... }
```

### Step 2: Test Superadmin Test Endpoint
```bash
# Get your JWT token first by logging in as superadmin
# Then test:
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5002/api/superadmin/test

# Expected: { "message": "Superadmin routes working", "user": {...} }
```

### Step 3: Test Dashboard Stats
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5002/api/superadmin/dashboard/stats

# Expected: { "totalUsers": X, "totalShops": Y, ... }
```

---

## 🔍 Common Issues & Solutions

### Issue 1: 404 Route Not Found
**Cause**: Routes not registered or wrong path
**Check**:
1. Server logs show: `[ROUTES] All routes registered successfully`
2. Path is correct: `/api/superadmin/...` (not `/superadmin/...`)
3. Backend server is running on correct port (5002)

**Solution**:
```bash
# Restart backend server
cd backend
npm start
```

### Issue 2: 401 Unauthorized
**Cause**: Missing or invalid JWT token
**Check**:
1. Token is included in Authorization header
2. Token format: `Bearer YOUR_TOKEN`
3. Token is not expired

**Solution**:
```javascript
// Login first to get fresh token
const response = await fetch('http://localhost:5002/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'superadmin@example.com', password: 'password' })
});
const { token } = await response.json();
```

### Issue 3: 403 Forbidden
**Cause**: User is not superadmin
**Check**:
1. User role in database is 'superadmin' (lowercase)
2. JWT token contains correct role

**Solution**:
```javascript
// Update user role in MongoDB
db.users.updateOne(
  { email: 'your@email.com' },
  { $set: { role: 'superadmin' } }
)
```

### Issue 4: CORS Error
**Cause**: Frontend origin not allowed
**Check**:
1. Server logs show: `[CORS] ✅ Allowing origin`
2. Frontend is running on localhost:5173

**Solution**: Already configured - localhost always allowed in development

---

## 📋 All Superadmin Endpoints

### Dashboard
- ✅ `GET /api/superadmin/test` - Test endpoint
- ✅ `GET /api/superadmin/dashboard/stats`
- ✅ `GET /api/superadmin/dashboard/chart-data`
- ✅ `GET /api/superadmin/system/health`

### Users
- ✅ `GET /api/superadmin/users`
- ✅ `PUT /api/superadmin/users/:id/status`
- ✅ `PUT /api/superadmin/users/:id/plan`

### Shops
- ✅ `GET /api/superadmin/shops`

### Revenue
- ✅ `GET /api/superadmin/revenue/overview`
- ✅ `GET /api/superadmin/revenue/chart`

### Audit
- ✅ `GET /api/superadmin/audit-logs`

### Currencies
- ✅ `GET /api/superadmin/currencies`
- ✅ `POST /api/superadmin/currencies`
- ✅ `DELETE /api/superadmin/currencies/:id`

### Announcements
- ✅ `GET /api/superadmin/announcements`
- ✅ `POST /api/superadmin/announcements`
- ✅ `DELETE /api/superadmin/announcements/:id`

### Features
- ✅ `GET /api/superadmin/features`
- ✅ `PUT /api/superadmin/features/:id/toggle`

### Support
- ✅ `GET /api/superadmin/support/tickets`
- ✅ `PUT /api/superadmin/support/tickets/:id/status`

---

## 🚀 Quick Fix Checklist

- [x] Remove global checkPlanExpiry middleware
- [x] Add test endpoint
- [x] Add route registration logging
- [x] Verify syntax (no errors)
- [x] All routes registered at `/api/superadmin`

---

## 🔧 If Still Getting 404

### 1. Check Server Logs
Look for:
```
[ROUTES] All routes registered successfully
[ROUTES] Superadmin routes available at: /api/superadmin/*
```

### 2. Verify Backend URL
Frontend should call:
```javascript
// Development
const API_URL = 'http://localhost:5002/api/superadmin/...'

// Production
const API_URL = 'https://dibnowrepairsaas.onrender.com/api/superadmin/...'
```

### 3. Check apiClient.ts
Ensure base URL is correct:
```typescript
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
```

### 4. Restart Everything
```bash
# Backend
cd backend
npm start

# Frontend (new terminal)
npm run dev
```

---

## ✅ Status

**All fixes applied. Routes should work now.**

If still having issues, check:
1. Server logs for route registration
2. Network tab in browser DevTools
3. JWT token is valid and user is superadmin
