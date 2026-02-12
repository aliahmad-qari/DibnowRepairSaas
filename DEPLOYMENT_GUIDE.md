# DibNow Deployment Guide

## Prerequisites
- Node.js 18+ installed
- Git installed
- Vercel account
- Render account

---

## 1. Backend Deployment on Render

### Step 1: Deploy to Render
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: dibnow-backend
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Environment**: `Node`

### Step 2: Set Environment Variables in Render
In Render dashboard, add these environment variables:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://nowdib_db_user:u2wz2J5OPPk8G4sL@cluster0.jqqe2wo.mongodb.net/products?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_jwt_secret_min_32_chars
CORS_ORIGINS=https://dibnow.vercel.app,http://localhost:3000,http://localhost:5173
```

### Step 3: Set Payment Provider Variables (Optional)
```
# Email
MAILTRAP_TOKEN=87f2e77487cd2a7d5336cde528bbad91

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# PayFast (Pakistan)
PAYFAST_CANCEL_URL=https://dibnow.vercel.app/pricing/payfast/cancel
PAYFAST_MERCHANT_ID=26995
PAYFAST_MODE=live
PAYFAST_NOTIFY_URL=https://dibnow.vercel.app/pricing/payfast/ipn
PAYFAST_RETURN_URL=https://dibnow.vercel.app/pricing/payfast/success
PAYFAST_SECURED_KEY=fts432DwdbTzWo0q714sOTgb
PAYFAST_TOKEN_URL=https://ipg1.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken
PAYFAST_TRANSACTION_URL=https://ipg1.apps.net.pk/Ecommerce/api/Transaction/PostTransaction
```

### Step 4: Get Backend URL
After deployment, note your backend URL (e.g., `https://dibnow-backend.onrender.com`)

---

## 2. Frontend Deployment on Vercel

### Step 1: Deploy to Vercel
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 2: Set Environment Variables in Vercel
In Vercel dashboard, go to Settings → Environment Variables and add:

```
VITE_API_URL=https://your-backend.onrender.com
VITE_APP_NAME=DibNow
```

### Step 3: Update Vercel Rewrites
The `vercel.json` file has been configured to proxy API calls to your Render backend:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend.onrender.com/api/:path*"
    }
  ]
}
```

**Important**: Replace `https://your-backend.onrender.com` with your actual Render backend URL in `vercel.json` before deploying, or update it in Vercel settings.

---

## 3. Update CORS in Backend

Update the `CORS_ORIGINS` in Render to include your Vercel URL:

```
CORS_ORIGINS=https://dibnow.vercel.app,https://your-custom-domain.com,http://localhost:3000,http://localhost:5173
```

---

## 4. Quick Deployment Steps

### A. Deploy Backend First
1. Push code to GitHub
2. Create Render web service
3. Add environment variables
4. Note the backend URL after deployment

### B. Deploy Frontend
1. Update `vercel.json` with your backend URL
2. Push code to GitHub
3. Create Vercel project
4. Add `VITE_API_URL` environment variable
5. Deploy

### C. Test
1. Visit your Vercel frontend URL
2. Try logging in
3. Check API calls are working

---

## 5. Environment Files Reference

### Frontend (.env.production)
```
VITE_API_URL=https://dibnow-backend.onrender.com
VITE_APP_NAME=DibNow
```

### Backend (.env) - Already configured
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
CORS_ORIGINS=https://dibnow.vercel.app
JWT_SECRET=your_secret
```

---

## 6. Custom Domain (Optional)

### Vercel Custom Domain
1. Go to Vercel → Settings → Domains
2. Add your custom domain (e.g., `dibnow.com`)
3. Update DNS records as instructed

### Render Custom Domain
1. Go to Render → Your Web Service → Settings
2. Add custom domain
3. Update DNS to point to Render

### Update CORS
After adding custom domain, update CORS_ORIGINS:
```
CORS_ORIGINS=https://dibnow.com,https://dibnow.vercel.app,http://localhost:3000
```

---

## 7. Troubleshooting

### CORS Errors
- Check `CORS_ORIGINS` in Render backend environment variables
- Ensure exact URL match (no trailing slashes)

### API Not Found 404
- Verify `VITE_API_URL` in Vercel matches your Render backend URL
- Check `vercel.json` rewrites are correct
- Ensure backend is running on Render

### MongoDB Connection Failed
- Verify `MONGODB_URI` is correct in Render
- Check IP whitelist in MongoDB Atlas (allow 0.0.0.0/0)

### Build Failures
- Check Node.js version (use 18+)
- Verify all dependencies are installed
- Check build logs in Vercel/Render

### Session/Auth Issues
- Clear browser cache and cookies
- Verify `JWT_SECRET` is set in both environments
- Check backend URL is accessible

---

## 8. URLs After Deployment

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://dibnow.vercel.app |
| Backend (Render) | https://dibnow-backend.onrender.com |
| Tracking Page | https://dibnow.vercel.app/track-repair |
| API Base | https://dibnow-backend.onrender.com/api |

---

## 9. Security Checklist

- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Don't expose sensitive keys in frontend code
- [ ] Enable HTTPS (automatic on both platforms)
- [ ] Keep dependencies updated
- [ ] Monitor usage and logs

---

## 10. Useful Commands

```bash
# Test backend locally
cd backend
npm install
node server.js

# Test frontend locally
npm install
npm run dev

# Build for production
npm run build

# Check environment variables
echo $VITE_API_URL
```
