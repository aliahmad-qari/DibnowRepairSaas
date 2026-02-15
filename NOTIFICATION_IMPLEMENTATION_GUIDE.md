# NOTIFICATION IMPLEMENTATION GUIDE

## Overview
This guide shows where to add notifications in each backend route file.

## Helper Functions Available
Located in: `backend/services/notificationHelper.js`

```javascript
const { notifyAdmin, notifyUser, notifyAdminUserAction, notifyUserAdminAction } = require('../services/notificationHelper');
```

---

## 1. USER LOGIN - backend/routes/users.js

**Add after successful login (around line where JWT token is created):**

```javascript
// After successful login
const { notifyAdmin } = require('../services/notificationHelper');
await notifyAdmin('User Login', `${user.name} logged into the system`, 'info');
```

---

## 2. ADD REPAIR - backend/routes/repairs.js

**Add in POST '/' route after repair is created:**

```javascript
const { notifyAdmin } = require('../services/notificationHelper');
await notifyAdmin('New Repair Added', `${user.name} added repair for ${newRepair.customerName} - ${newRepair.device}`, 'info');
```

---

## 3. ADD BRAND - backend/routes/brands.js

**Add in POST '/' route after brand is created:**

```javascript
const { notifyAdmin } = require('../services/notificationHelper');
await notifyAdmin('New Brand Added', `${user.name} added brand: ${brand.name}`, 'info');
```

---

## 4. ADD TEAM MEMBER - backend/routes/team.js

**Add in POST '/' route after team member is created:**

```javascript
const { notifyAdmin } = require('../services/notificationHelper');
await notifyAdmin('New Team Member', `${user.name} added team member: ${teamMember.name}`, 'info');
```

---

## 5. PLAN REQUEST - backend/routes/plans.js (ALREADY IMPLEMENTED ✓)

Already has notifications in `/manual-payment-request` route.

---

## 6. CREATE TICKET/COMPLAINT - backend/routes/complaints.js

**Add in POST '/' route after complaint is created:**

```javascript
const { notifyAdmin } = require('../services/notificationHelper');
await notifyAdmin('New Support Ticket', `${user.name} created ticket: ${complaint.subject}`, 'warning');
```

---

## 7. ADMIN UPDATES PLAN - backend/routes/plans.js

**Add in PUT '/:id' route after plan is updated:**

```javascript
const { notifyUser } = require('../services/notificationHelper');
// Get all users with this plan
const User = require('../models/User');
const users = await User.find({ planId: req.params.id });
for (const user of users) {
  await notifyUser(user._id, 'Plan Updated', `Your ${plan.name} plan has been updated with new features`, 'success');
}
```

---

## 8. ADMIN CREATES NEW PLAN - backend/routes/plans.js

**Add in POST '/add' route after plan is created:**

```javascript
const { notifyUser } = require('../services/notificationHelper');
const User = require('../models/User');
const allUsers = await User.find({ role: 'user' });
for (const user of allUsers) {
  await notifyUser(user._id, 'New Plan Available', `New ${plan.name} plan is now available for upgrade`, 'info');
}
```

---

## 9. ADMIN RESOLVES COMPLAINT - backend/routes/complaints.js

**Add in PUT '/:id/resolve' or similar route:**

```javascript
const { notifyUser } = require('../services/notificationHelper');
await notifyUser(complaint.userId, 'Ticket Resolved', `Your ticket "${complaint.subject}" has been resolved by admin`, 'success');
```

---

## 10. PLAN REQUEST APPROVAL - backend/routes/planRequests.js (ALREADY IMPLEMENTED ✓)

Already has notifications in PUT '/:id/status' route.

---

## IMPLEMENTATION CHECKLIST

### User Actions → Admin Notifications:
- [ ] User Login
- [ ] Add Repair
- [ ] Add Brand  
- [ ] Add Team Member
- [x] Submit Plan Request (DONE)
- [ ] Create Ticket

### Admin Actions → User Notifications:
- [ ] Update Plan
- [ ] Create New Plan
- [ ] Resolve Complaint
- [x] Approve Plan Request (DONE)

---

## TESTING

After implementation, test by:
1. Login as user → Check admin sees notification
2. Add repair as user → Check admin sees notification
3. Create ticket as user → Check admin sees notification
4. Resolve ticket as admin → Check user sees notification
5. Update plan as admin → Check affected users see notification

---

## NOTES

- All notifications are stored in MongoDB `notifications` collection
- Admin sees notifications with `userId: 'global'`
- Users see notifications with `userId: <their_user_id>`
- Notifications auto-refresh every 30 seconds in TopNavbar
- Mark as read functionality is already implemented
