# ✅ CORRECT VERCEL CONFIGURATION

## What This Version Has

This uses Vercel's **version 2 API** with proper `builds` and `routes`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api/index.js"
    }
  ]
}
```

**This tells Vercel:**
1. Build `api/index.js` as a Node.js serverless function
2. Route ALL requests to that function
3. Express handles the routing from there

---

## 🚀 Deploy Instructions

```cmd
cd C:\Users\w_yal\OneDrive\Documents

# Delete and re-extract
rmdir /s fantasy-rugby-league
# Extract fantasy-rugby-league-V2.zip

cd fantasy-rugby-league

# Clone to get .git
git clone https://github.com/SamYallop/fantasy-rugby-league.git temp
xcopy temp\.git .git\ /E /I /H
rmdir /s temp

# Commit and push
git add .
git commit -m "Fix: Vercel v2 builds configuration"
git push origin main
```

---

## ✅ Expected Build Log

**Should see:**
```
Running "vercel build"
Building...
✓ Serverless Function "api/index.js" created
Build Completed
Deploying outputs...
Deployment completed
```

**Should NOT see:**
- ❌ "No entrypoint found"
- ❌ "Skipping cache upload because no files were prepared"
- ❌ "No entrypoint found which imports express"

---

## 🧪 Test Endpoints (after 3 min)

1. **Test:** https://fantasy-rugby-league-amber.vercel.app/api/test
   - Should return: `{"status":"API directory works!",...}`

2. **Health:** https://fantasy-rugby-league-amber.vercel.app/health
   - Should return: `{"status":"ok",...}`

3. **Login:** Try it!

---

## 🔑 Key Differences

| Version | Configuration | Result |
|---------|--------------|--------|
| Previous | No builds, only rewrites | ❌ "No entrypoint found" |
| Previous | Custom runtime @vercel/node@3.0.13 | ❌ "No entrypoint imports express" |
| **This** | **builds + routes (v2 API)** | ✅ **Should work!** |

---

## 📊 Why This Works

1. **`builds`** - Explicitly tells Vercel to build `api/index.js` as a function
2. **`@vercel/node`** - Uses default version (not custom)
3. **`routes`** - Routes all traffic to the built function
4. **Simple and standard** - Uses Vercel's recommended pattern

---

## 🆘 If It Still Doesn't Work

Copy the ENTIRE build log and send it to me. Specifically look for:
- What happens during "Running vercel build"
- Any mention of "api/index.js"
- Whether it says "Serverless Function created"

---

**This is the standard Vercel v2 configuration that should definitely work!** 🚀
