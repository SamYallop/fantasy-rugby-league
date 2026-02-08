# ✅ SIMPLE FIX - No Custom Runtime

## The Problem

Vercel was looking for Express in the wrong place when we specified a custom runtime.

## The Solution

**Remove custom runtime configuration** - just use Vercel's default auto-detection with simple rewrites.

---

## 🚀 Deploy This Version

```cmd
cd C:\Users\w_yal\OneDrive\Documents\
rmdir /s fantasy-rugby-league

# Extract fantasy-rugby-league-SIMPLE.zip

cd fantasy-rugby-league
git add .
git commit -m "Fix: Use default Vercel runtime"
git push origin main
```

---

## ✅ What to Look For

### In Build Logs:

**Should NOT see:**
```
Installing Builder: @vercel/node@3.0.13 ❌
No entrypoint found which imports express ❌
```

**Should see:**
```
Build Completed ✅
Deploying outputs... ✅
Deployment completed ✅
```

### Test URLs (after 3 min):

1. **Test:** https://fantasy-rugby-league-amber.vercel.app/api/test
   - Should return: `{"test":"working",...}`

2. **Health:** https://fantasy-rugby-league-amber.vercel.app/health
   - Should return: `{"status":"ok",...}`

3. **Try login!**

---

## 📁 Files Changed

### `vercel.json` (simplified)
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index"
    }
  ]
}
```

**What this does:**
- Routes ALL requests to `/api/index`
- Uses Vercel's default Node.js runtime (no custom builder)
- Express handles the routing from there

### `api/index.js` (unchanged)
```javascript
const app = require('../backend/server');
module.exports = app;
```

---

## 🎯 Why This Should Work

**Before:**
- Specified custom @vercel/node runtime
- Vercel tried to find Express in root
- Couldn't find it → Error

**Now:**
- No custom runtime specified
- Vercel uses default behavior
- Auto-detects Node.js in `/api` directory
- Routes to Express properly

---

## 🔍 If Still Doesn't Work

Copy the COMPLETE build log and send it to me. Look for:
- Any red error messages
- What files are being deployed
- Whether functions are created

Then I can see exactly what's happening.

---

**This is the simplest possible configuration - it should just work!** ✅
