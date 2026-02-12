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

# Generate a random 32+ character string for JWT_SECRET
JWT_SECRET=your_random_jwt_secret_here

# Email (Mailtrap)
MAILTRAP_TOKEN=87f2e77487cd2a7d5336cde528bbad91

# PayPal - Get from https://developer.paypal.com
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Stripe - Get from https://dashboard.stripe.com/apikeys
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key

# PayFast (Pakistan) - Get from your PayFast merchant account
PAYFAST_CANCEL_URL=https://apps.dibnow.com/pricing/payfast/cancel
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MODE=live
PAYFAST_NOTIFY_URL=https://apps.dibnow.com/pricing/payfast/ipn
PAYFAST_RETURN_URL=https://apps.dibnow.com/pricing/payfast/success
PAYFAST_SECURED_KEY=your_secured_key
PAYFAST_TOKEN_URL=https://ipg1.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken
PAYFAST_TRANSACTION_URL=https://ipg1.apps.net.pk/Ecommerce/api/Transaction/PostTransaction
```

---

## ⚠️ IMPORTANT: Protect Your API Keys!

- **NEVER commit real API keys to GitHub!**
- **ALWAYS use test keys in development**
- **Only use live keys in production environment variables**
- Add sensitive files to `.gitignore`:
  ```
  backend/.env
  .env
  .env.local
  ```

---

## 📋 STEP BY STEP:

### STEP 1: Delete Current Render Service
Go to Render dashboard → Delete the frontend service

### STEP 2: Create NEW Backend Service on Render
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub → Select dibnow repo
4. **Name**: `dibnow-backend`
5. **Build Command**: `cd backend && npm install`
6. **Start Command**: `cd backend && node server.js`
7. Click "Create Web Service"
8. Go to "Environment" tab
9. Add **ALL environment variables** from above
10. Click "Save Changes"
11. **Wait for deployment to complete**
12. **Copy your Render URL** (e.g., `https://dibnow-backend.onrender.com`)

### STEP 3: Create Frontend on Vercel
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
- **DO NOT commit real API keys to GitHub**
- **JWT_SECRET**: Generate a random 32+ character string
- Always use `cd backend &&` in Build and Start commands
