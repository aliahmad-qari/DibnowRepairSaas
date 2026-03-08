# SuperAdmin Database Conversion Plan

## Overview
Convert all 12 SuperAdmin pages from static/mock data to fully database-driven functionality.

## Files to Convert

### 1. SuperAdminDashboard.tsx ✅ PRIORITY 1
**Current State:** Uses `db.users.getAll()` mock data
**Required APIs:**
- `GET /api/superadmin/dashboard/stats` - Total users, shops, revenue, active subs
- `GET /api/superadmin/dashboard/chart-data` - 6-month revenue & signup trends
- `GET /api/superadmin/system/health` - Infrastructure status

**Backend Route:** Create `backend/routes/superadmin.js`

---

### 2. UserManagement.tsx ✅ PRIORITY 2
**Current State:** Mock user data
**Required APIs:**
- `GET /api/superadmin/users` - All users with filters (role, status, plan)
- `PUT /api/superadmin/users/:id/status` - Update user status
- `PUT /api/superadmin/users/:id/role` - Update user role
- `DELETE /api/superadmin/users/:id` - Delete user
- `POST /api/superadmin/users/:id/reset-password` - Reset password

---

### 3. ShopManagement.tsx ✅ PRIORITY 3
**Current State:** Mock shop data
**Required APIs:**
- `GET /api/superadmin/shops` - All shops with stats
- `PUT /api/superadmin/shops/:id/status` - Enable/disable shop
- `GET /api/superadmin/shops/:id/details` - Shop details

---

### 4. RevenueAnalytics.tsx ✅ PRIORITY 4
**Current State:** Mock revenue data
**Required APIs:**
- `GET /api/superadmin/revenue/overview` - Total revenue, MRR, growth
- `GET /api/superadmin/revenue/by-plan` - Revenue breakdown by plan
- `GET /api/superadmin/revenue/chart` - Time-series revenue data
- `GET /api/superadmin/revenue/transactions` - Recent transactions

---

### 5. PaymentControl.tsx ✅ PRIORITY 5
**Current State:** Mock payment data
**Required APIs:**
- `GET /api/superadmin/payments` - All payments with filters
- `PUT /api/superadmin/payments/:id/status` - Update payment status
- `POST /api/superadmin/payments/:id/refund` - Process refund

---

### 6. GlobalPlans.tsx ✅ PRIORITY 6
**Current State:** Uses existing `/api/plans` but needs CRUD
**Required APIs:**
- `GET /api/plans` - Already exists
- `POST /api/plans/add` - Already exists
- `PUT /api/plans/:id` - Already exists
- `DELETE /api/plans/:id` - Already exists
**Status:** Mostly done, just needs frontend connection

---

### 7. GlobalCurrencies.tsx
**Current State:** Mock currency data
**Required APIs:**
- `GET /api/superadmin/currencies` - All currencies
- `POST /api/superadmin/currencies` - Add currency
- `PUT /api/superadmin/currencies/:id` - Update currency
- `DELETE /api/superadmin/currencies/:id` - Delete currency

---

### 8. GlobalAnnouncements.tsx
**Current State:** Mock announcements
**Required APIs:**
- `GET /api/superadmin/announcements` - All announcements
- `POST /api/superadmin/announcements` - Create announcement
- `PUT /api/superadmin/announcements/:id` - Update announcement
- `DELETE /api/superadmin/announcements/:id` - Delete announcement

---

### 9. GlobalFeatureFlags.tsx
**Current State:** Mock feature flags
**Required APIs:**
- `GET /api/superadmin/features` - All feature flags
- `PUT /api/superadmin/features/:id/toggle` - Toggle feature

---

### 10. SystemAuditLogs.tsx
**Current State:** Mock audit logs
**Required APIs:**
- `GET /api/superadmin/audit-logs` - All audit logs with filters
- Uses existing `/api/activities` but needs superadmin scope

---

### 11. GlobalSupport.tsx
**Current State:** Mock support tickets
**Required APIs:**
- `GET /api/superadmin/support/tickets` - All support tickets
- `PUT /api/superadmin/support/tickets/:id/status` - Update ticket status
- `POST /api/superadmin/support/tickets/:id/reply` - Reply to ticket

---

### 12. AIMonitor.tsx
**Current State:** Mock AI usage data
**Required APIs:**
- `GET /api/superadmin/ai/usage` - AI usage stats
- `GET /api/superadmin/ai/requests` - Recent AI requests

---

## Implementation Order (Recommended)

1. **SuperAdminDashboard** - Core metrics
2. **UserManagement** - Critical admin function
3. **ShopManagement** - Business monitoring
4. **RevenueAnalytics** - Financial tracking
5. **PaymentControl** - Payment management
6. **GlobalPlans** - Plan management (mostly done)
7. **SystemAuditLogs** - Security tracking
8. **GlobalCurrencies** - Configuration
9. **GlobalAnnouncements** - Communication
10. **GlobalFeatureFlags** - Feature control
11. **GlobalSupport** - Support management
12. **AIMonitor** - AI tracking

---

## Backend Structure

### New File: `backend/routes/superadmin.js`
```javascript
const express = require('express');
const router = express.Router();
const { authMiddleware, superadminOnly } = require('../middleware/auth');

// All routes protected by superadmin middleware
router.use(authMiddleware);
router.use(superadminOnly);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/chart-data', getChartData);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// ... more routes
```

### Middleware: `backend/middleware/auth.js`
```javascript
const superadminOnly = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Superadmin access required' });
  }
  next();
};
```

---

## Database Models Needed

### Existing Models (Use as-is):
- User
- Plan
- Transaction
- Subscription
- Wallet

### New Models Needed:
1. **Currency** - For GlobalCurrencies
2. **Announcement** - For GlobalAnnouncements
3. **FeatureFlag** - For GlobalFeatureFlags
4. **SupportTicket** - For GlobalSupport

---

## Next Steps

1. Create `backend/routes/superadmin.js`
2. Create `backend/middleware/auth.js` (superadminOnly)
3. Create new models (Currency, Announcement, FeatureFlag, SupportTicket)
4. Implement routes one by one
5. Update frontend components to use APIs
6. Test each component thoroughly

---

## Estimated Time
- Backend setup: 2-3 hours
- Per file conversion: 30-45 minutes
- Total: ~10-12 hours for complete conversion

---

## Notes
- Keep all existing UI/styling unchanged
- Add loading states without changing design
- Add error handling without changing layout
- Use existing `callBackendAPI` utility
- Maintain existing file structure
