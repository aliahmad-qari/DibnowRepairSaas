# Remaining Issues to Fix

## Issues Identified:

1. **Brands.tsx** - "0 / Quota" not updating when plan changes
2. **TeamMembers.tsx** - "You can add up to team members" - missing number
3. **User Profile** - Plan info not showing (name, expiry, auto-renewal)
4. **Pricing.tsx** - Wrong expiry date showing "26 Feb 2026" and "Free trial expires in 7 days"
5. **Plan Expiry Logic** - All paid plans should expire after 1 month automatically

## Root Causes:

### Issue 1-2: Plan limits not refreshing
- Components need to refetch user data after plan change
- Need to call `refreshUser()` from AuthContext

### Issue 3: User Profile missing data
- Need to check which file handles user profile
- Likely missing fields from user object

### Issue 4-5: Plan expiry calculation wrong
- User model has `planExpireDate` field
- Need to calculate correctly: current date + 30 days for paid plans
- Need to show correct expiry date in UI
- Need backend job to check and expire plans automatically

## Files to Fix:

1. `D:\DibnowAi\pages\user\Brands.tsx` - Add refreshUser after plan change
2. `D:\DibnowAi\pages\user\TeamMembers.tsx` - Show team member limit
3. `D:\DibnowAi\pages\user\Profile.tsx` or `Settings.tsx` - Add plan info display
4. `D:\DibnowAi\pages\user\Pricing.tsx` - Fix expiry date calculation
5. `D:\DibnowAi\backend\routes\plans.js` - Set correct expiry when plan activates
6. `D:\DibnowAi\backend\routes\users.js` - Add plan expiry check on login

## Implementation Plan:

### Step 1: Fix Plan Activation (Backend)
When user upgrades plan, set:
```javascript
planStartDate: new Date()
planExpireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
status: 'active'
```

### Step 2: Fix Expiry Display (Frontend)
Calculate days remaining:
```javascript
const daysRemaining = Math.ceil((new Date(user.planExpireDate) - new Date()) / (1000 * 60 * 60 * 24))
```

### Step 3: Add Auto-Expiry Check (Backend)
On every login, check if plan expired:
```javascript
if (user.planExpireDate < new Date() && user.status === 'active') {
  user.status = 'expired'
  await user.save()
}
```

### Step 4: Refresh User Data (Frontend)
After plan change, call:
```javascript
await refreshUser()
```

## Priority Order:
1. Fix plan expiry calculation (most critical)
2. Fix user profile display
3. Fix quota display refresh
4. Add auto-expiry check
