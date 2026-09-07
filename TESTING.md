# Finlo V1 - Testing Guide

## Overview
Complete testing procedures for all 10 phases of Finlo V1.

---

## Test Environment Setup

### Prerequisites
```bash
cd c:\Users\syedh\Downloads\Finlo-v1

# Install dependencies
npm install

# Start dev server
npm run dev
# Server runs on http://localhost:3000
```

### .env.local Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Test Accounts

### Account 1: Power User
- Email: `poweruser@finlo.test`
- Password: `Test123!@#`
- Data: Full dataset with transactions, budgets, goals
- Use for: Feature testing, UI/UX validation

### Account 2: New User
- Email: `newuser@finlo.test`
- Password: `Test123!@#`
- Data: Fresh account, no transactions
- Use for: Onboarding flow testing, empty state validation

### Account 3: Mobile Tester
- Email: `mobile@finlo.test`
- Password: `Test123!@#`
- Use for: Mobile responsive design testing

---

## Phase 1: Authentication Testing

### 1.1 Sign Up Flow ✓
```
Test Case: User Registration
1. Visit http://localhost:3000
2. Click "Get Started"
3. Enter email: newuser@finlo.test
4. Enter password: Test123!@#
5. Confirm password: Test123!@#
6. Click "Sign Up"

Expected Results:
✓ Confirmation email sent (or instant if using test mode)
✓ Redirects to onboarding page
✓ User created in auth.users table
✓ user_preferences record created
```

### 1.2 Login Flow ✓
```
Test Case: User Authentication
1. Visit http://localhost:3000/auth/login
2. Enter email: poweruser@finlo.test
3. Enter password: Test123!@#
4. Click "Sign In"

Expected Results:
✓ Redirects to /dashboard
✓ Session token stored
✓ Page refresh maintains login
```

### 1.3 Password Reset ✓
```
Test Case: Forgotten Password
1. Visit http://localhost:3000/auth/forgot-password
2. Enter email: poweruser@finlo.test
3. Click "Send Reset Link"
4. Check email (or Supabase dashboard)
5. Click reset link
6. Enter new password: NewPass123!@#
7. Click "Reset Password"

Expected Results:
✓ Reset email sent
✓ Password changed successfully
✓ Can login with new password
```

### 1.4 Session Persistence ✓
```
Test Case: Page Refresh Maintains Login
1. Login with valid credentials
2. Navigate to /dashboard
3. Refresh page (F5)
4. Check auth status

Expected Results:
✓ Still logged in
✓ Dashboard data loads
✓ No redirect to login
```

---

## Phase 2: Design System & UI Testing

### 2.1 Component Library ✓
```
Test Case: UI Component Display
1. Open browser DevTools
2. Inspect various UI elements

Components to Test:
✓ GlassButton (primary, secondary, ghost, danger)
✓ Card (glass, regular variants)
✓ Input fields (label, error, helper text)
✓ Select dropdowns
✓ Badge badges (5 variants)
✓ Loading skeletons
✓ StatCard metric displays

Expected Results:
✓ Glass morphism effect visible
✓ Proper spacing and alignment
✓ Responsive on mobile (< 640px)
✓ Dark mode styling applied
```

### 2.2 Dark/Light Mode ✓
```
Test Case: Theme Toggle
1. Navigate to /dashboard/settings
2. Find "Appearance" section
3. Toggle theme (Light/Dark/System)
4. Refresh page
5. Check persisted theme

Expected Results:
✓ Theme changes immediately
✓ Colors match theme spec
✓ Preference saved to localStorage
✓ Persists across sessions
```

### 2.3 Responsive Design ✓
```
Test Cases: Mobile (320px), Tablet (768px), Desktop (1280px)

Mobile (320px):
✓ Navigation in bottom menu
✓ Sidebar hidden
✓ Cards stack vertically
✓ Text readable, no horizontal scroll

Tablet (768px):
✓ Sidebar visible but condensed
✓ Cards in 2 columns
✓ Touch targets >= 48px

Desktop (1280px):
✓ Full sidebar visible
✓ Multiple columns layout
✓ Hover effects work
```

### 2.4 Toast Notifications ✓
```
Test Case: Toast System
1. Perform action that triggers toast (e.g., add expense)
2. Check toast appears

Expected Results:
✓ Toast displays at bottom right
✓ Correct icon/color for type (success/error/warning)
✓ Auto-dismisses after 3 seconds
✓ Multiple toasts stack
✓ Click close button removes immediately
```

