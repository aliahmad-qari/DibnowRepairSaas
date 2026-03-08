# Fix All Superadmin API Paths

## Issue
Frontend pages calling `/superadmin/...` instead of `/api/superadmin/...`

## Files to Fix
All superadmin pages need `/api` prefix added to endpoint paths.

## Pattern to Replace
```typescript
// WRONG
callBackendAPI('/superadmin/users', null, 'GET')
callBackendAPI('/plans', null, 'GET')

// CORRECT
callBackendAPI('/api/superadmin/users', null, 'GET')
callBackendAPI('/api/plans', null, 'GET')
```

## Files Fixed
- ✅ UserManagement.tsx
- ⏳ ShopManagement.tsx
- ⏳ RevenueAnalytics.tsx
- ⏳ SystemAuditLogs.tsx
- ⏳ GlobalPlans.tsx
- ⏳ GlobalCurrencies.tsx
- ⏳ GlobalAnnouncements.tsx
- ⏳ GlobalFeatureFlags.tsx
- ⏳ GlobalSupport.tsx
- ⏳ SuperAdminDashboard.tsx
