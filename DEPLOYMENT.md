# ALRIP Deployment Guide

## Production Deployment to Vercel

### Prerequisites

1. **Vercel Account** — Connected to your GitHub repository
2. **Environment Variables Set** in Vercel Project Settings:
   - `OPENAI_API_KEY` — Your OpenAI API key
   - `DATABASE_URL` — Neon PostgreSQL connection string
   - `BETTER_AUTH_SECRET` — Random string ≥32 characters

### Generate BETTER_AUTH_SECRET

```bash
openssl rand -base64 32
```

Copy the output and add it to Vercel as `BETTER_AUTH_SECRET`.

### Deploy to Vercel

**Option 1: Automatic Deploy (Recommended)**
1. Merge the feature branch to `main`:
   ```bash
   git checkout main
   git merge v0/gazifahim78-2416-7d8ed7d7
   git push origin main
   ```
2. Vercel will automatically detect the push and start deployment
3. Monitor deployment in your [Vercel Dashboard](https://vercel.com/dashboard)

**Option 2: Manual Deploy**
1. Go to your Vercel Project Settings
2. Ensure all environment variables are set
3. Trigger a manual deployment from the dashboard

### Verify Environment Variables

Before deploying, confirm all three variables are set:

```bash
# In Vercel Project Settings > Environment Variables
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<32+ char random string>
```

### Post-Deployment Checklist

- [ ] Production URL accessible
- [ ] Sign-in page loads without 500 errors
- [ ] Dashboard loads and shows forecast alerts
- [ ] "Analyze Now" button triggers AI analysis
- [ ] Balances and transactions persist after page reload
- [ ] Analysis history saves across sessions

### Troubleshooting

**500 Error on Sign-In/Auth Routes**
- Check `BETTER_AUTH_SECRET` is set and ≥32 characters
- Verify `DATABASE_URL` connection string is valid

**"API Key not configured" Error**
- Ensure `OPENAI_API_KEY` is set in Vercel environment
- Check the key has sufficient API quota

**Hydration Mismatch Warnings**
- These are expected during build (Better Auth warnings)
- The app runs correctly in production
- Monitor console for any actual runtime errors

### Rollback

If deployment fails:
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or manually redeploy previous version from Vercel dashboard
```

---

**Repository**: https://github.com/Fahim05022003/liquidity-risk-analysis  
**Feature Branch**: `v0/gazifahim78-2416-7d8ed7d7`  
**Status**: Production-ready, fully tested
