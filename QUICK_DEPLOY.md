# 🚀 DibNow Deployment - Quick Guide

## ⚠️ FIX THE BUILD ERROR FIRST!

**You deployed FRONTEND (Vite) to Render - This is WRONG!**

Your project structure:
- **Frontend** (Vite) → Deploy to **VERCEL**
- **Backend** (Node.js) → Deploy to **RENDER**

---

## RENDER (Backend Only) - Add These Variables:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://nowdib_db_user:u2wz2J5OPPk8G4sL@cluster0.jqqe2wo.mongodb.net/products?retryWrites=true&w=majority&appName=Cluster0
CORS_ORIGINS=https://dibnow.vercel.app,https://apps.dibnow.com,http://localhost:3000
PAYPAL_CLIENT_ID=AcL31VtB9Zab_aBWDYO-tkW3k563IxryBvbOxb_5YGeM-MwSTH5Mv1QcPxObgTzX4znJbaMEylIcgSow
PAYPAL_CLIENT_SECRET=EF5j6mHa6N7CD6V9NtSHmd5akmR6RxmgyishoJPM6-6WPaPJpcMtgaLS5WcSyK_4jjCZhAPLbK_LubQD
STRIPE_PUBLISHABLE_KEY=pk_live_51R38z5G6cgFjQqmGiLSxEzvouJzPn5ifUynb5juWaOeiVmgACljMOiIdK5vwA7Vr4Xzhn4ScVXSrnKI8nrEIpVcq00TyuCVIEH
STRIPE_SECRET_KEY=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
PAYFAST_CANCEL_URL=https://apps.dibnow.com/pricing/payfast/cancel
PAYFAST_MERCHANT_ID=26995
PAYFAST_MODE=live
PAYFAST_NOTIFY_URL=https://apps.dibnow.com/pricing/payfast/ipn
PAYFAST_RETURN_URL=https://apps.dibnow.com/pricing/payfast/success
PAYFAST_SECURED_KEY=fts432DwdbTzWo0q714sOTgb
PAYFAST_TOKEN_URL=https://ipg1.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken
PAYFAST_TRANSACTION_URL=https://ipg1.apps.net.pk/Ecommerce/api/Transaction/PostTransaction
MAILTRAP_TOKEN=87f2e77487cd2a7d5336cde528bbad91
JWT_SECRET=generate_random_32_character_string_here
```

---

## 📋 STEP BY STEP:

### DELETE YOUR CURRENT RENDER SERVICE AND RECREATE:

1. **Delete** the current Render service (Frontend)
2. **Create NEW** Web Service on Render

### CREATE BACKEND ON RENDER:
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub → Select dibnow repo
4. **Name**: `dibnow-backend`
5. **Build Command**: `cd backend && npm install`
6. **Start Command**: `cd backend && node server.js`
7. Click "Create Web Service"
8. Go to "Environment" tab
9. Add **ALL 16 variables** from above
10. Click "Save Changes"
11. **Wait for deployment to complete**
12. **Copy your Render URL** (e.g., `https://dibnow-backend.onrender.com`)

### CREATE FRONTEND ON VERCEL:
1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Connect GitHub → Select dibnow repo
4. **Framework Preset**: Vite
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`
7. Click "Deploy"
8. Go to "Settings" → "Environment Variables"
9. Add:
   ```
   VITE_API_URL=https://dibnow-backend.onrender.com
   ```
10. Go to "Deployments"
11. Click "Redeploy" on the latest deployment

---

### ✅ AFTER BOTH DEPLOY:
1. Go to Render → Your Backend → Environment
2. Update **CORS_ORIGINS** with your Vercel domain:
   ```
   CORS_ORIGINS=https://your-vercel-domain.vercel.app,https://apps.dibnow.com,http://localhost:3000
   ```

---

### ✅ TEST:
- Track Page: `https://your-vercel-domain.vercel.app/track-repair`
- Login: `https://your-vercel-domain.vercel.app/login`

---

## ⚠️ IMPORTANT NOTES:
- **DO NOT deploy frontend to Render** - Use Vercel
- **DO NOT deploy backend to Vercel** - Use Render
- **JWT_SECRET**: Generate a random 32+ character string
- Always use `cd backend &&` in Build and Start commands
