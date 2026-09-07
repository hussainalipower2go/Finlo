/**
 * Known merchant → category mapping and a deterministic fallback classifier.
 * Pure, offline, no AI. AI is only ever used as a last resort for ambiguity
 * (and never with unrelated messages) — see services/sms-parser/index.ts.
 */

export const APP_CATEGORIES = [
  'food',
  'transport',
  'rent',
  'utilities',
  'shopping',
  'entertainment',
  'health',
  'education',
  'subscriptions',
  'family',
  'travel',
  'other',
] as const

export type AppCategory = (typeof APP_CATEGORIES)[number]

export const MERCHANT_CATEGORY_MAP: Record<string, AppCategory> = {
  // Food delivery & restaurants
  foodpanda: 'food', 'uber eats': 'food', 'careem food': 'food', kfc: 'food', kentucky: 'food',
  'mc donald': 'food', dominos: 'food', pizza: 'food', glovo: 'food', swiggy: 'food', zomato: 'food',
  deliveroo: 'food', starbucks: 'food', cafe: 'food', burger: 'food', restaurant: 'food',
  dastarkhwan: 'food', subway: 'food', nandos: 'food',
  // Transport & ride-hailing
  uber: 'transport', careem: 'transport', bykea: 'transport', indriver: 'transport',
  ola: 'transport', lyft: 'transport', bolt: 'transport', cab: 'transport', metro: 'transport',
  fuel: 'transport', petrol: 'transport', toll: 'transport',
  // Utilities
  kelectric: 'utilities', iesco: 'utilities', lesco: 'utilities', fesco: 'utilities',
  gesco: 'utilities', hepco: 'utilities', pesco: 'utilities', qesco: 'utilities', mepco: 'utilities',
  suig: 'utilities', ssgc: 'utilities', sngpl: 'utilities', ptcl: 'utilities', pso: 'utilities',
  electricity: 'utilities', 'water': 'utilities', 'gas': 'utilities',
  // Shopping
  amazon: 'shopping', daraz: 'shopping', aliexpress: 'shopping', alibaba: 'shopping', supermarket: 'shopping',
  mart: 'shopping', store: 'shopping', bazaar: 'shopping', retail: 'shopping',
  // Entertainment
  netflix: 'entertainment', hotstar: 'entertainment', 'prime video': 'entertainment', cinemax: 'entertainment',
  cinepax: 'entertainment', steam: 'entertainment', playstation: 'entertainment', play: 'entertainment',
  'youtube premium': 'entertainment',
  // Subscriptions & digital services
  spotify: 'subscriptions', apple: 'subscriptions', 'google play': 'subscriptions', 'google one': 'subscriptions',
  icloud: 'subscriptions', canva: 'subscriptions', adobe: 'subscriptions', notion: 'subscriptions',
  slack: 'subscriptions', zoom: 'subscriptions', vpn: 'subscriptions',
  // Telecom
  zong: 'subscriptions', jazz: 'subscriptions', telenor: 'subscriptions', ufone: 'subscriptions',
  // Health
  pharmacy: 'health', 'careem pharmacy': 'health', doctor: 'health', hospital: 'health', sehat: 'health',
  marham: 'health', oladoc: 'health', gym: 'health', clinic: 'health', medicine: 'health',
  // Freelance / income
  upwork: 'other', fiverr: 'other', freelancer: 'other',
  // Payments
  easypaisa: 'other', jazzcash: 'other', sadapay: 'other', nayapay: 'other',
  payoneer: 'other', wise: 'other', paypal: 'other',
  // Travel
  pia: 'travel', airblue: 'travel', 'serene air': 'travel', 'booking.com': 'travel', agoda: 'travel',
  airbnb: 'travel', hotel: 'travel', airline: 'travel', emirates: 'travel',
}

function normalizeMerchant(m: string): string {
  return m.toLowerCase().replace(/[^a-z0-9 ]/gi, '').replace(/\s+/g, ' ').trim()
}

/** 1) Known merchant mapping (exact then sub-string contains). */
export function categoryFromMerchant(merchant?: string): AppCategory | undefined {
  if (!merchant) return undefined
  const key = normalizeMerchant(merchant)
  if (!key) return undefined
  if (MERCHANT_CATEGORY_MAP[key]) return MERCHANT_CATEGORY_MAP[key]
  for (const [name, cat] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    if (key.includes(name) || (name.length > 3 && name.includes(key))) return cat
  }
  return undefined
}

/** 2) Keyword-based fallback when the merchant is unknown. */
export function categoryFromText(text: string): AppCategory {
  const t = text.toLowerCase()
  const order: Array<[AppCategory, RegExp[]]> = [
    ['transport', [/\b(uber|careem|bykea|indriver|ride|taxi|ola)\b/]],
    ['food', [/\b(food|lunch|dinner|restaurant|cafe|pizza|burger|kfc|mc.?donald)\b/]],
    ['utilities', [/\b(electricity|electric|gas|water|utility|utilities|internet|broadband|wifi|phone bill|bill)\b/]],
    ['subscriptions', [/\b(subscription|netflix|spotify|prime|membership|renewal|premium)\b/]],
    ['health', [/\b(pharmacy|doctor|hospital|clinic|medicine|lab|health)\b/]],
    ['shopping', [/\b(shop|store|mall|supermarket|grocery|daraz|amazon|purchase)\b/]],
    ['entertainment', [/\b(game|cinema|movie|stream|concert)\b/]],
    ['travel', [/\b(air|flight|hotel|booking|travel|ticket)\b/]],
    ['education', [/\b(school|tuition|college|university|course|education)\b/]],
    ['family', [/\b(family|kids|home|gift|donation)\b/]],
  ]
  for (const [cat, patterns] of order) {
    if (patterns.some((p) => p.test(t))) return cat
  }
  return 'other'
}

/** 3) Users' previous categorization is layered on top of this at service level. */
export function suggestCategory(merchant?: string, description?: string): AppCategory {
  return categoryFromMerchant(merchant) ?? (description ? categoryFromText(description) : 'other')
}

export function toTitleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Clean up a raw merchant slug from an SMS into a display name:
 * strips the bank name itself, account/balance/ref artifacts and single words.
 */
export function merchantFromText(raw: string, bankName: string): string | undefined {
  if (!raw) return undefined
  let m = raw
    .replace(/[^a-zA-Z0-9 .&'-]/g, ' ')
    .replace(/\b(available|balance|bal|ref|reference|tid|txn|id|at|on|is|of|to|from|rs|pkr|aed|sar|via|ending|ends|account|your|the|new)\b/gi, ' ')
    .replace(/\b\d{4,}\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Remove the bank's own name if it leaked into the merchant segment
  const bank = bankName.replace(/[^a-zA-Z ]/g, '').toLowerCase()
  if (bank) m = m.replace(new RegExp(`\\b${bank.split(' ')[0]}\\b`, 'gi'), ' ').replace(/\s+/g, ' ').trim()

  m = toTitleCase(m)
  return m.length > 0 ? m : undefined
}