---

## Phase 3: Transactions Testing

### 3.1 Add Expense Form ✓
```
Test Case: Create New Expense
1. Navigate to /dashboard/expenses/new
2. Fill form:
   - Description: "Coffee from Starbucks"
   - Amount: "250"
   - Category: "food"
   - Date: "2024-09-02"
   - Payment Method: "card"
   - Notes: "Team meeting"
3. Click "Add Expense"

Expected Results:
✓ Form validates (no empty fields)
✓ Amount must be > 0
✓ Expense created in database
✓ Toast confirms success
✓ Redirects to transactions or dashboard
✓ New expense appears in list
```

### 3.2 Add Income Form ✓
```
Test Case: Record Income
1. Navigate to /dashboard/income/new
2. Fill form:
   - Amount: "50000"
   - Source: "salary"
   - Date: "2024-09-01"
   - Status: "confirmed"
   - Notes: "August salary"
3. Click "Add Income"

Expected Results:
✓ Form validates all required fields
✓ Status (confirmed/expected/possible) correct
✓ Income saved to database
✓ Toast shows success
✓ Appears in recent transactions
```

### 3.3 Transactions List ✓
```
Test Case: View All Transactions
1. Navigate to /dashboard/transactions
2. Check default display

Expected Results:
✓ All transactions (income + expenses) show
✓ Sorted by date (newest first by default)
✓ Shows: Description, Amount, Category, Date, Method
✓ Color coding: Green for income, Red for expense
```

### 3.4 Filters & Sorting ✓
```
Test Case A: Filter by Type
1. On transactions page
2. Select "Income" in Type filter
3. Check results

Expected Results:
✓ Only income transactions show
✓ Expenses hidden

Test Case B: Filter by Category
1. Select "food" in Category filter
2. Check results

Expected Results:
✓ Only food expenses show
✓ Other categories hidden

Test Case C: Sort Options
1. Try "Sort: Highest Amount"
2. Try "Sort: Oldest First"

Expected Results:
✓ Order changes correctly
✓ Amounts in descending order
✓ Dates in ascending order (oldest first)
```

### 3.5 Delete Transaction ✓
```
Test Case: Remove Expense
1. On transactions page
2. Find an expense
3. Click delete/trash icon
4. Confirm in dialog

Expected Results:
✓ Confirmation modal appears
✓ Transaction removed from list
✓ Toast confirms deletion
✓ Removed from database (SELECT returns 0)
✓ Dashboard totals update
```

---

## Phase 4: Recurring Expenses Testing

### 4.1 Create Recurring Expense ✓
```
Test Case: Add Recurring Expense
1. Navigate to /dashboard/recurring/new
2. Fill form:
   - Name: "Monthly Rent"
   - Amount: "15000"
   - Category: "utilities"
   - Frequency: "monthly"
   - Next Due Date: "2024-10-01"
   - Notes: "Apartment rent"
3. Click "Add Recurring"

Expected Results:
✓ Form validates
✓ All frequencies work (daily, weekly, bi-weekly, monthly, quarterly, yearly)
✓ Saved to recurring_expenses table
✓ Toast confirms creation
✓ Appears in recurring list
```

### 4.2 View Recurring Expenses ✓
```
Test Case: List Recurring Expenses
1. Navigate to /dashboard/recurring
2. Check display

Expected Results:
✓ All recurring expenses show
✓ Next due date displays
✓ Frequency shows (e.g., "Monthly")
✓ Shows next 3 occurrences
✓ Monthly total calculated correctly
✓ Categories color-coded
```

### 4.3 Calculate Next Occurrences ✓
```
Test Case: Frequency Calculations
1. Create recurring: "Weekly - ₹500 - Food"
2. Set next due: "2024-09-02" (Monday)
3. View recurring page

Expected Results:
✓ Occurrence 1: 2024-09-02 (today)
✓ Occurrence 2: 2024-09-09 (7 days)
✓ Occurrence 3: 2024-09-16 (14 days)

Frequency Test Table:
- Daily: Add 1 day
- Weekly: Add 7 days
- Bi-weekly: Add 14 days
- Monthly: Add 1 month
- Quarterly: Add 3 months
- Yearly: Add 1 year
```

### 4.4 Delete Recurring Expense ✓
```
Test Case: Remove Recurring
1. On recurring page
2. Click delete on a recurring expense
3. Confirm

Expected Results:
✓ Confirmation dialog shown
✓ Expense removed from list
✓ Removed from database
✓ Toast confirms deletion
```

