# 🔍 LOGIN DIAGNOSTIC VERSION

## 🎉 Good News!

Your backend is working:
- ✅ `/health` returns `{"status":"ok"}`
- ✅ `/` returns API info
- ❌ Login endpoint returning 500 error

The login endpoint is crashing - let's find out why!

---

## 🚀 Deploy This Version

```cmd
cd C:\Users\w_yal\OneDrive\Documents\fantasy-rugby-league

git add .
git commit -m "Add diagnostic logging to login"
git push origin main
```

---

## ✅ After Deployment (3 minutes)

### Step 1: Check Environment Variables

Visit:
```
https://fantasy-rugby-league-amber.vercel.app/debug/env
```

**Should show:**
```json
{
  "env_vars": {
    "SUPABASE_URL": true,
    "SUPABASE_KEY": true,
    "SUPABASE_SERVICE_KEY": true,
    "JWT_SECRET": true,
    "NODE_ENV": "production"
  },
  "urls": {
    "SUPABASE_URL": "https://..."
  }
}
```

**If any show `false`**, that's the problem!

### Step 2: Check Login Logs

1. Go to Vercel Dashboard
2. Click latest deployment
3. Click "Functions" → "api/index.js"
4. Try to login again
5. **Look at the logs** - they now show detailed error messages

The logs will show:
- "Login attempt for username: Admin"
- "Querying database for user: Admin"
- Either success or specific error

---

## 🔧 Common Issues & Fixes

### Issue 1: JWT_SECRET shows `false`

**Problem:** JWT_SECRET environment variable not set

**Fix:**
1. Vercel Dashboard → Settings → Environment Variables
2. Add `JWT_SECRET`
3. Value: Run this in terminal:
   ```
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
4. Select: Production, Preview, Development
5. Save and redeploy

### Issue 2: SUPABASE vars show `false`

**Problem:** Database credentials not set

**Fix:**
1. Go to Supabase Dashboard → Settings → API
2. Copy the values
3. Add to Vercel environment variables
4. Redeploy

### Issue 3: All show `true` but still crashes

**Problem:** Something else in the code

**Solution:** Look at the function logs - they'll show the exact error now

---

## 📊 What the Logs Will Tell Us

The enhanced logging shows:
- ✅ "Login attempt for username: X" - Request received
- ✅ "Querying database for user: X" - About to query DB
- ✅ "User found, verifying password" - DB query worked
- ✅ "Password valid, generating token" - Password check passed
- ✅ "Login successful for user: X" - Everything worked!

OR the specific error:
- ❌ "FATAL: JWT_SECRET is not set!"
- ❌ "FATAL: Database not configured!"
- ❌ "Database error: [details]"
- ❌ "User not found: X"
- ❌ "Invalid password for user: X"

---

## 🎯 Next Steps

1. **Deploy this version**
2. **Check `/debug/env`** - Copy the response
3. **Try to login**
4. **Check function logs** - Screenshot or copy the log messages
5. **Tell me what you see!**

Then I can give you the exact fix!

---

## 🔐 Important Note

The `/debug/env` endpoint shows which env vars are set (true/false) but NOT the actual values - this is safe and secure.

After we fix the issue, we can remove this diagnostic endpoint if you want.

---

**Deploy this and tell me what `/debug/env` shows and what the login logs say!** 🎯
