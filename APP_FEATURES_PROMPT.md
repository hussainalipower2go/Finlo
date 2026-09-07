# Finlo App — Features Prompt

**Use kese karein (Hinglish):** Neeche diya gaya prompt copy karo aur kisi bhi AI (ChatGPT, Gemini, Claude, ya opencode) mein paste kar do. AI aapko aap ki app ke tamam features ka pura walkthrough dega — easy language mein.

> Agar AI ko aap ke codebase tak access ho (jaise opencode/claude-code), to bhi yeh prompt kaam karega. Agar na ho, to ismein poori detail embedded hai, isliye phir bhi sahi jawab milega.

---

## Prompt (copy isse):

```
Mera ek personal finance app hai jiska naam "Finlo" hai — Next.js + TypeScript + Supabase
(PostgreSQL + Auth + Row Level Security) + Recharts + jsPDF + Google Gemini AI par bana hua
single-page dashboard web app hai. Mujhe apni app ke tamam features ka complete tour chahiye.

Meri app mein yeh exact cheezein hain — in sab ko detail mein samjhaao, friendly tone mein,
simple easy language mein, category-wise, koi cheez miss mat karna:

1) AUTH & ONBOARDING:
   - Landing page (app ka intro)
   - Signup, Login, Forgot Password, Reset Password
   - 5-step Onboarding wizard (profile, income, financial goals, safety buffer)
   - Supabase Auth (email/password), user-data isolation via RLS

2) MAIN DASHBOARD (7 tabs wala SPA):
   Tabs: Dashboard, Transactions, Upcoming, Budgets, Analytics, AI Assistant, Settings

3) DASHBOARD TAB:
   - Current Balance (selected currency mein)
   - Income this month / Expenses this month / % saved
   - Money Runway (kitne din tak paisa chalega)
   - Quick stat cards: Upcoming 7 days, Budgets on track, Income, Expenses
   - Income vs Expense chart (last months)
   - Upcoming payments list (recurring bills) + "Mark paid"
   - Recent transactions + Total expenses + category breakdown %

4) TRANSACTIONS TAB:
   - Search, type filter (income/expense), category filter chips
   - Sort (newest/oldest/amount)
   - Add/delete, table view (description, category, date, method, amount)

5) UPCOMING TAB:
   - Upcoming bills (recurring + upcoming payments)
   - Recurring expenses list, due dates
   - Mark paid, Add Recurring Expense modal (name, amount, frequency
     daily/weekly/bi-weekly/monthly/quarterly/yearly, category, next due date)

6) BUDGETS TAB:
   - Monthly budget overview ke stat cards
   - Har category ka budget card: spent vs limit, progress bar,
     over-limit par red, "X remaining" indicator

7) ANALYTICS TAB:
   - Stat cards (total, average, insights)
   - 6-month spending chart
   - Category-wise spending breakdown with percentages

8) AI ASSISTANT TAB:
   - Chat interface, context-aware financial advice
   - "Can I Afford It?" checker — amount daalo, current balance, after-purchase
     balance, recommendation
   - Financial snapshot (income, expenses, balance, savings)
   - Quick suggestion buttons

9) SETTINGS TAB:
   - Profile card + Edit Profile link
   - Currency selection (PKR, USD, AED, SAR, GBP, EUR, INR) + Save Changes
   - Dark/Light theme toggle
   - Notifications toggle
   - Data Export: CSV + PDF
   - Account delete + Sign out

10) ADD TRANSACTION MODAL (har jagah se):
    - Expense/Income toggle
    - Natural-language quick entry (jaise "lunch 500" type karo, wo
      amount/category/date samajh leta hai aur preview dikhata hai)
    - Amount, Date, Description, Category/Source, Payment Method (cash/card/UPI/bank)
    - RECEIPT SCANNING: "Scan bill" button → dropdown
        * "Upload bill" — photo/gallery se receipt upload
        * "Scan slip" — live camera (getUserMedia) se receipt scan
      Gemini AI vision receipt se amount, description, category, date nikaal kar
      form auto-fill kar deta hai

11) EXTRA FEATURES:
    - Time-based greeting (Good morning/afternoon/evening/night + emoji)
    - Header: date pill, theme toggle, notifications bell (badge + dropdown)
    - Notifications: overdue/due recurring bills, budget alerts (80%+ / over)
    - Multi-currency display poore app mein (Rs. / $ / € / £ / AED / SAR / ₹)
    - Liquid-glass gradient cards + frosted blur UI, dark & light mode
    - Edit opening balance (Add/Subtract)
    - "How Safe to Spend is calculated" info box
    - Mobile responsive: bottom navigation bar, hidden sidebar,
      chhoti screens par text ellipsis handling

12) TECH STACK:
    - Next.js (App Router), TypeScript (strict), Tailwind CSS
    - Supabase (Auth, PostgreSQL, RLS on all tables)
    - Recharts (charts), jsPDF (PDF export), Google Gemini (AI + receipt OCR)

Har tab/section ko khol kar explain karo: yeh kya karta hai, user kya kar sakta hai,
aur kyun useful hai. Ek end par 10-15 main features ki ek quick summary list bhi do.
```

---

## Bonus: Extra chhota prompt (agar bhai ko codebase wala AI mile toh)

```
Meri app "Finlo" ka code is folder mein hai (app/dashboard/page.tsx main SPA, lib/format.ts
currency helpers, app/api/extract-receipt/route.ts receipt OCR).
Mujhe is app ke saare features ki complete list do — yeh dekh ke codebase se verify karo.
```

---

*Last updated: September 6, 2026 — includes latest features (receipt camera scan,
multi-currency support, liquid-glass UI, notifications, time-based greeting).*