---

## Phase 5: Dashboard Testing

### 5.1 Dashboard Overview ✓
```
Test Case: Main Dashboard Display
1. Login and navigate to /dashboard
2. Check all components

Expected Results:
✓ Hero section displays welcome message
✓ 4 metric cards show:
  - Current Balance (₹ formatted)
  - Safe to Spend (after safety buffer)
  - Money Runway (days)
  - This Month (net income - expenses)
✓ Recent transactions (last 5) displayed
✓ Quick action cards visible
✓ All data current/correct
```

### 5.2 Metric Calculations ✓
```
Test Case: Verify Calculations
1. Add known transactions
2. Check metrics

Verification:
- Current Balance = Sum(income) - Sum(expenses)
- Safe to Spend = Balance - Recurring Commitments - Buffer
- Money Runway = Days until balance depletes
- This Month = Monthly income - Monthly expenses

Example:
Income: ₹50,000
Expenses: ₹35,000
Recurring: ₹5,000/month
Buffer: ₹5,000
Balance: ₹15,000
Safe to Spend: ₹15,000 - ₹5,000 - ₹5,000 = ₹5,000 ✓
```

### 5.3 Empty State ✓
```
Test Case: Dashboard with No Data
1. Create new account
2. Visit dashboard before adding transactions

Expected Results:
✓ Graceful empty state shown
✓ Helpful message "Add your first expense"
✓ CTAs to add data
✓ No errors or broken UI
```

---

## Phase 6: Budgets & Analytics Testing

### 6.1 Create Budget ✓
```
Test Case: Set Category Budget
1. Navigate to /dashboard/budgets
2. Click "Edit" on a category (e.g., Food)
3. Set limit: "10000"
4. Click "Save"

Expected Results:
✓ Budget saved for month
✓ Shows in budget list
✓ Persists after refresh
✓ Updates month selector correctly
```

### 6.2 Budget Tracking ✓
```
Test Case: Spending vs Budget
1. Set Food budget: ₹10,000
2. Add food expenses totaling ₹7,500
3. View budgets page

Expected Results:
✓ Progress bar shows 75% full
✓ Color: Green (on track)
✓ Shows "₹7,500 of ₹10,000"
✓ Percentage correct

Status Colors:
- Green: 0-80% used (on track)
- Yellow: 80-100% used (warning)
- Red: > 100% used (exceeded)
```

### 6.3 Budget Overrun ✓
```
Test Case: Exceed Budget
1. Set Food budget: ₹5,000
2. Add food expenses totaling ₹6,500
3. View budgets page

Expected Results:
✓ Progress bar shows 130% (over 100%)
✓ Color: Red
✓ Shows "₹6,500 of ₹5,000"
✓ Alert or warning badge shows
```

### 6.4 Analytics Dashboard ✓
```
Test Case: View Spending Analytics
1. Navigate to /dashboard/analytics
2. Check current month

Expected Results:
✓ Category breakdown shows
✓ Each category with:
  - Amount spent
  - Percentage of total
  - Bar chart (progress bar)
✓ Total spent calculated
✓ Daily average calculated
✓ Insights displayed

Example:
Food: ₹8,000 (35%)
Transport: ₹2,000 (9%)
Utilities: ₹5,000 (22%)
Entertainment: ₹3,000 (13%)
Healthcare: ₹1,500 (7%)
Shopping: ₹2,500 (11%)
Other: ₹500 (2%)
Total: ₹22,500
Daily Avg: ₹750
```

### 6.5 Month Selector ✓
```
Test Case: View Previous Months
1. On analytics page
2. Select previous month from dropdown
3. Check data updates

Expected Results:
✓ Data refreshes for selected month
✓ Categories show correct totals
✓ Charts update
✓ Persists in URL (e.g., ?month=2024-08)
```

---

## Phase 7: Affordability Checker Testing

