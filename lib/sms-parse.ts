export interface SmsParseResult {
  kind: "expense" | "income";
  amount: number;
  category: string;
  source: string;
  date: string;
  description: string;
}

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

const CATEGORY_RULES: [RegExp, string][] = [
  [/\b(uber|careem|bykea|indrive|in ?drive|bus|metro|rail|train|air |airline|pso|shell|pump|fuel|petrol|diesel|parking|toll|transport|car rent|carwash)\b/i, "Transport"],
  [/\b(netflix|youtube|spotify|deevar|shahid|amazon prime|subscription)\b/i, "Subscriptions"],
  [/\b(k-?electric|kesc|electric|lesco|fesco|mesco|gesco|hesco|sepco|gas|sui ?gas|sngpl|wasa|water|ptcl|internet|wifi|broadband)\b/i, "Utilities"],
  [/\b(restaurant|foodpanda|daraz ?food|kfc|mcdonald|pizza|burger|fried chicken|grocery|groceries|supermarket|baker|hotel|kabab|chinese)\b/i, "Food"],
  [/\b(hospital|clinic|pharmacy|medicine|medicare|doctor|dentist|laboratory|lab|e-?pharmacy|health)\b/i, "Health"],
  [/\b(daraz|aliexpress|shopping|mall|store|outlet|fashion|clothing)\b/i, "Shopping"],
  [/\b(rent|monthly rent)\b/i, "Rent"],
  [/\b(jazz|zong|telenor|ufone|mobilink|easypaisa|cashback)\b/i, "Utilities"],
];

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 12)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function normalizeAmount(raw: string): string {
  return raw.replace(/,/g, "");
}

function extractDate(text: string): string {
  const named = text.match(/\b(\d{1,2})[- /.]([A-Za-z]{3})[- /.](\d{2,4})\b/);
  if (named) {
    const day = named[1].padStart(2, "0");
    const month = MONTHS[named[2].toLowerCase().slice(0, 3)];
    let year = named[3];
    if (year.length === 2) year = Number(year) > 30 ? `19${year}` : `20${year}`;
    if (month) return `${year}-${month}-${day}`;
  }
  const numeric = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (numeric) {
    let d = numeric[1];
    let m = numeric[2];
    let y = numeric[3];
    if (Number(d) > 12) {
      const tmp = d;
      d = m;
      m = tmp;
    }
    if (y.length === 2) y = Number(y) > 30 ? `19${y}` : `20${y}`;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return new Date().toISOString().slice(0, 10);
}

function guessCategory(text: string): string {
  for (const [re, cat] of CATEGORY_RULES) {
    if (re.test(text)) return cat;
  }
  return "Other";
}

function guessIncomeSource(text: string): string {
  if (/\b(salary|pay ?roll|employer)\b/i.test(text)) return "Salary";
  if (/\b(upwork|fiverr|freelance)\b/i.test(text)) return "Freelance";
  if (/\b(business|shop|sale|profit)\b/i.test(text)) return "Business";
  return "Other";
}

function cleanDescription(text: string): string {
  let cleaned = text;
  cleaned = cleaned.replace(/\b(?:rs\.?|pk[rops]{1,3}s?|pkr)\s*:?\s*\d[\d,]*(?:\.\d+)?/gi, " ");
  cleaned = cleaned.replace(/\d{3,}/g, " ");
  cleaned = cleaned.replace(/\b(?:tid|ref|sc|txn|trx|bk|acc|card|avail|bal|balance)[:\s#-]*\d[\d\s]*\b/gi, " ");
  cleaned = cleaned.replace(/[^\w\s.,-]/g, " ");
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  const idx = cleaned.search(/\.|;|:/);
  if (idx > 10) cleaned = cleaned.slice(0, idx);
  return titleCase(cleaned) || "Bank transaction";
}

export function parseBankSms(rawText: string): SmsParseResult | null {
  const text = String(rawText || "").trim();
  if (!text) return null;

  const lower = text.toLowerCase();

  const amountMatch =
    lower.match(/\b(?:rs\.?|pk[rops]{1,3}s?|pkr)\s*:?\s*([\d][\d,]*(?:\.\d+)?)\b/) ||
    lower.match(/(?:amount|amt)\s*(?:of|:)?\s*(?:rs\.?|pk[rops]{1,3}s?|pkr)\s*:?\s*([\d][\d,]*(?:\.\d+)?)\b/) ||
    lower.match(/\b([\d][\d,]*(?:\.\d+)?)\s*(?:rs\.?|pkr)\b/) ||
    lower.match(/\b(?:spent|debit(?:ed)?|credited?|paid|transfe?r?red|received)\s*(?:of|:)?\s*(?:rs\.?|pk[rops]{1,3}s?|pkr)?\s*:?\s*([\d][\d,]*(?:\.\d+)?)\b/);

  if (!amountMatch) return null;

  const amount = Number(normalizeAmount(amountMatch[1]));
  if (!amount || amount <= 0) return null;

  const incIdx = lower.search(/\b(credited|received|deposited|deposit of|refund|added to|inward)\b/);
  const expIdx = lower.search(/\b(debited|debit|spent|deducted|withdraw|withdrawal|outward|paid to|payment)\b/);

  let kind: "expense" | "income";
  if (incIdx === -1 && expIdx === -1) {
    kind = /\b(credit|deposit|salary)\b/.test(lower) ? "income" : "expense";
  } else if (expIdx === -1) {
    kind = "income";
  } else if (incIdx === -1) {
    kind = "expense";
  } else {
    kind = incIdx < expIdx ? "income" : "expense";
  }

  const date = extractDate(text);
  const description = cleanDescription(text);

  if (kind === "income") {
    return {
      kind,
      amount,
      category: "Other",
      source: guessIncomeSource(text),
      date,
      description,
    };
  }

  return {
    kind,
    amount,
    category: guessCategory(text),
    source: "other",
    date,
    description,
  };
}