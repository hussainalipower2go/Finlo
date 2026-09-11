const DATA_TABLES = ["transactions", "income", "expenses", "budgets", "installments", "recurring_expenses"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function hasExistingUserData(db: any): Promise<boolean> {
  for (const table of DATA_TABLES) {
    try {
      const { data } = await db.from(table).select("id").limit(1);
      if (data && data.length > 0) return true;
    } catch {
      // table may not exist yet for this user — treat as no data
    }
  }
  return false;
}