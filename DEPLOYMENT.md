# Finlo V1 - Deployment Guide

## Overview
This guide covers deploying Finlo V1 to production on Vercel with Supabase as the backend.

---

## Phase 1: Pre-Deployment Setup

### 1.1 Environment Configuration

Create `.env.production` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional: AI API configuration
AI_API_KEY=your-api-key
AI_MODEL=gpt-4-turbo
```

### 1.2 Supabase Database Verification

1. **Run schema.sql** in Supabase SQL Editor:
   ```bash
   # Copy entire schema.sql content
   # Paste into Supabase Dashboard > SQL Editor > New Query
   # Execute all statements
   ```

2. **Verify RLS Policies**:
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'public';
   ```

3. **Enable RLS on all tables**:
   ```bash
   # In Supabase Dashboard > Authentication > Policies
   # Verify all 8 tables have RLS enabled (lock icon shown)
   ```

4. **Load Test Data** (optional):
   ```bash
   # Edit test-data.sql and replace {USER_ID} with your test user ID
   # Execute in Supabase SQL Editor
   ```

---

## Phase 2: Local Testing (Before Deployment)

### 2.1 Pre-Deployment Build Check

```bash
# Clean previous builds
rm -rf .next
rm -rf out

# Run full build
npm run build

# Check for errors
npm run lint
```

### 2.2 Test Production Build Locally

```bash
# Build production bundle
npm run build

# Start production server
npm start

# Visit http://localhost:3000 and test:
# ✓ Landing page loads
# ✓ Sign up works
# ✓ Login works
# ✓ Dashboard loads
# ✓ Forms submit correctly
# ✓ Data persists in Supabase
```

### 2.3 Security Checklist

- [ ] No API keys hardcoded in code
- [ ] All env vars in `.env.production`
- [ ] RLS policies enabled on all tables
- [ ] CORS origins configured in Supabase
- [ ] No console.logs with sensitive data
- [ ] All pages have proper auth guards

---

## Phase 3: Deploy to Vercel

### 3.1 Connect Repository

1. **Push code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: Finlo V1 complete - all phases ready"
   git remote add origin https://github.com/your-username/finlo.git
   git push -u origin main
   ```

2. **Create Vercel Account**:
   - Visit https://vercel.com
   - Sign up with GitHub
   - Authorize Vercel to access your repos

3. **Deploy Project**:
   - Click "Add New Project"
   - Select your GitHub repository
   - Click "Import"

### 3.2 Configure Environment Variables

In Vercel Dashboard:

1. **Project Settings > Environment Variables**
2. Add for all environments (Production, Preview, Development):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

3. **Save and Redeploy**

### 3.3 Custom Domain (Optional)

1. **Project Settings > Domains**
2. Add your domain (e.g., finlo.example.com)
3. Update DNS records at your registrar:
   ```
   Name: finlo
   Type: CNAME
   Value: cname.vercel.sh
   ```

---

## Phase 4: Post-Deployment Verification

### 4.1 Health Checks

```bash
# Test production URL
curl https://your-domain.com

# Should return HTML with "Finlo" in title
# HTTP 200 status
```

### 4.2 Functional Testing in Production

1. **Landing Page**:
   - [ ] Hero section displays
   - [ ] Feature cards visible
   - [ ] Sign In/Get Started buttons work

2. **Authentication**:
   - [ ] Sign up creates new user
   - [ ] Login works with correct credentials
   - [ ] Password reset email sends
   - [ ] Session persists on page refresh

3. **Dashboard**:
   - [ ] All 4 metrics display
   - [ ] Recent transactions show
   - [ ] Navigation works

4. **Features**:
   - [ ] Add expense form submits
   - [ ] Add income form submits
   - [ ] Transactions list loads
   - [ ] Budgets page works
   - [ ] Analytics display data
   - [ ] Affordability checker works
   - [ ] AI Assistant responds
   - [ ] Settings save preferences

### 4.3 Performance Monitoring

1. **Vercel Analytics**:
   - Dashboard > Analytics
   - Monitor response times
   - Track deployment frequency

2. **Core Web Vitals**:
   - LCP (Largest Contentful Paint): < 2.5s
   - FID (First Input Delay): < 100ms
   - CLS (Cumulative Layout Shift): < 0.1

3. **Bundle Size**:
   ```bash
   npm run build -- --analyze
   # Check .next/static/chunks for optimizations
   ```

---

## Phase 5: Monitoring & Maintenance

### 5.1 Error Tracking Setup

Option A: **Sentry Integration**

```bash
npm install @sentry/nextjs
```

Update `next.config.ts`:
```typescript
import { withSentryConfig } from "@sentry/nextjs";

const config = {
  // existing config
};