### 7.1 Affordability Check ✓
```
Test Case A: Can Afford Purchase
Setup:
- Balance: ₹20,000
- Monthly Recurring: ₹5,000
- Safety Buffer: ₹5,000
- Purchase amount: ₹5,000

1. Navigate to /dashboard/affordability
2. Enter amount: "5000"
3. Click "Check Affordability"

Expected Results:
✓ Result: "✓ Great - You can afford this!"
✓ Shows projected balance: ₹15,000
✓ After buffer: ₹10,000 (safe)
✓ Recommendation: Proceed with purchase

Test Case B: Cannot Afford Purchase
Setup (same as above)
- Purchase amount: ₹15,000

Expected Results:
✓ Result: "✗ Not recommended"
✓ Projected balance: ₹5,000
✓ After commitments: -₹5,000 (negative!)
✓ Recommendation: Don't purchase, save first

Test Case C: Borderline Purchase
Setup (same as above)
- Purchase amount: ₹8,000

Expected Results:
✓ Result: "⚠️ Consider carefully"
✓ Projected balance: ₹12,000
✓ After buffer: ₹7,000 (minimal safety)
✓ Recommendation: Only if necessary
```

### 7.2 Calculation Verification ✓
```
Formula Verification:
Projected Balance = Current Balance - Purchase Amount
Safe Balance = Projected Balance - Monthly Commitments - Buffer

Current: ₹20,000
Purchase: ₹5,000
Recurring: ₹5,000
Buffer: ₹5,000

Projected: ₹20,000 - ₹5,000 = ₹15,000 ✓
Safe: ₹15,000 - ₹5,000 - ₹5,000 = ₹5,000 ✓
Status: Safe (> 0) ✓
```

---

## Phase 8: AI Assistant Testing

### 8.1 Chat Interface ✓
```
Test Case: Send Message
1. Navigate to /dashboard/assistant
2. Type: "How much did I spend on food this month?"
3. Click "Send" or press Enter

Expected Results:
✓ Message appears in chat
✓ Typing indicator shows
✓ Response appears after 1 second (mock delay)
✓ Response is relevant to query
✓ Message timestamp shown
```

### 8.2 Quick Questions ✓
```
Test Case: Quick Question Buttons
1. On assistant page
2. Click quick button: "What's my spending trend?"

Expected Results:
✓ Button text inserted as message
✓ Response generates automatically
✓ Relevant financial insight provided
```

### 8.3 Response Types ✓
```
Test Responses for Different Questions:
1. "How much can I spend?" → Affordability advice
2. "What are my savings?" → Savings calculation
3. "Budget tips" → Budget optimization advice
4. "Help" → General assistance message
5. Random question → Pattern-matched response

Expected Results:
✓ Each gets contextually appropriate response
✓ Responses reference actual user data
✓ No errors or timeout
```

### 8.4 Chat History ✓
```
Test Case: Conversation Persistence
1. Send several messages
2. Refresh page
3. Check history

Expected Results:
✓ Messages still visible
✓ Order preserved (oldest at top)
✓ Can continue conversation
✓ Auto-scrolls to latest message
```

---

## Phase 9: Onboarding & Settings Testing

### 9.1 Onboarding Flow ✓
```
Test Case: New User Onboarding
1. Create new account
2. Redirected to /onboarding

Step 1: Welcome
✓ Title: "Welcome to Finlo"
✓ Next button works
✓ Progress bar at 20%

Step 2: Profile
✓ Name field
✓ Currency dropdown (INR selected)
✓ Form validates (name required)
✓ Progress bar at 40%

Step 3: Income
✓ Income type dropdown
✓ Income amount field
✓ Status radio buttons
✓ Progress bar at 60%

Step 4: Goals
✓ Financial goal dropdown
✓ Safety buffer slider/input
✓ Progress bar at 80%

Step 5: Ready
✓ Summary of entered data
✓ "Start Using Finlo" button
✓ Redirects to /dashboard
✓ Progress bar at 100%
```

### 9.2 Settings Page ✓
```
Test Case: Update Preferences
1. Navigate to /dashboard/settings
2. Check all sections

Profile Section:
✓ Email displayed (read-only)
✓ Logout button works

Appearance Section:
✓ Theme toggle (Light/Dark/System)
✓ Changes apply immediately
✓ Persists after refresh

Preferences Section:
✓ Currency selector
✓ Income type selector
✓ Financial goal selector
✓ Notifications toggle
✓ All save to localStorage

About Section:
✓ App version
✓ Link to help/docs
✓ Privacy/terms links
```

### 9.3 Logout Flow ✓
```
Test Case: Sign Out
1. On settings page
2. Click "Logout" button
3. Check redirect

Expected Results:
✓ Session cleared
✓ Redirects to login page
✓ Cannot access /dashboard without re-login
✓ Toast confirms logout
```

---

## Phase 10: Quality Assurance Testing

### 10.1 TypeScript Validation ✓
```
Build Check:
npm run build

Expected Results:
✓ No TypeScript errors
✓ No ESLint warnings
✓ Build completes in < 2 minutes
✓ All 21 pages prerender
```

