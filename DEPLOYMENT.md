# 🏉 Fantasy Rugby League - Deployment Guide

## 🚀 Quick Start

This project is ready to deploy! All files are configured correctly.

---

## 📋 Prerequisites

Before deploying, you need:
1. **Supabase Account** - https://supabase.com
2. **Vercel Account** - https://vercel.com
3. **GitHub Account** - https://github.com

---

## 🔐 Step 1: Set Up Supabase

### 1. Create Supabase Project
- Go to https://supabase.com/dashboard
- Click "New Project"
- Fill in project details

### 2. Get Your API Credentials
- Go to: Settings → API
- **Copy these 3 values** (you'll need them in Step 3):
  - **Project URL** (looks like: `https://abcdefg.supabase.co`)
  - **anon/public key** (under "Project API keys")
  - **service_role key** (click "Reveal" under "Project API keys")

### 3. Set Up Database Schema
Run the SQL from `database-schema.sql` (if you have one) in:
- Supabase Dashboard → SQL Editor → New Query
- Or use the existing schema if already set up

---

## ⚙️ Step 2: Deploy to Vercel

### Option A: Deploy from GitHub (Recommended)

1. **Push to GitHub:**
   ```cmd
   cd C:\Users\w_yal\OneDrive\Documents\fantasy-rugby-league
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your `fantasy-rugby-league` repository
   - Click "Import"

3. **Configure Project:**
   - Framework Preset: **Other**
   - Root Directory: `./` (leave blank)
   - Build Command: (leave blank)
   - Output Directory: (leave blank)
   - Install Command: `npm install`

4. **Add Environment Variables:**
   Click "Environment Variables" and add these 4 variables:

   | Name | Value | Source |
   |------|-------|--------|
   | `SUPABASE_URL` | Your Project URL | Supabase Settings → API |
   | `SUPABASE_KEY` | Your anon key | Supabase Settings → API |
   | `SUPABASE_SERVICE_KEY` | Your service_role key | Supabase Settings → API (click Reveal) |
   | `JWT_SECRET` | Random 64-char string | Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |

   **IMPORTANT:** Select **Production**, **Preview**, AND **Development** for each variable!

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your backend will be live at: `https://your-project.vercel.app`

### Option B: Deploy via Vercel CLI

```cmd
npm install -g vercel
cd C:\Users\w_yal\OneDrive\Documents\fantasy-rugby-league
vercel
```

Follow the prompts and add environment variables when asked.

---

## ✅ Step 3: Verify Deployment

### Test Backend Endpoints:

1. **Health Check:**
   ```
   https://your-project.vercel.app/health
   ```
   Expected: `{"status":"ok",...}`

2. **API Root:**
   ```
   https://your-project.vercel.app/
   ```
   Expected: `{"message":"Fantasy Rugby League API",...}`

3. **Players Endpoint:**
   ```
   https://your-project.vercel.app/api/players?pageSize=5
   ```
   Expected: Player data array

If all 3 work, your backend is deployed successfully! ✅

---

## 🎨 Step 4: Deploy Frontend (Optional)

If you want to deploy the frontend separately:

1. **Update Frontend API URL:**
   - In `frontend/src/services/api.js`, line 3:
   ```javascript
   const API_URL = 'https://your-backend.vercel.app';
   ```

2. **Deploy Frontend to Vercel:**
   - Go to Vercel Dashboard
   - Click "Add New" → "Project"
   - Import the same repository
   - Set Root Directory: `frontend`
   - Framework: React
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Deploy!

---

## 🔧 Troubleshooting

### 500 Internal Server Error
**Problem:** Backend is crashing
**Solution:** Check environment variables are set correctly in Vercel

### 404 Not Found
**Problem:** Vercel can't find the entry point
**Solution:** Make sure `api/index.js` exists and `vercel.json` is in root

### CORS Error
**Problem:** Frontend can't connect to backend
**Solution:** Backend now allows all Vercel domains - redeploy backend

### Login Fails / No Data in Admin Panel
**Problem:** Environment variables not set or database not configured
**Solution:** 
1. Check all 4 environment variables are set in Vercel
2. Verify Supabase credentials are correct
3. Check Vercel logs: Dashboard → Your Project → Logs

### Check Logs
```
Vercel Dashboard → Your Project → Deployments → Latest → Logs
```

---

## 📁 Project Structure

```
fantasy-rugby-league/
├── api/
│   └── index.js              ✅ Vercel serverless entry point
├── backend/
│   ├── config/
│   │   ├── constants.js
│   │   └── database.js       ✅ Supabase configuration
│   ├── middleware/
│   │   ├── admin.js
│   │   └── auth.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── gameweeks.js
│   │   ├── leagues.js
│   │   ├── players.js
│   │   ├── teams.js          ✅ Fixed import
│   │   └── transfers.js
│   ├── utils/
│   ├── package.json
│   └── server.js             ✅ Updated CORS
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Admin.jsx     ✅ Fixed function names
│   │   │   └── MyTeam.jsx    ✅ Added player points
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.jsx
│   └── package.json
├── scraper/
│   ├── scrape_and_upload.js
│   ├── scrape_and_upload_automated.js
│   └── package.json
├── .github/
│   └── workflows/
│       └── scraper.yml       ✅ Weekly scraper
├── .gitignore
├── package.json              ✅ Root dependencies
├── vercel.json               ✅ Vercel configuration
└── README.md
```

---

## 🎯 What's Fixed in This Version

✅ **Backend:**
- Fixed `teams.js` import (database.js instead of supabase.js)
- Updated CORS to allow all Vercel preview domains
- Added better error handling in database.js
- Configured for Vercel serverless deployment

✅ **Frontend:**
- Fixed Admin panel API function names
- Added player points display in MyTeam
- All API endpoints correctly mapped

✅ **Deployment:**
- Added `api/index.js` for Vercel
- Added `vercel.json` configuration
- Added root `package.json`

✅ **Features:**
- Team builder with position-based selection
- Player statistics and comparison
- Admin panel (users, players, scoring, gameweeks)
- Weekly automated scraper via GitHub Actions

---

## 🔑 Required Environment Variables

Make sure these are set in Vercel:

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` | ✅ Yes | Database connection |
| `SUPABASE_KEY` | ✅ Yes | Database anon key |
| `SUPABASE_SERVICE_KEY` | ✅ Yes | Database admin access |
| `JWT_SECRET` | ✅ Yes | Authentication tokens |

---

## 📚 Next Steps After Deployment

1. **Create Admin User:**
   - Sign up at: `https://your-project.vercel.app/signup`
   - First user automatically becomes admin

2. **Upload Initial Players:**
   ```cmd
   cd scraper
   npm install
   node upload_initial_players.js
   ```

3. **Set Up Scoring System:**
   - Login to admin panel
   - Go to "Scoring" tab
   - Configure point values

4. **Create First Gameweek:**
   - Admin panel → "Gameweeks" tab
   - Click "Create Gameweek"
   - Enter Round 1 details

5. **Enable Weekly Scraper:**
   - Add GitHub secrets (see below)
   - Runs every Monday 11 PM UK time

---

## 🤖 GitHub Actions Setup (Weekly Scraper)

Add these secrets in GitHub:
- Go to: Repository → Settings → Secrets and variables → Actions
- Click "New repository secret"

Add:
- `SUPABASE_URL` - Same as Vercel
- `SUPABASE_SERVICE_KEY` - Same as Vercel

The scraper will run automatically every Monday at 11 PM UK time.

---

## 🆘 Support

If you encounter issues:

1. Check Vercel logs
2. Verify all environment variables are set
3. Test each endpoint individually
4. Check browser console for frontend errors (F12)

---

## ✨ Features

- **Team Management:** Build your squad with position-based selection
- **Live Scoring:** Automatic point calculation from player stats
- **Transfers:** Make transfers within your budget
- **Leagues:** Create private leagues with friends
- **Admin Panel:** Manage users, players, scoring, and gameweeks
- **Auto Scraper:** Weekly data updates from Super League website
- **Mobile Responsive:** Works on all devices

---

**Your project is ready to deploy! Follow the steps above and you'll be live in minutes.** 🚀