export default withSentryConfig(config, {
  org: "your-org",
  project: "finlo",
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
```

Option B: **Vercel Error Reporting**
- Built-in, automatically enabled
- Visit Vercel Dashboard > Monitoring > Events

### 5.2 Database Backups

**Supabase Automatic Backups**:
- Free tier: 7-day backups
- Pro tier: 30-day backups
- Configure in Supabase Dashboard > Backups

**Manual Backup**:
```bash
# Export database
pg_dump postgresql://user:password@host/database > backup.sql
```

### 5.3 Monitoring Checklist

Daily:
- [ ] Check error tracking (Sentry/Vercel)
- [ ] Review user count growth
- [ ] Monitor Supabase connection count

Weekly:
- [ ] Review performance metrics
- [ ] Check storage usage
- [ ] Verify backups completed

Monthly:
- [ ] Update dependencies
- [ ] Security audit
- [ ] Cost review

---

## Phase 6: CI/CD Pipeline

### 6.1 Automated Testing

Create `.github/workflows/test.yml`:

```yaml
name: Test & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type Check
        run: npx tsc --noEmit
      
      - name: Build
        run: npm run build
      
      - name: Deploy (if main branch)
        if: github.ref == 'refs/heads/main'
        run: |
          # Vercel auto-deploys on push to main
          echo "Deployment triggered by Vercel webhook"
```

### 6.2 Pull Request Checks

- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Build succeeds
- [ ] Performance impact < 10%

---

## Phase 7: Scaling & Optimization

### 7.1 Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX idx_income_user_date ON income(user_id, date DESC);
CREATE INDEX idx_budgets_user_month ON budgets(user_id, month);

-- Monitor query performance
EXPLAIN ANALYZE SELECT * FROM expenses WHERE user_id = 'xxx' AND date > NOW() - interval '30 days';
```

### 7.2 Edge Caching

Update `next.config.ts`:

```typescript
const config = {
  headers: async () => {
    return [
      {
        source: '/api/data/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=120'
          }
        ]
      }
    ]
  }
}
```

### 7.3 Image Optimization

All images use Next.js `Image` component:
- [x] Automatic format conversion
- [x] Responsive sizing
- [x] Lazy loading
- [x] WebP support

---

## Phase 8: Troubleshooting

### Common Issues

**Issue**: "Authentication Failed"
```
Solution:
1. Verify NEXT_PUBLIC_SUPABASE_URL is correct
2. Check NEXT_PUBLIC_SUPABASE_ANON_KEY is active
3. Enable Email provider in Supabase
4. Check email templates configured
```

**Issue**: "Database Connection Refused"
```
Solution:
1. Verify Supabase project is active
2. Check IP whitelist in Supabase settings
3. Verify RLS policies aren't blocking queries
4. Check connection limit not exceeded
```

**Issue**: "Build Fails - TypeScript Error"
```
Solution:
1. Run `npm run build` locally first
2. Check .env.production is set
3. Verify all imports are correct
4. Run `npm run lint` to find issues
```

---

## Phase 9: Rollback Procedures

### If Deployment Breaks Production

**Vercel Auto-Rollback**:
```bash
# Vercel Dashboard > Deployments > Previous working version
# Click "Redeploy" button
# Site reverts in < 1 minute
```

**Manual Database Restore**:
```bash
# Supabase Dashboard > Backups > Restore Point
# Select timestamp before deployment
# Click "Restore" and confirm
```

---

## Phase 10: Cost Optimization

### Estimated Monthly Costs

**Vercel (Pro Plan)**:
- Base: $20
- Serverless: $0 (included)
- Database: Supabase covers

**Supabase (Pro Plan)**:
- Base: $25
- Auth: Included
- Database: 2GB
- Storage: 100GB

**Total**: ~$50/month for production

**Ways to Reduce Costs**:
- [ ] Move to Hobby tier if low traffic
- [ ] Archive old transactions
- [ ] Optimize database queries
- [ ] Use edge caching more aggressively

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests pass locally
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] TypeScript strict mode OK
- [ ] .env.production configured
- [ ] Database schema deployed
- [ ] RLS policies verified
- [ ] Supabase backups enabled

### Deployment
- [ ] Code pushed to main branch
- [ ] Vercel deployment initiated
- [ ] Environment variables set
- [ ] Custom domain configured
- [ ] DNS records updated

### Post-Deployment
- [ ] Production URL accessible
- [ ] Auth flow tested
- [ ] Data persists correctly
- [ ] Email verification works
- [ ] Error tracking active
- [ ] Performance metrics good

---

## Support & Documentation

- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs/

---

## Emergency Contacts

- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- GitHub Issues: Report bugs in your repository

---

**Last Updated**: September 2, 2026  
**Status**: ✅ Ready for Production Deployment