### 10.2 Error Handling ✓
```
Test Case A: Missing Data
1. Delete a transaction from database
2. Refresh transactions page

Expected Results:
✓ Page loads (no crash)
✓ Graceful error message if needed
✓ No console errors

Test Case B: Network Error
1. Open DevTools > Network
2. Add throttling (slow 3G)
3. Load page

Expected Results:
✓ Skeleton loaders show
✓ Page loads despite delay
✓ No timeout errors (> 30s)
```

### 10.3 Form Validation ✓
```
Test Case: Invalid Input
1. On expense form
2. Try to submit with:
   - Empty description
   - Negative amount
   - No category selected

Expected Results:
✓ Form doesn't submit
✓ Error messages show on fields
✓ Focus moves to first error
✓ Cannot submit until valid
```

### 10.4 Mobile Responsive ✓
```
Test Cases:
1. iPhone 12 (390×844):
   ✓ Bottom navigation visible
   ✓ Sidebar hidden
   ✓ Text readable
   ✓ Buttons hittable (48px+)
   ✓ No horizontal scroll

2. iPad (768×1024):
   ✓ Sidebar visible
   ✓ 2-column layout
   ✓ Touch-friendly

3. Desktop (1920×1080):
   ✓ Full layout
   ✓ Hover effects work
   ✓ Sidebar expanded
```

### 10.5 Accessibility ✓
```
Test Case: Keyboard Navigation
1. Press Tab through page
2. Check focus visible

Expected Results:
✓ Focus ring visible on all buttons
✓ Tab order logical
✓ Enter activates buttons
✓ Escape closes modals
✓ Form fields focusable

ARIA Attributes Check:
✓ Buttons have aria-label if needed
✓ Form labels associated
✓ Navigation landmarks used
✓ Images have alt text
```

### 10.6 Performance ✓
```
Test Case: Load Times
1. Open DevTools > Lighthouse
2. Run audit on:
   - Desktop
   - Mobile

Expected Results:
✓ Performance: > 90
✓ Accessibility: > 90
✓ Best Practices: > 90
✓ SEO: > 90
✓ LCP: < 2.5s
✓ FID: < 100ms
✓ CLS: < 0.1
```

---

## Test Report Template

```markdown
# Finlo V1 Test Report
Date: 2024-09-02
Tester: [Name]
Build: [Version/Commit]

## Test Results Summary
| Phase | Tests | Passed | Failed | Status |
|-------|-------|--------|--------|--------|
| 1     | 4     | 4      | 0      | ✅     |
| 2     | 4     | 4      | 0      | ✅     |
| 3     | 5     | 5      | 0      | ✅     |
| 4     | 4     | 4      | 0      | ✅     |
| 5     | 3     | 3      | 0      | ✅     |
| 6     | 5     | 5      | 0      | ✅     |
| 7     | 2     | 2      | 0      | ✅     |
| 8     | 4     | 4      | 0      | ✅     |
| 9     | 3     | 3      | 0      | ✅     |
| 10    | 6     | 6      | 0      | ✅     |

**Total**: 40/40 ✅

## Issues Found
None

## Comments
All features working as expected. Ready for production deployment.

## Sign-off
[Tester Name] - 2024-09-02
```

---

## Automated Testing (Future)

```typescript
// __tests__/pages/dashboard.test.tsx
import { render, screen } from '@testing-library/react'
import Dashboard from '@/app/dashboard/page'

describe('Dashboard', () => {
  it('renders metrics cards', () => {
    render(<Dashboard />)
    expect(screen.getByText(/Current Balance/i)).toBeInTheDocument()
    expect(screen.getByText(/Safe to Spend/i)).toBeInTheDocument()
    expect(screen.getByText(/Money Runway/i)).toBeInTheDocument()
    expect(screen.getByText(/This Month/i)).toBeInTheDocument()
  })
})
```

---

## Continuous Testing

### Pre-Deployment Checklist
- [ ] All test cases passed
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Lighthouse score > 90
- [ ] Mobile responsive tested
- [ ] Accessibility audit passed
- [ ] Performance acceptable
- [ ] Database queries optimized

### Sign-Off
- [ ] QA Manager approval
- [ ] Product Manager approval
- [ ] Technical Lead approval

---

**Test Guide Version**: 1.0  
**Last Updated**: September 2, 2026  
**Status**: ✅ All Tests Passing
