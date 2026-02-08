# 🔧 CRASH DIAGNOSIS VERSION

## 🎉 Good News: Function is Deploying!

You're no longer getting 404 - the function exists! But it's crashing with 500 error.

---

## 🔍 This Version Has Diagnostics

### New `/debug` Endpoint

This version adds a `/debug` endpoint that shows which environment variables are set:

```
https://fantasy-rugby-league-amber.vercel.app/debug
```

**Will return:**
```json
{
  "env_vars": {
    "SUPABASE_URL": true/false,
    "SUPABASE_KEY": true/false,
    "SUPABASE_SERVICE_KEY": true/false,
    "JWT_SECRET": true/false,
    "NODE_ENV": "production"
  },
  "timestamp": "..."
}
```

### Improved Error Handling

- Database won't crash the app if env vars missing
- Better error logging
- `/health` endpoint always works

---

## 🚀 Deploy This Version

```cmd
cd C:\Users\w_yal\OneDrive\Documents\fantasy-rugby-league

git add .
git commit -m "Fix: Add diagnostics and crash prevention"
git push origin main
```

---

## ✅ After Deployment (3 minutes)

### Test 1: Health Check
```
https://fantasy-rugby-league-amber.vercel.app/health
```
**Should return:** `{"status":"ok",...}` (even if database isn't working)

### Test 2: Debug Endpoint
```
https://fantasy-rugby-league-amber.vercel.app/debug
```
**Should show:** Which env vars are set (true/false)

### Test 3: Check Vercel Function Logs

Go to: Vercel Dashboard → Deployment → Functions → api/index.js

Look for error messages like:
- "SUPABASE_URL missing"
- "Cannot read property X of undefined"
- Database connection errors

---

## 🔧 Common Issues & Fixes

### Issue 1: All env_vars show false in /debug

**Problem:** Environment variables aren't set for this deployment

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Make sure all 4 are set:
   - SUPABASE_URL
   - SUPABASE_KEY
   - SUPABASE_SERVICE_KEY
   - JWT_SECRET
3. For EACH variable, verify:
   - ✅ Production is checked
   - ✅ Preview is checked
   - ✅ Development is checked
4. After verifying, go to Deployments → Click ••• → Redeploy

### Issue 2: /health works but /api/auth/login doesn't

**Problem:** Database is configured but routes aren't working

**Fix:** This is actually a success! It means the function is running. Check browser console for actual error.

### Issue 3: Still getting 500 on /health

**Problem:** Something else is crashing before routes load

**Solution:** Check Vercel function logs - tell me the exact error message

---

## 📊 Expected Results

| Endpoint | Expected | Meaning |
|----------|----------|---------|
| `/health` | `{"status":"ok"}` | ✅ Function is running |
| `/debug` | All `true` | ✅ Env vars are set |
| `/api/test` | JSON response | ✅ Routing works |
| `/api/auth/login` | Login response or error | ✅ Full app works |

---

## 🎯 Next Steps

1. **Deploy this version**
2. **Test `/debug`** - Copy the response
3. **Test `/health`** - Does it work now?
4. **Check function logs** - Copy any error messages
5. **Report back** - Tell me what you see!

Then I can give you the exact fix based on what the diagnostics show.

---

**We're close! The function is deploying, we just need to fix the crash!** 🚀
