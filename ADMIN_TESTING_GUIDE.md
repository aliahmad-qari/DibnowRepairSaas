# ADMIN DASHBOARD TESTING GUIDE

## 🧪 How to Test the Dynamic Admin Dashboard

### Prerequisites
1. Backend server running on port 5000
2. MongoDB connected
3. Admin user account created
4. Some test data in database (users, repairs, sales, etc.)

---

## 🔐 Step 1: Login as Admin

1. Navigate to login page
2. Login with admin credentials
3. Verify you're redirected to admin dashboard

---

## 📊 Step 2: Test AdminDashboard.tsx

**URL:** `/admin/dashboard`

**What to Check:**
- [ ] Loading spinner appears initially
- [ ] All stat cards show real numbers (not 0 or dummy values)
- [ ] Stock Products count matches database
- [ ] Sales Products count matches database
- [ ] Repair Products count matches database
- [ ] Total Team count matches database
- [ ] All Users count matches database
- [ ] Active Users count is correct
- [ ] Expired Users count is correct
- [ ] Free Trial Users count is correct
- [ ] Plan Bought Users count is correct
- [ ] All Complaints count matches database
- [ ] Pending/Completed Complaints are correct
- [ ] Total Revenue shows real sum

**Expected Behavior:**
- Numbers should change when you add/remove data
- No hardcoded values like "Rs0" or "0"
- Graphs should display real data

---

## 👥 Step 3: Test Users.tsx

**URL:** `/admin/users`

**What to Check:**
- [ ] Loading spinner appears
- [ ] All registered users are displayed
- [ ] User names are real (not "Elite Mobile Repair")
- [ ] Email addresses are real
- [ ] Plan names are correct (Free Trial, Pro, etc.)
- [ ] Status badges show correct status (active/expired)
- [ ] Wallet balances are real values

**Expected Behavior:**
- Should show ALL users from database
- Not filtered by any specific owner
- Empty state if no users exist

---

## 💰 Step 4: Test AllSales.tsx

**URL:** `/admin/sales`

**What to Check:**
- [ ] Loading spinner appears
- [ ] Total Revenue shows real sum
- [ ] Average Order Value is calculated correctly
- [ ] All sales from all users are displayed
- [ ] Invoice numbers are real
- [ ] Product names are real
- [ ] Amounts are correct
- [ ] Dates are properly formatted

**Expected Behavior:**
- Shows sales from ALL users
- Revenue calculations are accurate
- Empty state if no sales exist

---

## 🔧 Step 5: Test AllRepairs.tsx

**URL:** `/admin/repairs`

**What to Check:**
- [ ] All repairs from all users are displayed
- [ ] Customer names are real
- [ ] Device models are real
- [ ] Status badges are correct (pending/completed)
- [ ] Service costs are real
- [ ] Dates are properly formatted

**Expected Behavior:**
- Platform-wide repair visibility
- No filtering by specific shop
- Empty state if no repairs exist

---

## 📦 Step 6: Test AllInventory.tsx

**URL:** `/admin/inventory`

**What to Check:**
- [ ] Global Asset Value is calculated correctly
- [ ] All inventory items from all users are displayed
- [ ] Product names are real
- [ ] SKUs are real or generated from IDs
- [ ] Stock quantities are correct
- [ ] Unit prices are real
- [ ] Asset values are calculated (price × stock)

**Expected Behavior:**
- Shows inventory from ALL shops
- Asset value updates when inventory changes
- Empty state if no inventory exists

---

## 💬 Step 7: Test Complaints.tsx

**URL:** `/admin/complaints`

**What to Check:**
- [ ] All complaints from all users are displayed
- [ ] Complaint subjects are real
- [ ] User names are real
- [ ] Status badges are correct (pending/resolved)
- [ ] Dates are properly formatted
- [ ] Resolve button works
- [ ] Complaint details panel shows on click

**Expected Behavior:**
- Platform-wide complaint visibility
- Can mark complaints as resolved
- Empty state if no complaints exist

---

