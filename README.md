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
- **AI**: OpenAI API (configurable)

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
npm run dev        # Development server
npm run build      # Production build
npm start          # Production server
npm run lint       # ESLint
npm run typecheck  # Type checking
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
