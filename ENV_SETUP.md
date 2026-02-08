# Environment Variables Configuration

## 🔐 Required for Vercel Deployment

Copy these to Vercel Dashboard → Your Project → Settings → Environment Variables

### 1. SUPABASE_URL
```
Value: https://YOUR_PROJECT_REF.supabase.co
Where: Supabase Dashboard → Settings → API → Project URL
```

### 2. SUPABASE_KEY
```
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ANON_KEY
Where: Supabase Dashboard → Settings → API → Project API keys → anon public
```

### 3. SUPABASE_SERVICE_KEY
```
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_SERVICE_KEY
Where: Supabase Dashboard → Settings → API → Project API keys → service_role (click Reveal)
⚠️ KEEP THIS SECRET! Never commit to git!
```

### 4. JWT_SECRET
```
Value: <64-character random string>
How to generate:
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📝 For Each Variable in Vercel:

1. Click "Add New" under Environment Variables
2. Enter the Name (exactly as shown above)
3. Enter the Value (from your Supabase dashboard)
4. Select: ✅ Production ✅ Preview ✅ Development
5. Click "Save"

---

## 🐙 GitHub Secrets (for automated scraper)

Also add these in GitHub:
Repository → Settings → Secrets and variables → Actions → New repository secret

- `SUPABASE_URL` (same as Vercel)
- `SUPABASE_SERVICE_KEY` (same as Vercel)

---

## ✅ Verification Checklist

After adding all variables:

- [ ] All 4 variables added in Vercel
- [ ] Each variable is enabled for Production, Preview, AND Development
- [ ] Values are correct (no extra spaces)
- [ ] Redeployed after adding variables (Vercel → Deployments → ••• → Redeploy)
- [ ] Waited 2-3 minutes for deployment
- [ ] Tested `/health` endpoint returns `{"status":"ok"}`

---

## 🔍 How to Find Your Values

### Supabase URL
1. Go to https://supabase.com/dashboard
2. Open your project
3. Settings (gear icon) → API
4. Copy "Project URL"

### Supabase Keys
1. Same location as above (Settings → API)
2. Under "Project API keys"
3. Copy "anon public" for SUPABASE_KEY
4. Click "Reveal" and copy "service_role" for SUPABASE_SERVICE_KEY

### JWT Secret
Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the entire output string.

---

## ⚠️ Common Mistakes

❌ **Wrong:** Copying "API Key" instead of "Project URL"
✅ **Right:** SUPABASE_URL should start with `https://` and end with `.supabase.co`

❌ **Wrong:** Not selecting all environments (Production, Preview, Development)
✅ **Right:** Check all 3 boxes for every variable

❌ **Wrong:** Adding quotes around values in Vercel
✅ **Right:** Paste values directly without quotes

❌ **Wrong:** Not redeploying after adding variables
✅ **Right:** Redeploy after adding/changing variables

---

## 🆘 Still Not Working?

1. **Check Vercel Logs:**
   - Dashboard → Your Project → Deployments → Latest → Logs
   - Look for red error messages

2. **Verify Variables Are Set:**
   - Settings → Environment Variables
   - Each should show: Production | Preview | Development

3. **Test Connection:**
   - Visit: `https://your-project.vercel.app/health`
   - Should return: `{"status":"ok","timestamp":"...","environment":"production"}`
   - If 500 error: Variables not set correctly
   - If 404 error: Deployment issue (check vercel.json exists)

---

**Once all variables are set correctly, your backend will work perfectly!** ✅