## 💳 Step 8: Test Transactions.tsx

**URL:** `/admin/transactions`

**What to Check:**
- [ ] Daily Revenue shows today's total
- [ ] Refund Rate is calculated correctly
- [ ] Active Top-ups count is correct
- [ ] Total Transactions count matches database
- [ ] All transactions are displayed
- [ ] User names are populated
- [ ] Transaction types are correct
- [ ] Amounts are real
- [ ] Payment methods are correct
- [ ] Status badges are accurate
- [ ] Dates are properly formatted

**Expected Behavior:**
- Shows ALL platform transactions
- Metrics update in real-time
- Empty state if no transactions exist

---

## 💼 Step 9: Test Wallet.tsx

**URL:** `/admin/wallet`

**What to Check:**
- [ ] Total Platform Revenue is calculated correctly
- [ ] Available for Payout is 85% of revenue
- [ ] Pending Verifications count is correct
- [ ] Transaction ledger shows real data
- [ ] User names are populated
- [ ] Transaction types are correct
- [ ] Amounts are real (positive/negative)
- [ ] Status badges are accurate

**Expected Behavior:**
- Revenue calculations are accurate
- Shows recent transactions
- Empty state if no transactions exist

---

## 🔍 Step 10: Cross-Verification Tests

### Test 1: Add New User
1. Register a new user
2. Go to Admin Dashboard
3. Verify "All Users" count increased by 1
4. Go to Users page
5. Verify new user appears in list

### Test 2: Create New Sale
1. Login as regular user
2. Create a sale
3. Login as admin
4. Go to AllSales page
5. Verify new sale appears
6. Check Total Revenue increased

### Test 3: Add New Repair
1. Login as regular user
2. Create a repair
3. Login as admin
4. Go to AllRepairs page
5. Verify new repair appears
6. Check repair count increased on dashboard

### Test 4: Create Transaction
1. Make a payment (subscription/wallet topup)
2. Login as admin
3. Go to Transactions page
4. Verify transaction appears
5. Check Daily Revenue updated

---

## ⚠️ Common Issues & Solutions

### Issue: "Access denied" error
**Solution:** Ensure you're logged in as admin/superadmin

### Issue: Empty data everywhere
**Solution:** Add test data to database first

### Issue: Loading spinner never stops
**Solution:** Check backend server is running and MongoDB is connected

### Issue: "Failed to fetch" errors
**Solution:** Verify API endpoints are accessible and CORS is configured

### Issue: Numbers don't update
**Solution:** Refresh the page or check if API is returning cached data

---

## ✅ Success Criteria

The admin dashboard is working correctly if:

1. ✅ No dummy data visible anywhere
2. ✅ All numbers match database records
3. ✅ Adding/removing data updates counts
4. ✅ All pages load without errors
5. ✅ Loading states work properly
6. ✅ Empty states display when no data
7. ✅ Platform-wide visibility (not per-user)
8. ✅ Calculations are accurate
9. ✅ No console errors
10. ✅ User-side functionality unaffected

---

## 🐛 Debugging Tips

### Check Backend Logs
```bash
# Look for these in backend console:
✅ MongoDB Connected Successfully
✅ Server running on port 5000
```

### Check Browser Console
```javascript
// Should see successful API calls:
GET /api/admin/dashboard/aggregation → 200 OK
GET /api/admin/dashboard/users → 200 OK
GET /api/admin/dashboard/sales → 200 OK
```

### Check Network Tab
- All admin API calls should return 200 status
- Response data should contain real records
- No 403 (Forbidden) or 401 (Unauthorized) errors

### Verify Database
```javascript
// In MongoDB, check collections have data:
db.users.count()
db.repairs.count()
db.sales.count()
db.inventory.count()
db.complaints.count()
db.transactions.count()
```

---

## 📞 Support

If issues persist:
1. Check backend logs for errors
2. Verify MongoDB connection
3. Ensure admin role is set correctly
4. Clear browser cache and cookies
5. Test with different admin account

---

**Happy Testing! 🎉**
