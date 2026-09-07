# Finlo - Personal Cash Flow Planning App

## Overview

Finlo is a production-quality Version 1 personal cash-flow planning app that helps users answer the fundamental question:

> **Will my money last until my next income arrives?**

The app provides transparency and clarity on cash flow by tracking current balance, upcoming commitments, expected income, and calculating how much users can safely spend today.

## Features (Phase 1 - Foundation)

### ✅ Completed (Phase 1)
- Authentication (Sign Up, Login, Forgot Password, Reset Password)
- Database schema with Row Level Security (RLS)
- Design system with glass morphism components
- Reusable UI components (Button, Card, Input, Container)
- Financial calculation utilities
- Placeholder dashboard with navigation

### 🚀 Upcoming Phases
- Phase 2: Design System & UI Components Enhancement
- Phase 3: Dashboard & Core Metrics (Safe to Spend, Money Runway)
- Phase 4: Transaction Management (CRUD operations)
- Phase 5: Recurring Expenses & Budgets
- Phase 6: Analytics & Insights
- Phase 7: AI Assistant
- Phase 8: Natural Language Entry
- Phase 9: Onboarding Flow
- Phase 10: Settings & Preferences
- Phase 11: Testing, Security, & QA

## Tech Stack

- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui, Lucide Icons
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Charts**: Recharts
- **Validation**: Zod
- **AI**: Google Gemini (server-side, via secure API routes)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (free tier available at https://supabase.com)

### Local Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase**
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Run `schema.sql` in Supabase SQL editor
   - Enable Email Auth in Authentication settings

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Database Schema

- `user_preferences` - User settings
- `income` - Income records
- `expenses` - Expense records
- `transactions` - All transactions
- `recurring_expenses` - Recurring bills
- `budgets` - Monthly budgets
- `ai_conversations` - AI history
- `ai_messages` - AI messages

All tables use Row Level Security for user isolation.

## Development Commands

```bash
npm install       # Install dependencies
npm run dev       # Development server (http://localhost:3000)
npm run build     # Production build
npm start         # Production server (after build)
npm run lint      # ESLint
npm run typecheck # TypeScript type checking
npm test          # Unit tests (vitest)
```

---

# Deploy Finlo on Vercel

Finlo is a **Next.js 16 (App Router) + TypeScript** application that must run on a
Node.js server (it uses API routes and server-side auth). It deploys to Vercel as a
standard Next.js project — **no static export, no `vercel.json` required**.

## Step 1 — Push the project to GitHub

The repository is already at <https://github.com/hussainalipower2go/Finlo>.

```bash
git init
git add -A
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/hussainalipower2go/Finlo.git
git push -u origin main
```

## Step 2 — Create / log in to Vercel

Go to <https://vercel.com> and create an account (or log in).

## Step 3 — Import the GitHub repository

1. Click **Add New → Project**.
2. Choose **Finlo** from your GitHub repositories.
3. Vercel auto-detects **Next.js** — leave the default build settings:
   - Build command: `npm run build`
   - Output directory: `.next` (automatic)
4. Add a **root directory** only if you imported a monorepo (not needed here).

## Step 4 — Configure Environment Variables

Add these in **Settings → Environment Variables** (Production + Preview):

| Variable | Required | Browser-safe | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | Supabase project URL (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ❌ | Supabase service-role key — **server only**, never exposed |
| `AI_API_KEY` | ✅ | ❌ | Google Gemini API key (AI assistant + receipt scanning) |
| `NEXT_PUBLIC_APP_URL` | ✅ | ✅ | Your production URL, e.g. `https://finlo.vercel.app` |
| `AI_MODEL` | ⬜ | ❌ | Optional Gemini model override (default `gemini-flash-lite-latest`) |
| `NEXT_PUBLIC_DEFAULT_CURRENCY` | ⬜ | ✅ | Optional default currency (e.g. `PKR`) |

> **Security:** never put the service-role key or Gemini key in a `NEXT_PUBLIC_` variable.
> Only public values may be bundled to the browser.

## Step 5 — Deploy

Click **Deploy**. Vercel runs `npm install` → `npm run lint` → `npm run typecheck` → `npm run build`
and serves the production app.

## Step 6 — Configure Supabase production URLs

Supabase needs to know your production origin for auth redirects (email confirmation,
password reset links):

1. Open the [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication → URL Configuration**.
3. **Site URL**: `https://YOUR-PROJECT.vercel.app`
4. **Redirect URLs**: add `https://YOUR-PROJECT.vercel.app/**`
5. **Verify Email** / **Password Reset** templates use these URLs automatically.
6. If you add a custom domain later:
   - **Site URL** → `https://your-custom-domain.com`
   - **Redirect URLs** → add `https://your-custom-domain.com/**` (keep the Vercel one too)

> The **same Supabase project** is used by the web app and the future Android
> (Capacitor) app — one database, one set of user accounts, one dataset.

## Step 7 — Apply database migrations

Run the SQL migrations against your Supabase database (SQL Editor), in order:

- `supabase/migrations/20260906000000_sms_transaction_import.sql` — SMS import tables
- `supabase/migrations/20260907000000_admin_dashboard.sql` — admin dashboard tables
  (profiles role/status, feature flags, system errors, feedback, audit logs)

The admin dashboard and AI feature flags only light up after these are applied.

## Step 8 — Test production application

- Signup, login, logout, password reset, session persistence
- Transactions (add/edit/delete, debit/credit), budgets, upcoming, analytics
- AI Assistant, "Can I Afford It?", receipt scanning
- Settings (currency, theme, CSV/PDF export)
- Admin dashboard (`/admin`) — log in as a user with an `ADMIN` + `ACTIVE` profile row

## Notes

- **File uploads:** receipt scanning sends the image to the AI API in-memory — nothing is
  stored on the Vercel filesystem. No object storage is required.
- **SMS import:** Android-only (native companion app). The web app shows a graceful
  fallback message and the parser preview still works.
- **Android (Capacitor):** the `android/` folder is the native wrapper, kept for future
  mobile builds. The web deployment does not depend on it. See `capacitor.config.ts`.
- The Capacitor Android app loads this deployed URL in a WebView — set
  `FINLO_APP_URL=https://YOUR-PROJECT.vercel.app` before `npm run mobile:sync` when
  building a mobile APK.
