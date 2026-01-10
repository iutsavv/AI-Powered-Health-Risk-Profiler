# Render Deployment Guide

## Prerequisites
- GitHub account with your code pushed to a repository
- Render account (https://render.com)

---

## Step 1: Push Code to GitHub

```bash
cd c:\Users\utsav\OneDrive\Desktop\plumb

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Health Risk Analyzer"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/health-risk-analyzer.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

| Setting | Value |
|---------|-------|
| Name | `health-risk-api` |
| Region | Choose closest to you |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |

5. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (Render uses this)

6. Click **"Create Web Service"**
7. Wait for deployment (2-3 minutes)
8. Copy the URL (e.g., `https://health-risk-api.onrender.com`)

---

## Step 3: Deploy Frontend on Render

1. Click **"New +"** → **"Static Site"**
2. Connect the same GitHub repository
3. Configure:

| Setting | Value |
|---------|-------|
| Name | `health-risk-analyzer` |
| Branch | `main` |
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

4. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://health-risk-api.onrender.com`

5. Click **"Create Static Site"**

---

## Step 4: Configure API Proxy (Important!)

Since frontend is static, we need to proxy API calls. Update the frontend before deploying:

### Option A: Use Full API URL in Frontend

Update `frontend/src/App.jsx` to use environment variable:

```javascript
const API_URL = import.meta.env.VITE_API_URL || '';

// Then in your fetch calls:
const response = await fetch(`${API_URL}/api/analyze`, { ... });
```

### Option B: Use Render's Redirect Rules

In Render Static Site settings, add a redirect rule:
- Source: `/api/*`
- Destination: `https://health-risk-api.onrender.com/api/*`
- Type: `Rewrite`

---

## Step 5: Update CORS (Backend)

Make sure your backend allows requests from your frontend domain:

```javascript
// In server.js
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://health-risk-analyzer.onrender.com',
    'https://your-custom-domain.com'
  ]
}));
```

---

## Step 6: Test Deployment

1. Visit your frontend URL: `https://health-risk-analyzer.onrender.com`
2. Fill out the form
3. Click "Analyze Health Risk"
4. Verify results appear

---

## Troubleshooting

### Backend won't start
- Check Render logs for errors
- Ensure `package.json` has `"type": "module"` for ES modules
- Verify `start` script in package.json

### API calls fail
- Check browser console for CORS errors
- Verify backend URL in environment variable
- Check Render backend logs

### Frontend shows blank page
- Ensure build completed successfully
- Check that `dist` folder is being published
- Verify Vite build output

---

## Free Tier Notes

Render free tier services:
- Spin down after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- 750 hours/month free

For always-on service, upgrade to paid plan.
