import puppeteer from 'puppeteer';

const PAGES = [
  { name: 'landing', url: 'http://localhost:3000', filename: 'screenshots_landing.png' },
  { name: 'onboarding', url: 'http://localhost:3000/onboarding', filename: 'screenshots_onboarding.png' },
  { name: 'login', url: 'http://localhost:3000/login', filename: 'screenshots_auth_login.png' },
  { name: 'signup', url: 'http://localhost:3000/signup', filename: 'screenshots_auth_signup.png' },
  { name: 'forgot-password', url: 'http://localhost:3000/forgot-password', filename: 'screenshots_auth_forgot-password.png' },
  { name: 'reset-password', url: 'http://localhost:3000/reset-password', filename: 'screenshots_auth_reset-password.png' },
  { name: 'dashboard', url: 'http://localhost:3000/dashboard', filename: 'screenshots_dashboard.png' },
  { name: 'transactions', url: 'http://localhost:3000/dashboard/transactions', filename: 'screenshots_dashboard_transactions.png' },
  { name: 'upcoming', url: 'http://localhost:3000/dashboard/upcoming', filename: 'screenshots_dashboard_upcoming.png' },
  { name: 'budgets', url: 'http://localhost:3000/dashboard/budgets', filename: 'screenshots_dashboard_budgets.png' },
  { name: 'analytics', url: 'http://localhost:3000/dashboard/analytics', filename: 'screenshots_dashboard_analytics.png' },
  { name: 'assistant', url: 'http://localhost:3000/dashboard/assistant', filename: 'screenshots_dashboard_assistant.png' },
  { name: 'settings', url: 'http://localhost:3000/dashboard/settings', filename: 'screenshots_dashboard_settings.png' },
  { name: 'profile', url: 'http://localhost:3000/dashboard/profile', filename: 'screenshots_dashboard_profile.png' },
  { name: 'affordability', url: 'http://localhost:3000/dashboard/affordability', filename: 'screenshots_dashboard_affordability.png' },
  { name: 'transactions-new', url: 'http://localhost:3000/dashboard/transactions/new', filename: 'screenshots_dashboard_transactions_new.png' },
  { name: 'income-new', url: 'http://localhost:3000/dashboard/income/new', filename: 'screenshots_dashboard_income_new.png' },
  { name: 'recurring-new', url: 'http://localhost:3000/dashboard/recurring/new', filename: 'screenshots_dashboard_recurring_new.png' },
  { name: 'recurring', url: 'http://localhost:3000/dashboard/recurring', filename: 'screenshots_dashboard_recurring.png' },
  { name: 'expenses-new', url: 'http://localhost:3000/dashboard/expenses/new', filename: 'screenshots_dashboard_expenses_new.png' },
  { name: 'terms', url: 'http://localhost:3000/terms', filename: 'screenshots_terms.png' },
  { name: 'privacy', url: 'http://localhost:3000/privacy', filename: 'screenshots_privacy.png' },
];

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // Set high DPI viewport
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 3 });

  for (const p of PAGES) {
    try {
      console.log(`Capturing ${p.name}...`);
      await page.goto(p.url, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 500));
      await page.screenshot({
        path: `screenshots/${p.filename}`,
        scale: 3,
        omitBackground: true,
      });
      console.log(`✓ ${p.filename} saved`);
    } catch (err) {
      console.error(`✗ ${p.name} failed: ${err.message}`);
    }
  }

  await browser.close();
  console.log('Done! All high-res screenshots generated.');
})();