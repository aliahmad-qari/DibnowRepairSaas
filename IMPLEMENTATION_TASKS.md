# IMPLEMENTATION TASKS - REPAIR SYSTEM & SUBSCRIPTION LOGIC

## ✅ COMPLETED FIXES

### ISSUE 1: Inventory API 404 Error (AllStock.tsx)
**Status:** ✅ FIXED
- Added proper error handling for 404 errors
- Backend route `/api/inventory` is correctly configured
- Error messages now properly logged

### ISSUE 2: Current Active Plan Display (Pricing.tsx)
**Status:** ✅ FIXED
- Added `user.currentPlan` field matching
- Plan now properly displays based on user's actual subscription
- Added visual "Active Plan" badge on pricing cards
- Fixed plan matching logic with multiple fallback strategies

### ISSUE 3: Repair Limit Logic Error
**Status:** ✅ FIXED
- Fixed `TypeError: user.planId.toLowerCase is not a function`
- Properly convert planId to string before comparison: `String(user.planId)`
- Repair count check now works correctly
- No false "Plan limit reached" errors

### ISSUE 4: 7-Day Free Trial Expiry Date
**Status:** ✅ FIXED
- Dynamic expiry date calculation (current date + 7 days)
- Shows actual plan expiry date if user has paid plan
- Displays "Free trial expires in 7 days" for new users

---

## 🔥 PENDING TASKS

### TASK 1: Dynamic Protocol Status System for Repairs

**Objective:** Implement dropdown status update system in Repairs module

**Requirements:**

1. **Default Status**
   - New repairs automatically get `protocolStatus = "Pending"`
   - Set on backend during repair creation

2. **Frontend Dropdown (Repairs.tsx)**
   - Add clickable status in repair table
   - Dropdown options:
     - Pending
     - In Progress
     - Delivered
     - Completed
     - Returned
     - Expired
   - Close dropdown after selection
   - Update UI immediately

3. **Backend Update**
   - Create PATCH endpoint: `/api/repairs/:id/status`
   - Update `protocolStatus` field in database
   - Return updated repair object
   - Show success message (SweetAlert)

4. **Dashboard Graph Integration**
   - Count repairs by `protocolStatus`
   - Auto-update graphs when status changes
   - Use live database values

5. **Type Safety**
   - Use TypeScript enum or union type for status values
   - Prevent string errors

**Implementation Steps:**

```typescript
// 1. Add to Repairs.tsx
type RepairStatus = 'Pending' | 'In Progress' | 'Delivered' | 'Completed' | 'Returned' | 'Expired';

const handleStatusUpdate = async (repairId: string, newStatus: RepairStatus) => {
  try {
    await callBackendAPI(`/api/repairs/${repairId}/status`, { status: newStatus }, 'PATCH');
    // Refresh repairs list
    const repairsResp = await callBackendAPI('/api/repairs', null, 'GET');
    setRepairs(Array.isArray(repairsResp) ? repairsResp : repairsResp?.repairs || []);
  } catch (error) {
    console.error('Status update failed:', error);
  }
};

// 2. Add backend route in backend/routes/repairs.js
router.patch('/:id/status', checkPermission('manage_repairs'), async (req, res) => {
  try {
    const { status } = req.body;
    const updatedRepair = await Repair.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      { protocolStatus: status },
      { new: true }
    );
    if (!updatedRepair) return res.status(404).json({ message: 'Repair not found' });
    res.json(updatedRepair);
  } catch (error) {
    res.status(500).json({ message: 'Error updating status' });
  }
});
```

---

### TASK 2: Subscription System with Auto-Expiry

**Objective:** Implement proper subscription lifecycle management

**Requirements:**

1. **Free Trial Logic**
   - Duration: 7 days
   - Auto-activate on registration
   - Fields to set:
     ```javascript
     planName: 'Free Trial'
     planStartDate: new Date()
     planExpireDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
     status: 'active'
     ```

2. **Paid Plan Logic**
   - Duration: 30 days (1 month)
   - On purchase:
     ```javascript
     planStartDate: new Date()
     planExpireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
     status: 'active'
     ```
   - Only ONE active plan at a time

3. **Resubscribe Logic**
   - If old plan expired → activate new plan normally
   - If old plan active → replace old plan, reset dates
   - No multiple active plans allowed

4. **Auto-Expiry Middleware**
   ```javascript
   // backend/middleware/checkExpiry.js
   const checkPlanExpiry = async (req, res, next) => {
     if (req.user && req.user.planExpireDate) {
       if (new Date(req.user.planExpireDate) < new Date()) {
         await User.findByIdAndUpdate(req.user.userId, { status: 'expired' });
         req.user.status = 'expired';
       }
     }
     next();
   };
   ```

5. **Frontend Display**
   - Show "ACTIVE" badge on current plan
   - Highlight active plan card
   - Show remaining days for free trial
   - Show "Expired" if plan expired

**Database Schema Updates:**

```javascript
// User Model additions
{
  planName: String,
  planStartDate: Date,
  planExpireDate: Date,
  planStatus: { type: String, enum: ['active', 'expired'], default: 'active' },
  currentPlan: String, // Display name like "PREMIUM"
}
```

**Implementation Files:**
- `backend/models/User.js` - Add new fields
- `backend/middleware/checkExpiry.js` - Create expiry checker
- `backend/routes/users.js` - Add registration logic
- `backend/routes/stripe.js` - Update payment success handler
- `pages/user/Pricing.tsx` - Update UI display

---

## 🎯 IMPLEMENTATION PRIORITY

1. ✅ Fix existing bugs (COMPLETED)
2. 🔥 Implement Protocol Status System (HIGH PRIORITY)
3. 🔥 Implement Subscription Auto-Expiry (HIGH PRIORITY)

---

## ⚠️ IMPORTANT RULES

- DO NOT modify existing working features
- DO NOT refactor entire system
- Only add new functionality
- Maintain TypeScript type safety
- Keep code clean and professional
- Add console debugging only if needed
- Test thoroughly before deployment

---

## 📝 TESTING CHECKLIST

### Protocol Status System
- [ ] New repair defaults to "Pending"
- [ ] Dropdown shows all status options
- [ ] Status updates in database
- [ ] UI updates immediately
- [ ] Dashboard graphs reflect changes
- [ ] No TypeScript errors

### Subscription System
- [ ] New users get 7-day free trial
- [ ] Free trial expires after 7 days
- [ ] Paid plans last 30 days
- [ ] Only one active plan at a time
- [ ] Resubscribe replaces old plan
- [ ] Expiry auto-updates status
- [ ] UI shows correct active plan
- [ ] Pricing page highlights active plan

---

## 🚀 DEPLOYMENT NOTES

1. Run database migrations if schema changes
2. Test all API endpoints with Postman
3. Verify frontend displays correctly
4. Check console for errors
5. Test edge cases (expired plans, resubscribe, etc.)
6. Monitor logs for any issues

---

**Last Updated:** ${new Date().toISOString()}
**Status:** Ready for Implementation
