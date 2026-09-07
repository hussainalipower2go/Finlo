const CURRENCY_INFO: Record<string, { symbol: string; locale: string }> = {
  PKR: { symbol: "Rs. ", locale: "en-PK" },
  USD: { symbol: "$", locale: "en-US" },
  AED: { symbol: "AED ", locale: "en-AE" },
  SAR: { symbol: "SAR ", locale: "en-SA" },
  GBP: { symbol: "£", locale: "en-GB" },
  EUR: { symbol: "€", locale: "de-DE" },
  INR: { symbol: "₹", locale: "en-IN" },
};

export function currencySymbol(currency: string): string {
  return CURRENCY_INFO[currency]?.symbol ?? `${currency} `;
}

export function currencyLocale(currency: string): string {
  return CURRENCY_INFO[currency]?.locale ?? "en-US";
}

export function formatCurrency(n: number, currency: string): string {
  const info = CURRENCY_INFO[currency];
  const num = Number(n || 0);
  if (info) {
    return info.symbol + num.toLocaleString(info.locale);
  }
  return `${currency} ` + num.toLocaleString("en-US");
}
