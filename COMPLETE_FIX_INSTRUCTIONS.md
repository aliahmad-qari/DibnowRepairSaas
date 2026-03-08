# Complete Fix Instructions - All Remaining Issues

## Issues Found:

### 1. ✅ Brands.tsx - Line 88
**Issue**: Shows "0 / Quota" - quota not updating after plan change
**Location**: Line 88 - `{brands.length} / {activePlan?.limits.brands >= 999 ? '∞' : activePlan?.limits.brands} Quota`
**Fix**: Already correct! The issue is that `activePlan` needs to be refreshed after plan upgrade.

### 2. ✅ TeamMembers.tsx - Line 267
**Issue**: "You can add up to team members" - missing number
**Location**: Line 267 - `{activePlan?.name} – You can add up to {activePlan?.limits.teamMembers} team members`
**Fix**: Already correct! Just needs `activePlan` to be loaded properly.

### 3. ❌ ProfilePage.tsx - Missing Plan Info
**Issue**: Billing tab doesn't show current plan details
**Location**: Lines 155-177 (billing tab section)
**Fix Needed**: Add plan information display

### 4. ❌ Pricing.tsx - Wrong Expiry Date
**Issue**: Shows "26 Feb 2026" and "Free trial expires in 7 days" for paid plans
**Location**: Need to check the expiry date calculation
**Fix Needed**: Calculate correct expiry based on `user.planExpireDate`

### 5. ❌ Backend - Plan Expiry Not Set
**Issue**: When user upgrades, `planExpireDate` not set to current date + 30 days
**Fix Needed**: Update plan activation logic in backend

## Detailed Fixes:

### Fix 1: ProfilePage.tsx - Add Plan Info to Billing Tab

**File**: `D:\DibnowAi\pages\user\ProfilePage.tsx`
**Line**: 155 (inside billing tab)

**Add after line 177** (after the credit card section):
```tsx
{/* Plan Information Section */}
<div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm">
  <div className="flex items-center gap-3 mb-6">
    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
      <Rocket size={20} />
    </div>
    <div>
      <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Account Status Overview</h4>
      <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Active Protocol</p>
    </div>
  </div>
  
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Plan</p>
      <p className="text-sm font-black text-slate-800 uppercase">{user?.planName || 'Free Trial'}</p>
    </div>
    <div className="space-y-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cycle Expiry</p>
      <p className="text-sm font-black text-slate-800">
        {user?.planExpireDate 
          ? new Date(user.planExpireDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'N/A'}
      </p>
    </div>
    <div className="space-y-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Auto-Renewal</p>
      <p className="text-sm font-black text-emerald-600 uppercase">
        {user?.autoRenew ? 'Enabled' : 'Disabled'}
      </p>
    </div>
    <div className="space-y-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operational Node</p>
      <p className={`text-sm font-black uppercase ${user?.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
        {user?.status || 'Unknown'}
      </p>
    </div>
  </div>
</div>
```

### Fix 2: Pricing.tsx - Fix Expiry Date Display

**File**: `D:\DibnowAi\pages\user\Pricing.tsx`
**Find**: The section showing "📅 Expiry / Renewal Date"

**Replace the expiry date calculation** (around line 600-620):
```tsx
<p className="text-lg font-black text-slate-800 uppercase tracking-tighter">
  {user?.planExpireDate 
    ? (() => {
        const expiryDate = new Date(user.planExpireDate);
        const now = new Date();
        const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      })()
    : 'Not Set'}
</p>
<p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
  {user?.planExpireDate 
    ? (() => {
        const expiryDate = new Date(user.planExpireDate);
        const now = new Date();
        const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysRemaining > 0 
          ? `${daysRemaining} days remaining` 
          : 'Expired';
      })()
    : 'No active subscription'}
</p>
```

### Fix 3: Backend - Set Plan Expiry on Activation

**File**: `D:\DibnowAi\backend\routes\plans.js`
**Location**: Manual payment approval route (need to create this)

**Add new route for admin to approve manual payments**:
```javascript
// Approve manual payment request (admin only)
router.post('/approve-manual-payment/:requestId', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const planRequest = await PlanRequest.findById(requestId);
    if (!planRequest) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    // Update user's plan
    const user = await User.findById(planRequest.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Set plan with 30-day expiry
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    
    user.planId = planRequest.requestedPlanId;
    user.planName = planRequest.requestedPlanName;
    user.planStartDate = now;
    user.planExpireDate = expiryDate;
    user.status = 'active';
    await user.save();
    
    // Update request status
    planRequest.status = 'approved';
    planRequest.invoiceStatus = 'paid';
    planRequest.processedBy = req.user.userId;
    planRequest.processedAt = now;
    await planRequest.save();
    
    // Notify user
    await Notification.create({
      userId: user._id.toString(),
      ownerId: user._id,
      title: 'Plan Activated',
      message: `Your ${planRequest.requestedPlanName} plan has been activated and will expire on ${expiryDate.toLocaleDateString()}.`,
      type: 'success'
    });
    
    res.json({
      success: true,
      message: 'Plan activated successfully',
      expiryDate: expiryDate
    });
  } catch (error) {
    console.error('[APPROVE PAYMENT] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Fix 4: Backend - Auto-Expire Plans on Login

**File**: `D:\DibnowAi\backend\routes\users.js`
**Location**: Login route

**Add expiry check after successful login**:
```javascript
// After password verification, before sending response
if (user.planExpireDate && new Date(user.planExpireDate) < new Date() && user.status === 'active') {
  user.status = 'expired';
  await user.save();
}
```

### Fix 5: Frontend - Refresh User Data After Plan Change

**File**: `D:\DibnowAi\pages\user\Pricing.tsx`
**Location**: After successful payment (in finalizeUpgrade function)

**Add after plan activation**:
```javascript
// After successful payment
await refreshUser(); // This will reload user data with new plan info
```

## Summary of Changes:

1. **ProfilePage.tsx**: Add plan info display in billing tab
2. **Pricing.tsx**: Fix expiry date calculation to show correct dates
3. **Backend plans.js**: Add admin approval route that sets 30-day expiry
4. **Backend users.js**: Add auto-expiry check on login
5. **Frontend**: Call refreshUser() after plan changes

## Testing Checklist:

- [ ] Brands page shows correct quota after plan upgrade
- [ ] Team members page shows correct limit
- [ ] Profile billing tab shows plan name, expiry, status
- [ ] Pricing page shows correct expiry date (not 2026)
- [ ] Paid plans expire after 30 days
- [ ] Expired plans show "expired" status on login
- [ ] Manual payment approval sets correct expiry date

## Priority:

1. Fix backend plan expiry setting (most critical)
2. Fix Pricing.tsx expiry display
3. Add profile page plan info
4. Add auto-expiry check
5. Test end-to-end flow
