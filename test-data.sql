-- Finlo V1 Test Data Script
-- Load sample financial data for testing
-- IMPORTANT: Replace {USER_ID} with your actual Supabase user ID from auth.users table

-- Get your user ID first:
-- SELECT id FROM auth.users LIMIT 1;

-- Step 1: Insert User Preferences
INSERT INTO public.user_preferences (
  user_id, currency, theme, income_type, financial_goal, 
  notifications_enabled, safety_buffer, created_at, updated_at
) VALUES (
  '{USER_ID}',
  'INR',
  'dark',
  'salary',
  'Build 6 months emergency fund',
  true,
  5000,
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  updated_at = NOW();

-- Step 2: Insert Sample Income Records
INSERT INTO public.income (
  user_id, amount, source, date, status, notes, created_at, updated_at
) VALUES
('{USER_ID}', 50000, 'salary', '2024-09-01'::date, 'confirmed', 'Monthly salary payment', NOW(), NOW()),
('{USER_ID}', 50000, 'salary', '2024-08-01'::date, 'confirmed', 'Monthly salary payment', NOW() - interval '31 days', NOW() - interval '31 days'),
('{USER_ID}', 8000, 'freelance', '2024-08-15'::date, 'confirmed', 'Freelance project completion', NOW() - interval '17 days', NOW() - interval '17 days'),
('{USER_ID}', 5000, 'bonus', '2024-08-10'::date, 'confirmed', 'Q3 Performance bonus', NOW() - interval '22 days', NOW() - interval '22 days'),
('{USER_ID}', 10000, 'freelance', '2024-09-10'::date, 'expected', 'Upcoming freelance project', NOW() + interval '8 days', NOW() + interval '8 days'),
('{USER_ID}', 3000, 'other', '2024-09-15'::date, 'possible', 'Side project (uncertain)', NOW() + interval '13 days', NOW() + interval '13 days');

-- Step 3: Insert Sample Expenses
INSERT INTO public.expenses (
  user_id, amount, description, category, date, payment_method, status, notes, created_at, updated_at
) VALUES
-- August expenses
('{USER_ID}', 1500, 'Monthly rent', 'utilities', '2024-08-01'::date, 'bank transfer', 'completed', 'Flat rent', NOW() - interval '31 days', NOW() - interval '31 days'),
('{USER_ID}', 2500, 'Grocery shopping - Weekly', 'food', '2024-08-05'::date, 'card', 'completed', 'Supermarket', NOW() - interval '27 days', NOW() - interval '27 days'),
('{USER_ID}', 800, 'Electricity bill', 'utilities', '2024-08-10'::date, 'bank transfer', 'completed', 'Monthly electricity', NOW() - interval '22 days', NOW() - interval '22 days'),
('{USER_ID}', 300, 'Gym membership', 'healthcare', '2024-08-12'::date, 'card', 'completed', 'Monthly fitness', NOW() - interval '20 days', NOW() - interval '20 days'),
('{USER_ID}', 2000, 'Grocery shopping - Weekly', 'food', '2024-08-12'::date, 'card', 'completed', 'Supermarket', NOW() - interval '20 days', NOW() - interval '20 days'),
('{USER_ID}', 450, 'Petrol', 'transport', '2024-08-15'::date, 'card', 'completed', 'Car fuel', NOW() - interval '17 days', NOW() - interval '17 days'),
('{USER_ID}', 1200, 'Internet & Mobile', 'utilities', '2024-08-18'::date, 'bank transfer', 'completed', 'Monthly bills', NOW() - interval '14 days', NOW() - interval '14 days'),
('{USER_ID}', 600, 'Movie tickets & Dinner', 'entertainment', '2024-08-20'::date, 'card', 'completed', 'Date night', NOW() - interval '12 days', NOW() - interval '12 days'),
('{USER_ID}', 3000, 'Grocery shopping - Weekly', 'food', '2024-08-22'::date, 'card', 'completed', 'Supermarket bulk', NOW() - interval '10 days', NOW() - interval '10 days'),
('{USER_ID}', 500, 'Doctor consultation', 'healthcare', '2024-08-25'::date, 'cash', 'completed', 'Medical checkup', NOW() - interval '7 days', NOW() - interval '7 days'),
('{USER_ID}', 2500, 'Clothes shopping', 'shopping', '2024-08-28'::date, 'card', 'completed', 'Seasonal wardrobe', NOW() - interval '4 days', NOW() - interval '4 days'),

-- September expenses (current month)
('{USER_ID}', 1500, 'Monthly rent', 'utilities', '2024-09-01'::date, 'bank transfer', 'completed', 'Flat rent', NOW(), NOW()),
('{USER_ID}', 2200, 'Grocery shopping - Weekly', 'food', '2024-09-02'::date, 'card', 'completed', 'Supermarket', NOW() - interval '1 days', NOW() - interval '1 days'),
('{USER_ID}', 350, 'Petrol', 'transport', '2024-09-04'::date, 'card', 'completed', 'Car fuel', NOW() - interval '2 days', NOW() - interval '2 days'),
('{USER_ID}', 1800, 'Grocery shopping - Weekly', 'food', '2024-09-05'::date, 'card', 'completed', 'Supermarket', NOW() - interval '2 days', NOW() - interval '2 days'),
('{USER_ID}', 400, 'Movie streaming subscription', 'entertainment', '2024-09-01'::date, 'card', 'completed', '3-month subscription', NOW(), NOW()),
('{USER_ID}', 200, 'Coffee and snacks', 'food', '2024-09-03'::date, 'card', 'completed', 'Cafe', NOW() - interval '2 days', NOW() - interval '2 days'),

-- Planned expenses (future)
('{USER_ID}', 2000, 'New laptop', 'shopping', '2024-09-15'::date, 'card', 'planned', 'Work equipment', NOW() + interval '13 days', NOW() + interval '13 days'),
('{USER_ID}', 1000, 'Car maintenance', 'transport', '2024-09-20'::date, 'bank transfer', 'planned', 'Service and checkup', NOW() + interval '18 days', NOW() + interval '18 days');

-- Step 4: Insert Recurring Expenses
INSERT INTO public.recurring_expenses (
  user_id, name, amount, category, frequency, next_due_date, notes, created_at, updated_at
) VALUES
('{USER_ID}', 'Monthly Rent', 1500, 'utilities', 'monthly', '2024-10-01'::date, 'Home rent payment', NOW(), NOW()),
('{USER_ID}', 'Gym Membership', 300, 'healthcare', 'monthly', '2024-09-12'::date, 'Fitness center', NOW(), NOW()),
('{USER_ID}', 'Internet & Mobile', 1200, 'utilities', 'monthly', '2024-09-18'::date, 'Home internet + phone', NOW(), NOW()),
('{USER_ID}', 'Weekly Groceries', 2000, 'food', 'weekly', '2024-09-09'::date, 'Supermarket shopping', NOW(), NOW()),
('{USER_ID}', 'Car Fuel', 500, 'transport', 'bi-weekly', '2024-09-15'::date, 'Regular fuel expenses', NOW(), NOW()),
('{USER_ID}', 'Insurance Premium', 2500, 'healthcare', 'quarterly', '2024-11-01'::date, 'Health & auto insurance', NOW(), NOW()),
('{USER_ID}', 'Water Bill', 400, 'utilities', 'monthly', '2024-09-15'::date, 'Municipal water supply', NOW(), NOW()),
('{USER_ID}', 'Electricity Bill', 800, 'utilities', 'monthly', '2024-09-10'::date, 'Power supply', NOW(), NOW());

-- Step 5: Insert Budgets for September
INSERT INTO public.budgets (
  user_id, category, limit_amount, month, created_at, updated_at
) VALUES
('{USER_ID}', 'food', 10000, '2024-09', NOW(), NOW()),
('{USER_ID}', 'transport', 2000, '2024-09', NOW(), NOW()),
('{USER_ID}', 'utilities', 4000, '2024-09', NOW(), NOW()),
('{USER_ID}', 'entertainment', 1500, '2024-09', NOW(), NOW()),
('{USER_ID}', 'healthcare', 2000, '2024-09', NOW(), NOW()),
('{USER_ID}', 'shopping', 5000, '2024-09', NOW(), NOW()),
('{USER_ID}', 'other', 1000, '2024-09', NOW(), NOW())
ON CONFLICT (user_id, category, month) DO UPDATE SET
  updated_at = NOW();

-- Step 6: Verify data insertion
SELECT 
  'Income Records' as metric, COUNT(*) as count 
FROM public.income 
WHERE user_id = '{USER_ID}'
UNION ALL
SELECT 
  'Expenses', COUNT(*) 
FROM public.expenses 
WHERE user_id = '{USER_ID}'
UNION ALL
SELECT 
  'Recurring Expenses', COUNT(*) 
FROM public.recurring_expenses 
WHERE user_id = '{USER_ID}'
UNION ALL
SELECT 
  'Budgets', COUNT(*) 
FROM public.budgets 
WHERE user_id = '{USER_ID}';

-- Example summary queries

-- Get total income by source
SELECT source, SUM(amount) as total, COUNT(*) as count
FROM public.income
WHERE user_id = '{USER_ID}'
GROUP BY source
ORDER BY total DESC;

-- Get spending by category (current month)
SELECT category, SUM(amount) as total_spent, COUNT(*) as count
FROM public.expenses
WHERE user_id = '{USER_ID}' 
  AND DATE_TRUNC('month', date) = DATE_TRUNC('month', NOW())
GROUP BY category
ORDER BY total_spent DESC;

-- Get upcoming bills (next 30 days)
SELECT name, amount, next_due_date, frequency
FROM public.recurring_expenses
WHERE user_id = '{USER_ID}'
  AND next_due_date <= CURRENT_DATE + interval '30 days'
ORDER BY next_due_date ASC;

-- Calculate cash flow summary
SELECT
  (SELECT COALESCE(SUM(amount), 0) FROM public.income WHERE user_id = '{USER_ID}' AND DATE_TRUNC('month', date) = DATE_TRUNC('month', NOW())) as total_income,
  (SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE user_id = '{USER_ID}' AND DATE_TRUNC('month', date) = DATE_TRUNC('month', NOW())) as total_expenses,
  (SELECT COALESCE(SUM(amount), 0) FROM public.income WHERE user_id = '{USER_ID}' AND DATE_TRUNC('month', date) = DATE_TRUNC('month', NOW())) 
  - (SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE user_id = '{USER_ID}' AND DATE_TRUNC('month', date) = DATE_TRUNC('month', NOW())) as net_balance;
