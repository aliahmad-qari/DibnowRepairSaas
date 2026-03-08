# 🚀 DibNow Integration Guide

## Your URLs:
- **Frontend**: https://dibnow-repair-saas.vercel.app
- **Backend**: https://dibnowrepairsaas.onrender.com

---

## Step 1: Update Render Backend CORS

1. Go to https://dashboard.render.com
2. Click on your **dibnowrepairsaas** service
3. Click **Environment** tab
4. Add this variable:
   ```
   CORS_ORIGINS=https://dibnow-repair-saas.vercel.app,https://dibnowrepairsaas.onrender.com,http://localhost:3000,http://localhost:5173
   ```
5. Click **Save Changes**
6. Click **Redeploy** (top right)

---

## Step 2: Push Code Changes

1. Run these commands:
   ```bash
   git add .
   git commit -m "Updated vercel.json with backend URL"
   git push -u origin main --force
   ```

2. Go to Vercel Dashboard
3. Your frontend will **automatically redeploy**
4. Wait for deployment to complete

---

## Step 3: Test Integration

### Test 1: Track Repair Page (Public)
Visit: https://dibnow-repair-saas.vercel.app/track-repair

You should see the tracking page with search box.

### Test 2: Login (Auth)
Visit: https://dibnow-repair-saas.vercel.app/login

Try to register/login.

### Test 3: API Connection
Open browser console (F12) and check for any CORS errors.

---

## How Authorization Works:

### Registration Flow:
1. User visits `/auth/register`
2. Fills form → POST to `/api/users/register`
3. Backend creates user → Returns JWT token
4. Frontend stores token in localStorage
5. User redirected to dashboard

### Login Flow:
1. User visits `/login`
2. Fills credentials → POST to `/api/users/login`
3. Backend verifies → Returns JWT token
4. Frontend stores token
5. User redirected based on role

### Protected Routes:
- `/user/*` → Requires JWT token + role: user
- `/admin/*` → Requires JWT token + role: admin
- `/superadmin/*` → Requires JWT token + role: superadmin

---

## Common Issues & Fixes:

### Issue: CORS Error
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Fix**: Add your Vercel URL to CORS_ORIGINS in Render

### Issue: 404 on API calls
**Fix**: 
1. Check vercel.json rewrites point to correct backend URL
2. Check backend is running on Render

### Issue: JWT Token not working
**Fix**: 
1. Clear browser cache/cookies
2. Try incognito mode
3. Check JWT_SECRET is set in Render

---

## Current Status:
| Component | URL | Status |
|-----------|-----|--------|
| Frontend | https://dibnow-repair-saas.vercel.app | ✅ Deployed |
| Backend | https://dibnowrepairsaas.onrender.com | ✅ Deployed |
| CORS | Need to add Vercel URL | ⏳ Pending |
| Code Push | Need to push updates | ⏳ Pending |

---

## Quick Test Commands:

Test if backend is running:
```bash
curl https://dibnowrepairsaas.onrender.com/api/health
```

Expected response:
```json
{"status":"healthy","timestamp":"...","uptime":...}
```
