"use client";
import { useState, useRef, useEffect, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";
import { getUserTransactionsClient, getUserIncomeClient, getUserExpensesClient, getUserRecurringExpensesClient, getBudgetsForMonthClient, addIncomeClient, addExpenseClient, upsertBudgetClient, getUserInstallmentsClient, addInstallmentClient, updateInstallmentClient, deleteInstallmentClient } from "@/lib/database-client";
import { ImportCenter } from "@/components/imports/ImportCenter";
import { IncomeSource, ExpenseCategory, PaymentMethod, type Installment } from "@/lib/types";
import {
  LayoutDashboard, ArrowLeftRight, Calendar, PieChart,
  BarChart2, Bot, Settings, Bell, Plus, X,
  TrendingUp, TrendingDown, AlertCircle, ChevronRight,
  Wallet, ShieldCheck, Timer, Home, Zap, Wifi, Dumbbell,
  ShoppingCart, Car, UtensilsCrossed, Heart,
  Search, Trash2,
  Info, Send, ChevronDown, ChevronLeft, LogOut,
  Download, User, ArrowUp, ArrowDown,
  Target, DollarSign, Sparkles, FileText, Pencil, Check,
  Camera, ScanLine,
  Smartphone
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie,
  Cell, Legend, ComposedChart
} from "recharts";
import { formatCurrency, currencySymbol } from "@/lib/format";
import { autoEnablePush, requestPushForDue, getPushStatus, notifPref, setNotifPref, NOTIF_PREF_BILLS, NOTIF_PREF_BUDGET, NOTIF_PREF_INCOME, type PushStatus } from "@/lib/push";
import { parseBankSms } from "@/lib/sms-parse";

// ── Types ──────────────────────────────────────────────────────────────────
type Page = "dashboard" | "transactions" | "upcoming" | "budgets" | "analytics" | "ai" | "installments" | "settings";
type Theme = "light" | "dark";

interface Colors {
  bg: string; sidebar: string; card: string; cardBorder: string;
  text: string; textSub: string; accent: string; accentLight: string;
  positive: string; danger: string; warning: string; inputBg: string; hover: string;
}

interface Transaction {
  id: string; date: string; description: string; category: string;
  amount: number; type: "income" | "expense"; method: string; notes?: string;
  source?: "transactions" | "income" | "expenses";
  importSource?: string; merchant?: string; bankName?: string;
}

const IMPORT_SOURCE_LABEL: Record<string, string> = { SMS: "SMS", RECEIPT: "Scan", AI_TEXT: "AI", CSV: "CSV", BANK_API: "Bank" };
const IMPORT_SOURCE_COLOR: Record<string, string> = { SMS: "#10b981", RECEIPT: "#06b6d4", AI_TEXT: "#0A193D", CSV: "#f59e0b", BANK_API: "#0A193D" };
const hasImportSource = (t: Transaction) => t.importSource && t.importSource !== "MANUAL";
interface UpcomingItem {
  id: string; name: string; amount: number; date: string;
  status: "Confirmed" | "Expected" | "Planned" | "Recurring";
  type: "income" | "expense"; icon: string; frequency?: string; kind?: "recurring" | "installment";
}
interface Budget {
  id: string; category: string; limit: number; spent: number; icon: string; color: string;
}
interface ChatMessage { role: "user" | "assistant"; content: string; }

const iconMap: Record<string, React.ReactNode> = {
  home: <Home size={16} />, zap: <Zap size={16} />, wifi: <Wifi size={16} />,
  dumbbell: <Dumbbell size={16} />, wallet: <Wallet size={16} />,
  "trending-up": <TrendingUp size={16} />, utensils: <UtensilsCrossed size={16} />,
  car: <Car size={16} />, shopping: <ShoppingCart size={16} />,
  heart: <Heart size={16} />, tv: <BarChart2 size={16} />,
};
const budgetIcon: Record<string, string> = { food: "utensils", transport: "car", rent: "home", utilities: "zap", shopping: "shopping", entertainment: "tv", health: "heart", subscriptions: "wifi", education: "wallet", family: "heart", travel: "plane" };
const budgetColor: Record<string, string> = { Food: "#0A193D", Transport: "#0A193D", Rent: "#06b6d4", Utilities: "#10b981", Shopping: "#f59e0b", Entertainment: "#ef4444", Health: "#f43f5e", Subscriptions: "#3b82f6" };
const budgetFallbackColors = ["#0A193D", "#0A193D", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#f43f5e", "#3b82f6", "#94a3b8"];

// ── Custom Tooltip ──────────────────────────────────────────────────────────
interface TooltipPayloadItem { name?: string; value?: number | string; color?: string }
function CustomTooltip({ active, payload, label, colors, currency }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string | number; colors?: { card: string; cardBorder: string; text: string }; currency: string }) {
  const tBg = colors?.card || "white";
  const tBorder = colors?.cardBorder || "#e2e8f0";
  const tText = colors?.text || "#1e293b";
  if (active && payload && payload.length) {
    return (
      <div style={{ background: tBg, border: `1px solid ${tBorder}`, borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.10)", fontSize: 13 }}>
        <p style={{ fontWeight: 600, marginBottom: 6, color: tText }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: "2px 0" }}>
            {p.name}: <b>{formatCurrency(Number(p.value || 0), currency)}</b>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function MonthPickerDropdown({ month, onMonthChange, colors, variant = "card" }: { month: string; onMonthChange: (m: string) => void; colors: Colors; variant?: "topbar" | "card" }) {
  const [show, setShow] = useState(false);
  const curMonth = new Date().toISOString().slice(0, 7);
  const label = new Date(month + "-01").toLocaleDateString("en-PK", { month: "long", year: "numeric" });
  const shift = (d: number) => {
    const [y, m] = month.split("-").map(Number);
    const dt = new Date(y, m - 1 + d, 1);
    onMonthChange(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
  };
  const btnStyle: React.CSSProperties = variant === "topbar"
    ? { display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: colors.card, color: colors.text, fontSize: 13, cursor: "pointer", fontWeight: 500 }
    : { display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.text, fontSize: 12, cursor: "pointer" };
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setShow(v => !v)} style={btnStyle}>
        {variant === "topbar" && <Calendar size={14} />}
        {label} <ChevronDown size={13} />
      </button>
      {show && (
        <>
          <div onClick={() => setShow(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
          <div style={{ position: "absolute", right: 0, top: 36, zIndex: 200, background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, boxShadow: "0 14px 40px rgba(0,0,0,0.18)", padding: 12, width: 250, backdropFilter: "blur(22px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => shift(-1)} title="Previous month" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ChevronLeft size={15} />
              </button>
              <input type="month" value={month} onChange={(e) => { if (e.target.value) onMonthChange(e.target.value); }} style={{ flex: 1, padding: "7px 8px", borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 12, outline: "none", fontFamily: "inherit" }} />
              <button onClick={() => shift(1)} title="Next month" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ChevronRight size={15} />
              </button>
            </div>
            {month !== curMonth && (
              <button onClick={() => onMonthChange(curMonth)} style={{ marginTop: 10, width: "100%", padding: "8px", borderRadius: 8, border: "none", background: "#0A193D", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Back to This Month</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────────────────────
export default function FinloApp() {
  const [page, setPage] = useState<Page>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "") as Page;
      if (["dashboard", "transactions", "upcoming", "budgets", "analytics", "ai", "installments", "settings"].includes(hash)) return hash;
      const saved = localStorage.getItem("finlo-page") as Page;
      if (["dashboard", "transactions", "upcoming", "budgets", "analytics", "ai", "installments", "settings"].includes(saved)) return saved;
    }
    return "dashboard";
  });
  const [theme, setTheme] = useState<Theme>("light");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<"income" | "expense">("expense");
  const [installmentPayTarget, setInstallmentPayTarget] = useState<Installment | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pushStatus, setPushStatus] = useState<PushStatus>("idle");
  const [showPushHint, setShowPushHint] = useState(false);
  const [pendingSms, setPendingSms] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const encoded = new URLSearchParams(window.location.search).get("sms");
      if (encoded) {
        try {
          return decodeURIComponent(atob(encoded.replace(/-/g, "+").replace(/_/g, "/")));
        } catch {
          /* ignore */
        }
      }
    }
    return null;
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const onChange = (e: MediaQueryListEvent) => setSidebarOpen(!e.matches);
    mq.addEventListener("change", onChange);
    const t = setTimeout(() => setSidebarOpen(!mq.matches), 0);
    return () => {
      mq.removeEventListener("change", onChange);
      clearTimeout(t);
    };
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("sms=")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("sms");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const r = await autoEnablePush();
      setPushStatus(r.status);
      setShowPushHint(r.armed);
      if (r.armed) {
        const t = setTimeout(() => setShowPushHint(false), 14000);
        window.addEventListener("pointerdown", () => setShowPushHint(false), { once: true });
        return () => clearTimeout(t);
      }
    })();
  }, []);
  const [hasAuth, setHasAuth] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [realTransactions, setRealTransactions] = useState<Transaction[]>([]);
  const [realRecurring, setRealRecurring] = useState<UpcomingItem[]>([]);
  const [realBudgets, setRealBudgets] = useState<Budget[]>([]);
  const [realInstallments, setRealInstallments] = useState<Installment[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dueAlert, setDueAlert] = useState<{ kind: "recurring" | "installment"; id: string; name: string; amount: number; date: string; overdue: number }[] | null>(null);
  const dueAlertKey = "finlo_due_alert_2x";
  const [autoClearMessages, setAutoClearMessages] = useState<{ title: string; body: string }[]>([]);
  const [smsPending, setSmsPending] = useState(0);

  const router = useRouter();
  const supabase = createClient();
  const [dashMonth, setDashMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const isDark = theme === "dark";

  const derivedIncome = realTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const derivedExpense = realTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const currentBalance = openingBalance + derivedIncome - derivedExpense;

  const nowMs = new Date().getTime();
  const notifications: { title: string; body: string; color: string; icon: ReactNode }[] = [];
  autoClearMessages.forEach((m) => {
    notifications.push({ title: m.title, body: m.body, color: "#10b981", icon: <Check size={15} /> });
  });
  const billsNotif = notifPref(NOTIF_PREF_BILLS, true);
  const budgetNotif = notifPref(NOTIF_PREF_BUDGET, true);
  realRecurring.forEach((r) => {
    if (!billsNotif) return;
    const ts = new Date(r.date).getTime();
    if (isNaN(ts)) return;
    const days = Math.round((ts - nowMs) / (24 * 60 * 60 * 1000));
    if (days < 0) {
      notifications.push({ title: `Overdue: ${r.name}`, body: `Was due ${Math.abs(days)} day(s) ago — ${formatCurrency(Number(r.amount), currency)}`, color: "#ef4444", icon: <AlertCircle size={15} /> });
    } else if (days <= 2) {
      notifications.push({ title: `Due ${days <= 0 ? "today" : days === 1 ? "tomorrow" : "in 2 days"}: ${r.name}`, body: `${formatCurrency(Number(r.amount), currency)}`, color: "#f59e0b", icon: <Calendar size={15} /> });
    }
  });
  realInstallments.forEach((inst) => {
    if (!billsNotif) return;
    if (!inst.next_due_date || inst.status !== "active") return;
    const ts = new Date(inst.next_due_date).getTime();
    if (isNaN(ts)) return;
    const days = Math.round((ts - nowMs) / (24 * 60 * 60 * 1000));
    if (days < 0) {
      notifications.push({ title: `Installment overdue: ${inst.item_name}`, body: `Was due ${Math.abs(days)} day(s) ago — ${formatCurrency(Number(inst.monthly_installment), currency)} (${inst.paid_count}/${inst.total_months} paid)`, color: "#ef4444", icon: <AlertCircle size={15} /> });
    } else if (days <= 2) {
      notifications.push({ title: `Installment due ${days <= 0 ? "today" : days === 1 ? "tomorrow" : "in 2 days"}: ${inst.item_name}`, body: `${formatCurrency(Number(inst.monthly_installment), currency)} (${inst.paid_count}/${inst.total_months} paid)`, color: "#f59e0b", icon: <DollarSign size={15} /> });
    }
  });
  realBudgets.forEach((b) => {
    if (!budgetNotif) return;
    if (b.limit > 0 && b.spent / b.limit >= 0.8) {
      notifications.push({ title: `Budget alert: ${b.category}`, body: `${Math.round((b.spent / b.limit) * 100)}% used — ${formatCurrency(b.spent, currency)} of ${formatCurrency(b.limit, currency)}`, color: "#ef4444", icon: <Target size={15} /> });
    }
  });
  if (smsPending > 0) {
    notifications.unshift({ title: `SMS import: ${smsPending} transaction${smsPending > 1 ? "s" : ""} waiting to review`, body: "Open Settings → SMS Bank Import to confirm or edit before they're saved.", color: "#10b981", icon: <Smartphone size={15} /> });
  }

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/auth/login");
        return;
      }
      setHasAuth(true);
      const u = data.session.user;
      const n =
        (u.user_metadata?.full_name as string) ||
        (u.user_metadata?.name as string) ||
        u.email?.split("@")[0] ||
        "";
      setUserName(n);
      setUserEmail(u.email || "");
      setTheme("light");
      const savedCurrency = u.user_metadata?.currency as string;
      setCurrency(savedCurrency || "PKR");
      const savedOpeningBalance = u.user_metadata?.opening_balance;
      setOpeningBalance(typeof savedOpeningBalance === "number" ? savedOpeningBalance : 0);
    };
    checkAuth();
  }, [supabase.auth, router]);

  useEffect(() => {
    if (!hasAuth) return;
    const load = async () => {
      try {
      const [txns, incomes, expenses] = await Promise.all([
        getUserTransactionsClient(),
        getUserIncomeClient(),
        getUserExpensesClient(),
      ]);

      const allTxns: { id: string; date: string; description: string; category: string; amount: number; type: "income" | "expense"; method: string; source: "transactions" | "income" | "expenses" }[] = [
        ...txns.map((t) => ({
          id: t.id,
          date: t.date,
          description: t.description || (t.type === "income" ? `Income - ${t.category || "Other"}` : `Expense - ${t.category || "Other"}`),
          category: (t.category as string) || "Other",
          amount: Number(t.amount),
          type: t.type as "income" | "expense",
          method: t.payment_method || "other",
          source: "transactions" as const,
          importSource: (t.source as string) || undefined,
          merchant: t.merchant || undefined,
          bankName: t.bank_name || undefined,
        })),
        ...incomes.map((inc) => ({
          id: inc.id,
          date: inc.date,
          description: inc.notes || `Income - ${inc.source || "Other"}`,
          category: inc.source || "other",
          amount: Number(inc.amount),
          type: "income" as const,
          method: "other",
          source: "income" as const,
        })),
        ...expenses.map((exp) => ({
          id: exp.id,
          date: exp.date,
          description: exp.description || `Expense - ${exp.category || "Other"}`,
          category: (exp.category as string) || "Other",
          amount: Number(exp.amount),
          type: "expense" as const,
          method: exp.payment_method || "other",
          source: "expenses" as const,
        })),
      ].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

      setRealTransactions(allTxns);
      const recs = await getUserRecurringExpensesClient();
      setRealRecurring(
        recs.map((r) => ({
          id: r.id,
          name: r.name,
          amount: Number(r.amount),
          date: r.next_due_date,
          status: "Recurring" as const,
          type: "expense" as const,
          icon: budgetIcon[r.category] || "wallet",
          frequency: r.frequency,
        }))
      );

      const cleared: { title: string; body: string }[] = [];
      const expensesOnly = allTxns.filter((t) => t.type === "expense");
      const nowDate = new Date();
      for (const r of recs) {
        const dueDate = new Date(r.next_due_date);
        if (isNaN(dueDate.getTime())) continue;
        const dueMonth = dueDate.toISOString().slice(0, 7);
        const dueMonthEnd = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getTime();
        const isDueThisMonthOrOverdue = dueDate.getTime() <= nowDate.getTime() || dueMonth === nowDate.toISOString().slice(0, 7);
        if (!isDueThisMonthOrOverdue) continue;
        const rName = String(r.name || "").toLowerCase();
        const match = expensesOnly.find((t) => {
          if (!t.date) return false;
          const tMonth = t.date.slice(0, 7);
          if (tMonth !== dueMonth) return false;
          const tDesc = String(t.description || "").toLowerCase();
          if (rName.length < 3 || !(tDesc.includes(rName) || rName.includes(tDesc))) return false;
          if (Math.abs(Number(t.amount) - Number(r.amount)) > 5) return false;
          return true;
        });
        if (match && dueDate.getTime() <= dueMonthEnd) {
          const next = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, dueDate.getDate()).toISOString().slice(0, 10);
          await supabase.from("recurring_expenses").update({ next_due_date: next }).eq("id", r.id).throwOnError();
          cleared.push({ title: `Auto-paid: ${r.name}`, body: `Matched expense "${match.description}" (${formatCurrency(Number(match.amount), currency)}) — moved to next month.` });
        }
      }
      if (cleared.length > 0) {
        setAutoClearMessages(cleared);
      }
      const month = new Date().toISOString().slice(0, 7);
      const bdgs = await getBudgetsForMonthClient(month);
      const spentByCat: Record<string, number> = {};
      allTxns.filter((t) => t.type === "expense").forEach((t) => {
        const cat = t.category || "Other";
        spentByCat[cat] = (spentByCat[cat] || 0) + Number(t.amount);
      });
      setRealBudgets(
        bdgs.map((b, i) => {
          const key = b.category.charAt(0).toUpperCase() + b.category.slice(1);
          const spent = spentByCat[b.category] || spentByCat[key] || 0;
          return {
            id: b.id,
            category: key,
            limit: Number(b.limit_amount),
            spent,
            icon: budgetIcon[b.category] || "wallet",
            color: budgetColor[key] || budgetFallbackColors[i % budgetFallbackColors.length],
          };
        })
      );
const insts = await getUserInstallmentsClient();
      setRealInstallments(insts);
      const urgent = [
        ...recs.map((r) => ({ kind: "recurring" as const, id: r.id, name: r.name, amount: Number(r.amount), date: String(r.next_due_date || "") })),
        ...insts.filter((i) => i.status === "active" && i.next_due_date)
          .map((i) => ({ kind: "installment" as const, id: i.id, name: `Installment: ${i.item_name}`, amount: Number(i.monthly_installment), date: String(i.next_due_date || "") })),
      ]
        .filter((x) => !!x.date)
        .map((x) => ({ ...x, overdue: Math.round((new Date(x.date).getTime() - Date.now()) / 86400000) }))
        .filter((x) => x.overdue <= 0)
        .sort((a, b) => a.date.localeCompare(b.date));
      if (urgent.length > 0) {
        const today = new Date().toISOString().slice(0, 10);
        let rec = { d: "", c: 0 };
        try {
          const raw = localStorage.getItem(dueAlertKey);
          if (raw) rec = JSON.parse(raw) as { d: string; c: number };
        } catch {
          rec = { d: "", c: 0 };
        }
        if (rec.d !== today) rec = { d: today, c: 0 };
        if (rec.c < 2) {
          rec.c += 1;
          try { localStorage.setItem(dueAlertKey, JSON.stringify(rec)); } catch { /* ignore */ }
          setDueAlert(urgent);
          void requestPushForDue(urgent);
        }
      }
      try {
        const pendingRes = await fetch("/api/import/pending");
        if (pendingRes.ok) {
          const j = (await pendingRes.json()) as { items?: unknown[] };
          setSmsPending(Array.isArray(j.items) ? j.items.length : 0);
        }
      } catch {
        setSmsPending(0);
      }
      } catch { /* transient network/auth error, next poll will retry */ }
    };
    load();

    let channel: RealtimeChannel | null = null;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      const onChange = () => {
        load();
      };
      const c = supabase.channel("main-dashboard-realtime");
      c.on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${uid}` }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "income", filter: `user_id=eq.${uid}` }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `user_id=eq.${uid}` }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "recurring_expenses", filter: `user_id=eq.${uid}` }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "budgets", filter: `user_id=eq.${uid}` }, onChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "installments", filter: `user_id=eq.${uid}` }, onChange)
        .subscribe();
      channel = c;
    });
    const poll = setInterval(() => {
      load();
    }, 3000);
    return () => {
      clearInterval(poll);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [hasAuth, supabase, currency]);

  if (!hasAuth) {
    return null;
  }

  const displayName = userName || "User";
  const userFirstName = displayName.split(" ")[0] || "User";

  const handleCurrencyChange = (c: string) => {
    setCurrency(c);
    supabase.auth.updateUser({ data: { currency: c } }).catch(() => {});
  };

  const saveOpeningBalance = (value: number) => {
    setOpeningBalance(value);
    supabase.auth.updateUser({ data: { opening_balance: value } }).catch(() => {});
  };

  const adjustOpeningBalance = (delta: number) => {
    const next = Math.max(0, openingBalance + delta);
    setOpeningBalance(next);
    supabase.auth.updateUser({ data: { opening_balance: next } }).catch(() => {});
  };

  const handleDeleteTransaction = async (id: string, source?: "transactions" | "income" | "expenses") => {
    const table = source === "income" ? "income" : source === "expenses" ? "expenses" : "transactions";
    await supabase.from(table).delete().eq("id", id).throwOnError();
  };

  const handleAddBudget = async (category: string, limitAmount: number) => {
    const month = new Date().toISOString().slice(0, 7);
    await upsertBudgetClient({ category: category.toLowerCase() as ExpenseCategory, limit_amount: limitAmount, month });
    const bdgs = await getBudgetsForMonthClient(month);
    const spentByCat: Record<string, number> = {};
    realTransactions.filter((t) => t.type === "expense").forEach((t) => {
      const spentCat = t.category || "Other";
      spentByCat[spentCat] = (spentByCat[spentCat] || 0) + Number(t.amount);
    });
    setRealBudgets(
      bdgs.map((b, i) => {
        const key = b.category.charAt(0).toUpperCase() + b.category.slice(1);
        const spent = spentByCat[b.category] || spentByCat[key] || 0;
        return {
          id: b.id,
          category: key,
          limit: Number(b.limit_amount),
          spent,
          icon: budgetIcon[b.category] || "wallet",
          color: budgetColor[key] || budgetFallbackColors[i % budgetFallbackColors.length],
        };
      })
    );
  };

  const markRecurringPaid = async (id: string, frequency?: string) => {
    const freqDays: Record<string, number> = { daily: 1, weekly: 7, "bi-weekly": 14, monthly: 30, quarterly: 90, yearly: 365 };
    const days = freqDays[frequency || "monthly"] || 30;
    const { data } = await supabase.from("recurring_expenses").select("next_due_date").eq("id", id).single();
    const base = data?.next_due_date ? new Date(data.next_due_date) : new Date();
    const next = new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await supabase.from("recurring_expenses").update({ next_due_date: next }).eq("id", id).throwOnError();
  };

  const handleAddInstallment = async (data: { item_name: string; total_price: number; down_payment: number; monthly_installment: number; total_months: number; total_interest: number; next_due_date?: string; notes?: string }) => {
    await addInstallmentClient({ ...data, paid_count: 0, frequency: "monthly", status: "active" });
    setRealInstallments(await getUserInstallmentsClient());
  };

  const handleMarkInstallmentPaid = async (target: Installment) => {
    const { data: planRow } = await supabase.from("installments").select("paid_count,total_months,next_due_date").eq("id", target.id).single();
    const currentPaid = Number(planRow?.paid_count) || 0;
    const totalMonths = Number(planRow?.total_months) || 1;
    const paid = currentPaid + 1;
    if (paid >= totalMonths) {
      await updateInstallmentClient(target.id, { paid_count: paid, status: "completed", next_due_date: null });
    } else {
      const base = planRow?.next_due_date ? new Date(planRow.next_due_date) : new Date();
      const next = new Date(base.getFullYear(), base.getMonth() + 1, base.getDate()).toISOString().slice(0, 10);
      await updateInstallmentClient(target.id, { paid_count: paid, next_due_date: next });
    }
    setRealInstallments(await getUserInstallmentsClient());
  };

  const handleDeleteInstallment = async (id: string) => {
    const { data: plan } = await supabase.from("installments").select("item_name").eq("id", id).single();
    const item = (plan?.item_name as string) || "";
    if (item) {
      const { error: delErr } = await supabase
        .from("expenses")
        .delete()
        .ilike("title", `Installment: ${item}`);
      if (delErr) console.error("Failed to delete installment expenses:", delErr.message);
    }
    await deleteInstallmentClient(id);
    setRealInstallments(await getUserInstallmentsClient());
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const colors: Colors = {
    bg: isDark ? "linear-gradient(160deg,#0b1220 0%,#111a35 55%,#0b1024 100%)" : "#FEFBFE",
    sidebar: isDark ? "#1e293b" : "#ffffff",
    card: isDark ? "linear-gradient(145deg,rgba(43,55,84,0.7),rgba(26,34,60,0.42))" : "linear-gradient(145deg,rgba(255,255,255,0.85),rgba(255,255,255,0.45))",
    cardBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.7)",
    text: isDark ? "#f1f5f9" : "#0f172a",
    textSub: isDark ? "#94a3b8" : "#64748b",
    accent: "#0A193D",
    accentLight: isDark ? "rgba(10,25,61,0.18)" : "rgba(10,25,61,0.08)",
    positive: "#10b981",
    danger: "#ef4444",
    warning: "#f59e0b",
    inputBg: isDark ? "rgba(15,23,42,0.5)" : "rgba(255,255,255,0.65)",
    hover: isDark ? "#334155" : "#f1f5f9",
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "transactions", label: "Transactions", icon: <ArrowLeftRight size={18} /> },
    { id: "upcoming", label: "Upcoming", icon: <Calendar size={18} /> },
    { id: "budgets", label: "Budgets", icon: <PieChart size={18} /> },
    { id: "analytics", label: "Analytics", icon: <BarChart2 size={18} /> },
    { id: "ai", label: "AI Assistant", icon: <Bot size={18} /> },
    { id: "installments", label: "Installments", icon: <DollarSign size={18} /> },
    { id: "settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  const mobileTabs = [
    { id: "dashboard" as Page, label: "Home", icon: <LayoutDashboard size={18} /> },
    { id: "transactions" as Page, label: "Money", icon: <ArrowLeftRight size={18} /> },
    { id: "upcoming" as Page, label: "Upcoming", icon: <Calendar size={18} /> },
    { id: "budgets" as Page, label: "Budgets", icon: <PieChart size={18} /> },
    { id: "installments" as Page, label: "Install", icon: <DollarSign size={18} /> },
    { id: "analytics" as Page, label: "Analytics", icon: <BarChart2 size={18} /> },
  ];

  const navigateTo = (next: Page) => {
    setPage(next);
    try {
      localStorage.setItem("finlo-page", next);
      if (window.location.hash !== `#${next}`) {
        window.history.replaceState(null, "", `#${next}`);
      }
    } catch {}
  };

  function timeGreeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Good morning";
    if (h >= 12 && h < 17) return "Good afternoon";
    if (h >= 17 && h < 21) return "Good evening";
    return "Good night";
  }

  function timeEmoji() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "🌅";
    if (h >= 12 && h < 17) return "☀️";
    if (h >= 17 && h < 21) return "🌇";
    return "🌙";
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: colors.bg, color: colors.text, fontFamily: "'Montserrat', -apple-system, sans-serif", fontSize: 14 }}>
      {/* ── Left Sidebar - floating glass ── */}
      <aside className={`finlo-dash-aside ${sidebarOpen ? "open" : ""}`} style={{
        width: sidebarOpen ? 220 : 64,
        background: isDark ? "rgba(28,29,40,0.72)" : "rgba(255,255,255,0.66)",
        backdropFilter: "blur(18px) saturate(160%)",
        WebkitBackdropFilter: "blur(18px) saturate(160%)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)"}`,
        borderRadius: 18, overflow: "hidden",
        boxShadow: isDark ? "0 14px 44px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)" : "0 14px 44px rgba(31,45,90,0.14), inset 0 1px 0 rgba(255,255,255,0.9)",
        display: "flex", flexDirection: "column",
        transition: "width 0.16s", position: "fixed", left: 12, top: 12,
        height: "calc(100vh - 24px)", minHeight: 0, flexShrink: 0, zIndex: 10
      }}>
        {/* Logo */}
        <div style={{ padding: "22px 18px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          {sidebarOpen ? (
            <Image src="/finlo-logo-horizontal.png" alt="Finlo" width={157} height={52} quality={100} style={{ height: "auto", display: "block" }} />
          ) : (
            <Image src="/finlo-brand-mark.png" alt="Finlo" width={36} height={36} quality={100} style={{ objectFit: "contain", display: "block" }} />
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 10px" }}>
          {navItems.map(item => {
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => navigateTo(item.id as Page)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 11,
                  padding: "10px 10px", borderRadius: 9, border: "none", cursor: "pointer",
                  background: active ? (isDark ? "rgba(10,25,61,0.24)" : "rgba(10,25,61,0.13)") : "transparent",
                  color: active ? colors.accent : colors.textSub,
                  fontWeight: active ? 600 : 400, fontSize: 13.5,
                  boxShadow: active ? (isDark ? "inset 0 1px 0 rgba(255,255,255,0.1)" : "inset 0 1px 0 rgba(255,255,255,0.9)") : "none",
                  marginBottom: 2, transition: "all 0.12s", textAlign: "left",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = colors.hover; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        </aside>

      {sidebarOpen && <div className="finlo-dash-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main ── */}
      <div className="finlo-dash-maincol" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, paddingLeft: sidebarOpen ? 244 : 76, transition: "padding-left 0.16s" }}>
        {/* Topbar */}
        <header className="finlo-dash-topbar" style={{
          margin: "14px 20px", borderRadius: 22,
          padding: "0 28px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.75)"}`,
          background: isDark ? "rgba(28,29,40,0.5)" : "rgba(255,255,255,0.5)",
          backdropFilter: "blur(34px) saturate(220%)",
          WebkitBackdropFilter: "blur(34px) saturate(220%)",
          boxShadow: isDark ? "0 18px 54px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.14)" : "0 18px 54px rgba(31,45,90,0.18), inset 0 1px 0 rgba(255,255,255,0.95)",
          position: "sticky", top: 14, zIndex: 9
        }}>
          <div style={{ minWidth: 0, flex: 1, marginRight: 8, overflow: "hidden" }}>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {page === "dashboard" && `${timeGreeting()}, ${userFirstName} ${timeEmoji()}`}
              {page === "transactions" && "Transactions"}
              {page === "upcoming" && "Upcoming"}
              {page === "budgets" && "Budgets"}
              {page === "analytics" && "Analytics"}
              {page === "ai" && "AI Assistant"}
              {page === "installments" && "Installments"}
              {page === "settings" && "Settings"}
            </div>
            <div style={{ fontSize: 12, color: colors.textSub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {page === "dashboard" ? "Here's your financial overview" : ""}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {page === "dashboard" && (
              <MonthPickerDropdown month={dashMonth} onMonthChange={setDashMonth} colors={colors} variant="topbar" />
            )}
            <button onClick={() => navigateTo("settings")} title="Settings" style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: colors.card, color: page === "settings" ? colors.accent : colors.textSub, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Settings size={16} />
            </button>
            <button onClick={() => setShowNotifications(v => !v)} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: colors.card, color: colors.textSub, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
              <Bell size={16} />
              {notifications.length > 0 && <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%", background: "#ef4444" }} />}
            </button>
            {showNotifications && (
              <>
                <div onClick={() => setShowNotifications(false)} style={{ position: "fixed", inset: 0, zIndex: 200 }} />
                <div style={{ position: "fixed", top: 80, right: 16, width: 340, maxWidth: "calc(100vw - 32px)", maxHeight: 420, overflowY: "auto", background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 14, boxShadow: "0 20px 50px rgba(0,0,0,0.25)", padding: "16px", zIndex: 201 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: colors.text }}>Notifications</div>
                  {notifications.length === 0 ? (
                    <div style={{ fontSize: 13, color: colors.textSub, padding: "12px 4px" }}>No notifications right now. You are all caught up. ✓</div>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < notifications.length - 1 ? `1px solid ${colors.cardBorder}` : "none", alignItems: "flex-start" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${n.color}1a`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{n.icon}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{n.title}</div>
                          <div style={{ fontSize: 12, color: colors.textSub, marginTop: 2 }}>{n.body}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="finlo-dash-main" style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
          {page === "dashboard" && <DashboardPage colors={colors} transactions={realTransactions} recurring={realRecurring} installments={realInstallments} budgets={realBudgets} openingBalance={openingBalance} onEditBalance={() => setShowBalanceModal(true)} onViewAllUpcoming={() => navigateTo("upcoming")} onViewAllTransactions={() => navigateTo("transactions")} onMarkPaid={markRecurringPaid} onMarkInstallment={(inst) => { setInstallmentPayTarget(inst); setAddType("expense"); setShowAddModal(true); }} currency={currency} month={dashMonth} onMonthChange={setDashMonth} />}
          {page === "transactions" && <TransactionsPage colors={colors} transactions={realTransactions} onDeleteTransaction={handleDeleteTransaction} currency={currency} />}
          {page === "upcoming" && <UpcomingPage colors={colors} transactions={realTransactions} recurring={realRecurring} installments={realInstallments} supabase={supabase} onPayInstallment={(id) => { const inst = realInstallments.find((i) => i.id === id); if (inst) { setInstallmentPayTarget(inst); setAddType("expense"); setShowAddModal(true); } }} onDeleteInstallment={handleDeleteInstallment} currency={currency} />}
          {page === "budgets" && <BudgetsPage colors={colors} budgets={realBudgets} currency={currency} onAddBudget={handleAddBudget} />}
          {page === "analytics" && <AnalyticsPage colors={colors} transactions={realTransactions} currency={currency} />}
          {page === "ai" && <AIPage colors={colors} transactions={realTransactions} currency={currency} />}
          {page === "installments" && <InstallmentsPage colors={colors} installments={realInstallments} onAdd={handleAddInstallment} onMarkPaid={(inst) => { setInstallmentPayTarget(inst); setAddType("expense"); setShowAddModal(true); }} onDelete={handleDeleteInstallment} currency={currency} />}
          {page === "settings" && <SettingsPage colors={colors} displayName={displayName} userEmail={userEmail} onSignOut={handleSignOut} currency={currency} onCurrencyChange={handleCurrencyChange} supabase={supabase} />}
        </main>
      </div>

      {/* FAB - AI on top, Add below */}
      <div className="finlo-dash-fab" style={{ position: "fixed", bottom: 28, right: 28, zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => navigateTo("ai")}
          style={{ width: 46, height: 46, borderRadius: "50%", background: isDark ? "linear-gradient(135deg,#334155,#142453)" : "linear-gradient(135deg,#142453,#0A193D)", border: `2px solid ${colors.card}`, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(10,25,61,0.4)", transition: "transform 0.12s" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
          title="AI Assistant"
        >
          <Bot size={20} />
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#142453,#0A193D)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(10,25,61,0.4)", transition: "transform 0.12s" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
          title="Add"
        >
          <Plus size={22} />
        </button>
        <a
          href={"https://wa.me/923422866127?text=" + encodeURIComponent("Assalam o Alaikum! Finlo app ke baare mein baat karni hai.")}
          target="_blank"
          rel="noopener noreferrer"
          style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#25D366,#128C7E)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 20px rgba(18,140,126,0.45)", transition: "transform 0.12s" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
          title="WhatsApp Support"
        >
          <svg width="24" height="24" viewBox="0 0 32 32" fill="#ffffff" aria-hidden="true">
            <path d="M16.004 3C8.826 3 3 8.826 3 16.004c0 2.293.6 4.535 1.742 6.508L3 29l6.681-1.727a12.96 12.96 0 0 0 6.323 1.61h.005C23.182 28.883 29 23.059 29 15.881 29 12.195 27.605 8.79 25.091 6.28A12.88 12.88 0 0 0 16.004 3zm0 23.733h-.004c-2.112 0-4.185-.567-5.974-1.637l-.428-.254-3.966 1.025 1.058-3.866-.279-.445a10.74 10.74 0 0 1-1.645-5.72c0-5.913 4.811-10.723 10.727-10.723 2.865 0 5.558 1.116 7.583 3.143a10.65 10.65 0 0 1 3.14 7.584c0 5.912-4.81 10.72-10.721 10.72zm5.888-8.03c-.323-.161-1.91-.943-2.206-1.05-.295-.108-.511-.161-.726.161-.215.322-.833 1.05-1.021 1.266-.188.215-.376.242-.699.08-.323-.161-1.362-.502-2.594-1.6-.959-.856-1.607-1.913-1.795-2.236-.188-.323-.02-.498.141-.658.145-.145.322-.376.484-.564.161-.188.215-.322.322-.537.108-.215.054-.403-.027-.564-.08-.161-.726-1.75-.995-2.396-.262-.63-.527-.544-.726-.554l-.618-.011a1.188 1.188 0 0 0-.862.403c-.296.323-1.129 1.103-1.129 2.69 0 1.586 1.156 3.119 1.318 3.334.161.215 2.275 3.475 5.513 4.872.77.332 1.371.531 1.84.68.773.245 1.477.211 2.033.128.62-.093 1.91-.781 2.179-1.535.269-.754.269-1.4.188-1.535-.08-.134-.295-.215-.618-.377z" />
          </svg>
        </a>
      </div>

      {/* Mobile bottom tab bar - glass liquid */}
      <div className="finlo-dash-bottomnav" style={{
        position: "fixed", left: 14, right: 14,
        bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        height: 62, borderRadius: 26,
        background: isDark ? "rgba(28,29,40,0.68)" : "rgba(255,255,255,0.72)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.65)"}`,
        boxShadow: isDark ? "0 14px 44px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)" : "0 14px 44px rgba(31,45,90,0.18), inset 0 1px 0 rgba(255,255,255,0.9)",
        backdropFilter: "blur(22px) saturate(180%)",
        WebkitBackdropFilter: "blur(22px) saturate(180%)",
        alignItems: "center", justifyContent: "space-around",
        zIndex: 30,
      }}>
        {mobileTabs.map(tab => {
          const active = page === tab.id;
          return (
            <button key={tab.id} onClick={() => { setSidebarOpen(false); navigateTo(tab.id); }}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "7px 4px", border: "none", cursor: "pointer", transition: "all 0.2s ease",
                background: active ? (isDark ? "rgba(10,25,61,0.26)" : "rgba(10,25,61,0.14)") : "transparent",
                borderRadius: 18, transform: active ? "translateY(-2px)" : "none",
                color: active ? colors.accent : colors.textSub, fontSize: 10, fontWeight: active ? 700 : 500,
                fontFamily: "inherit",
                boxShadow: active ? (isDark ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 16px rgba(10,25,61,0.38)" : "inset 0 1px 0 rgba(255,255,255,0.95), 0 6px 16px rgba(10,25,61,0.3)") : "none",
              }}>
              <span style={{ transition: "transform 0.2s ease", transform: active ? "scale(1.12)" : "scale(1)" }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Push hint chip */}
      {showPushHint && pushStatus !== "enabled" && (
        <div style={{ position: "fixed", bottom: "calc(86px + env(safe-area-inset-bottom, 0px))", left: "50%", transform: "translateX(-50%)", zIndex: 220, background: isDark ? "rgba(28,29,40,0.92)" : "rgba(255,255,255,0.95)", border: `1px solid ${colors.cardBorder}`, borderRadius: 999, padding: "10px 16px", boxShadow: "0 10px 30px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600, color: colors.text, cursor: "pointer", backdropFilter: "blur(12px)", pointerEvents: "auto" }}>
          <span style={{ fontSize: 15 }}>🔔</span>
          <span>Tap anywhere to allow notifications</span>
        </div>
      )}

      {/* SMS auto-add modal */}
      {pendingSms !== null && (
        <SmsAddModal colors={colors} currency={currency} initialText={pendingSms} onClose={() => setPendingSms(null)} />
      )}

      {/* Add Modal */}
      {showAddModal && <AddModal colors={colors} onClose={() => { setShowAddModal(false); setInstallmentPayTarget(null); }} addType={addType} setAddType={setAddType} recurringNames={realRecurring.map((r) => r.name)} currency={currency} installmentTarget={installmentPayTarget} onMarkInstallmentPaid={handleMarkInstallmentPaid} onPasteSms={() => setPendingSms("")} />}

      {/* Balance Modal */}
      {showBalanceModal && <BalanceModal colors={colors} initialBalance={openingBalance} currentBalance={currentBalance} onClose={() => setShowBalanceModal(false)} onSave={saveOpeningBalance} onAdjust={adjustOpeningBalance} currency={currency} />}

      {/* Due payments alert */}
      {dueAlert && dueAlert.length > 0 && (
        <div onClick={() => setDueAlert(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 220, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(440px, 100%)", borderRadius: 20, background: colors.card, border: `1px solid ${colors.cardBorder}`, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: colors.text }}>Payments due 🔔</span>
              <button onClick={() => setDueAlert(null)} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: colors.inputBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: colors.textSub }}><X size={15} /></button>
            </div>
            <div style={{ fontSize: 12.5, color: colors.textSub, marginBottom: 14 }}>
              {dueAlert.length === 1 ? "1 payment needs attention today." : `${dueAlert.length} payments need attention today.`} Tap one to view it.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
              {dueAlert.map((it) => {
                const isOverdue = it.overdue < 0;
                const accent = isOverdue ? "#ef4444" : "#f59e0b";
                const badge = isOverdue ? `${Math.abs(it.overdue)}d overdue` : "Due today";
                return (
                  <button key={`${it.kind}-${it.id}`} onClick={() => { setDueAlert(null); navigateTo(it.kind === "installment" ? "installments" : "upcoming"); }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "12px 14px", borderRadius: 12, border: "none", background: `${accent}0d`, borderLeft: `3px solid ${accent}`, cursor: "pointer" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: `${accent}1a`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, flexShrink: 0 }}>
                      {it.kind === "installment" ? <DollarSign size={15} /> : <Calendar size={15} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</div>
                      <div style={{ fontSize: 11, color: colors.textSub }}>{it.date}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: colors.text }}>{formatCurrency(it.amount, currency)}</div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: accent }}>{badge}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={() => { setDueAlert(null); navigateTo("upcoming"); }} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#0A193D", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>View Upcoming</button>
              <button onClick={() => setDueAlert(null)} style={{ padding: "11px 18px", borderRadius: 10, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.textSub, fontSize: 13.5, cursor: "pointer" }}>Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard Page ──────────────────────────────────────────────────────────
function DashboardPage({ colors, transactions, recurring, installments, budgets, openingBalance, onEditBalance, onViewAllUpcoming, onViewAllTransactions, onMarkPaid, onMarkInstallment, currency, month, onMonthChange }: { colors: Colors; transactions: Transaction[]; recurring: UpcomingItem[]; installments: Installment[]; budgets: Budget[]; openingBalance: number; onEditBalance: () => void; onViewAllUpcoming: () => void; onViewAllTransactions: () => void; onMarkPaid: (id: string, frequency?: string) => Promise<void>; onMarkInstallment: (inst: Installment) => void; currency: string; month: string; onMonthChange: (m: string) => void }) {
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [monthBudgets, setMonthBudgets] = useState<Budget[] | null>(null);
  const curMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    let active = true;
    if (month === curMonth) { setMonthBudgets(null); return; }
    getBudgetsForMonthClient(month)
      .then((bdgs) => {
        if (!active) return;
        const spentByCatM: Record<string, number> = {};
        transactions
          .filter((t) => t.type === "expense" && (t.date || "").slice(0, 7) === month)
          .forEach((t) => {
            const cat = t.category || "Other";
            spentByCatM[cat] = (spentByCatM[cat] || 0) + Number(t.amount);
          });
        setMonthBudgets(
          bdgs.map((b, i) => {
            const key = b.category.charAt(0).toUpperCase() + b.category.slice(1);
            const spent = spentByCatM[b.category] || spentByCatM[key] || 0;
            return {
              id: b.id,
              category: key,
              limit: Number(b.limit_amount),
              spent,
              icon: budgetIcon[b.category] || "wallet",
              color: budgetColor[key] || budgetFallbackColors[i % budgetFallbackColors.length],
            };
          })
        );
      })
      .catch(() => {});
    return () => { active = false; };
  }, [month, transactions]);

  const nowMs = new Date().getTime();
  const upcomingRecurring = recurring
    .map((r) => ({ ...r, ts: new Date(r.date).getTime() }))
    .filter((r) => !isNaN(r.ts) && r.ts >= nowMs - 24 * 60 * 60 * 1000)
    .sort((a, b) => a.ts - b.ts);
  const next7Days = upcomingRecurring.filter((r) => r.ts - nowMs <= 7 * 24 * 60 * 60 * 1000);
  const overdueRecurring = recurring
    .map((r) => ({ ...r, ts: new Date(r.date).getTime() }))
    .filter((r) => !isNaN(r.ts) && r.ts < nowMs - 24 * 60 * 60 * 1000);
  const totalUpcoming7 = next7Days.reduce((s, r) => s + r.amount, 0);
  const totalOverdue = overdueRecurring.reduce((s, r) => s + r.amount, 0);
  const curMonthDash = new Date().toISOString().slice(0, 7);
  const checkPaidDash = (r: { name: string; amount: number }) => {
    const rName = (r.name || "").toLowerCase();
    if (rName.length < 3) return false;
    return transactions.some((t) => {
      if (t.type !== "expense") return false;
      if ((t.date || "").slice(0, 7) !== curMonthDash) return false;
      const tDesc = (t.description || "").toLowerCase();
      if (!(tDesc.includes(rName) || rName.includes(tDesc))) return false;
      if (Math.abs(t.amount - r.amount) > 5) return false;
      return true;
    });
  };
  const installmentItems = installments
    .filter((i) => i.status === "active" && i.next_due_date)
    .map((i) => ({
      id: i.id,
      name: `Installment: ${i.item_name}`,
      amount: Number(i.monthly_installment),
      date: i.next_due_date as string,
      status: "Recurring" as const,
      type: "expense" as const,
      icon: "wallet",
      kind: "installment" as const,
      ts: new Date(i.next_due_date as string).getTime(),
    }))
    .filter((x) => !isNaN(x.ts));
  const upcomingList = [...upcomingRecurring, ...overdueRecurring, ...installmentItems].sort((a, b) => {
    const aPaid = checkPaidDash(a);
    const bPaid = checkPaidDash(b);
    if (aPaid !== bPaid) return aPaid ? 1 : -1;
    return a.ts - b.ts;
  }).slice(0, 5);

  const fmtDateShort = (d: string) => {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = openingBalance + totalIncome - totalExpenses;
  const fmt = (n: number) => formatCurrency(n, currency);
  const monthTxns = transactions.filter((t) => (t.date || "").slice(0, 7) === month);
  const monthlyIncome = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const recent = [...monthTxns]
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const activeBudgets = month === curMonth ? budgets : (monthBudgets ?? []);
  const byCatMap: Record<string, number> = {};
  monthTxns
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const cat = (t.category || "Other").charAt(0).toUpperCase() + (t.category || "Other").slice(1);
      byCatMap[cat] = (byCatMap[cat] || 0) + t.amount;
    });
  const catColors = ["#0A193D", "#10b981", "#ef4444", "#06b6d4", "#f59e0b", "#0A193D", "#94a3b8"];
  const realSpendingByCategory = Object.entries(byCatMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value, color: catColors[i % catColors.length] }));
  const savings = Math.max(0, monthlyIncome - monthlyExpenses);
  const savingsPct = monthlyIncome > 0 ? Math.round((savings / monthlyIncome) * 100) : 0;

  const dateMap: Record<string, { income: number; expenses: number }> = {};
  monthTxns.forEach((t) => {
    const d = (t.date || "").slice(0, 10);
    if (!d) return;
    dateMap[d] = dateMap[d] || { income: 0, expenses: 0 };
    if (t.type === "income") dateMap[d].income += t.amount;
    else dateMap[d].expenses += t.amount;
  });
  const realCashFlowData = Object.keys(dateMap)
    .sort()
    .slice(-31)
    .map((d) => {
      const v = dateMap[d];
      const parts = d.split("-");
      const label = parts.length >= 2 ? `${parts[1]}/${parts[2]}` : d;
      return { date: label, income: v.income, expenses: v.expenses, net: v.income - v.expenses };
    });

  const now = new Date();
  const cutoff30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const last30Expenses = transactions
    .filter((t) => t.type === "expense" && t.date && t.date.slice(0, 10) >= cutoff30)
    .reduce((s, t) => s + t.amount, 0);
  const dailyExpense = last30Expenses > 0 ? last30Expenses / 30 : 0;
  const runwayDays = dailyExpense > 0 ? Math.floor(Math.max(0, balance) / dailyExpense) : 0;
  const safeToSpend = Math.max(dailyExpense, balance > 0 ? balance / 30 : 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Row 1: Balance + Stats */}
      <div className="finlo-dash-row1" style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
        {/* Balance row - 70% */}
        <div className="finlo-grid-70" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, flex: "0 0 70%" }}>
        {/* Current Balance */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: colors.textSub }}>Current Balance</span>
            <button onClick={onEditBalance} title="Set opening balance" style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: colors.inputBg, color: colors.textSub, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Pencil size={14} />
            </button>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-1px", marginBottom: 8, color: colors.text }}>{fmt(balance)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: "#10b981", fontSize: 12, fontWeight: 600 }}>{savingsPct}% saved</span>
            <span style={{ fontSize: 12, color: colors.textSub }}>this period</span>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                <ArrowUp size={13} color="#10b981" />
                <span style={{ fontSize: 11, color: colors.textSub }}>Income this month</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>{fmt(monthlyIncome)}</div>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                <ArrowDown size={13} color="#ef4444" />
                <span style={{ fontSize: 11, color: colors.textSub }}>Expenses this month</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>{fmt(monthlyExpenses)}</div>
            </div>
          </div>
        </div>

        {/* Safe to Spend */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: "linear-gradient(135deg,#142453,#0A193D)", color: "#fff", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", bottom: -30, left: -10, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, opacity: 0.9 }}>
              <Info size={14} /> Safe to Spend
            </div>
            <ShieldCheck size={18} style={{ opacity: 0.8 }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1px", marginBottom: 6, position: "relative" }}>{fmt(safeToSpend)}</div>
          <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.5, marginBottom: 14, position: "relative" }}>
            Estimated amount you can spend today while keeping upcoming commitments covered.
          </div>
          <button onClick={() => setShowCalcModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(6px)", position: "relative" }}>
            How is this calculated? <ChevronRight size={13} />
          </button>
        </div>

        {/* Money Runway */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: colors.textSub }}>
              <Info size={13} /> Money Runway
            </div>
            <Timer size={18} color={colors.textSub} />
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1px", marginBottom: 4, color: colors.text }}>{runwayDays} <span style={{ fontSize: 18, fontWeight: 600 }}>days</span></div>
          <div style={{ fontSize: 12, color: colors.textSub, marginBottom: 14 }}>
            Your balance covers about {Math.min(runwayDays, 30)} of the next 30 days
          </div>
          <div style={{ position: "relative", height: 6, borderRadius: 4, background: colors.inputBg, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${Math.min(100, (runwayDays / 30) * 100)}%`, borderRadius: 4, background: "linear-gradient(90deg,#142453,#0A193D)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: colors.textSub }}>
            <span>0 days</span><span>30+ days</span>
          </div>
        </div>
      </div>

        {/* Stats - Right side 2x2 grid */}
        <div className="finlo-grid-30" style={{ flex: "0 0 30%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            next7Days.length > 0
              ? { icon: <Calendar size={16} color="#0A193D" />, label: "Upcoming", value: fmt(totalUpcoming7), sub: `${next7Days.length} due`, bg: "rgba(10,25,61,0.08)" }
              : { icon: <Calendar size={16} color="#0A193D" />, label: "Upcoming", value: fmt(0), sub: "None due", bg: "rgba(10,25,61,0.08)" },
            overdueRecurring.length > 0
              ? { icon: <AlertCircle size={16} color="#ef4444" />, label: "Overdue", value: fmt(totalOverdue), sub: `${overdueRecurring.length} late`, bg: "rgba(239,68,68,0.08)" }
              : { icon: <AlertCircle size={16} color="#ef4444" />, label: "Overdue", value: "None", sub: "All clear", bg: "rgba(239,68,68,0.08)" },
            { icon: <Target size={16} color="#f59e0b" />, label: "Budgets", value: `${activeBudgets.filter((b) => b.spent <= b.limit).length}/${activeBudgets.length}`, sub: "On track", bg: "rgba(245,158,11,0.08)" },
            { icon: <TrendingUp size={16} color="#10b981" />, label: "Savings", value: fmt(savings), sub: `${savingsPct}%`, bg: "rgba(16,185,129,0.08)" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "14px 14px", borderRadius: 12, background: colors.card, border: `1px solid ${colors.cardBorder}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, color: colors.textSub, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 1, color: colors.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: colors.textSub }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: Charts + Upcoming */}
      <div className="finlo-grid-split" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        {/* Cash Flow Chart */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Finlo Finance Overview</span>
            <MonthPickerDropdown month={month} onMonthChange={onMonthChange} colors={colors} />
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
            {[{ color: "#10b981", label: "Income" }, { color: "#ef4444", label: "Expenses" }, { color: "#0A193D", label: "Net" }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: colors.textSub }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: "inline-block" }} />{l.label}
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={realCashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.cardBorder} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: colors.textSub }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: colors.textSub }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}K`} />
              <Tooltip content={<CustomTooltip colors={colors} currency={currency} />} />
              <Bar dataKey="income" fill="#10b981" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="net" stroke="#0A193D" strokeWidth={2} dot={{ fill: "#0A193D", r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Payments */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}`, containerType: "inline-size" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 8 }}>
            <span style={{ fontWeight: 700, whiteSpace: "nowrap", lineHeight: 1.25, fontSize: "clamp(11px, 2.9cqw, 15px)" }}>Upcoming Payments / Installments</span>
            <button onClick={onViewAllUpcoming} style={{ fontSize: "clamp(10px, 2.4cqw, 12px)", color: "#0A193D", background: "none", border: "none", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>View all</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {upcomingList.length === 0 ? (
              <div style={{ fontSize: 13, color: colors.textSub, padding: "16px 4px", textAlign: "center" }}>No upcoming payments or installments</div>
            ) : (
              upcomingList.map((p, i) => {
                const days = Math.round((p.ts - nowMs) / (24 * 60 * 60 * 1000));
                const isPaid = checkPaidDash(p);
                const isOverdue = !isPaid && days <= 0;
                const accent = isPaid ? "#10b981" : isOverdue ? "#ef4444" : "#f59e0b";
                const badge = isPaid ? "Paid ✓" : isOverdue ? "Overdue" : days <= 3 ? "Due soon" : `In ${days} days`;
                return (
                  <div key={p.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: `${accent}08`, borderLeft: `3px solid ${accent}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent}1a`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, flexShrink: 0 }}>{isPaid ? <Check size={15} /> : iconMap[p.icon] || <Wallet size={15} />}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: isPaid ? "#10b981" : colors.text }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: colors.textSub }}>{fmtDateShort(p.date)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: isPaid ? "#10b981" : colors.text }}>{fmt(p.amount)}</div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: accent }}>{badge}</span>
                    </div>
                    {!isPaid && (
                      <button
                        onClick={() => {
                          if (p.kind === "installment") {
                            const inst = installments.find((i) => i.id === p.id);
                            if (inst) onMarkInstallment(inst);
                          } else {
                            void onMarkPaid(p.id, p.frequency);
                          }
                        }}
                        title="Mark as paid / clear"
                        style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(16,185,129,0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Recent Transactions + Spending by Category */}
      <div className="finlo-grid-split" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
        {/* Transactions */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Recent Transactions</span>
            <button onClick={onViewAllTransactions} style={{ fontSize: 12, color: "#0A193D", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>View all</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 440, overflowY: "auto" }}>
            {recent.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px", borderBottom: `1px solid ${colors.cardBorder}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: t.type === "income" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {t.type === "income" ? <TrendingUp size={15} color="#10b981" /> : <ShoppingCart size={15} color="#ef4444" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</div>
                  <div style={{ fontSize: 11, color: colors.textSub, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{t.date}</span>
                    {hasImportSource(t) && (
                      <span style={{ fontSize: 9.5, fontWeight: 600, padding: "1px 7px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: IMPORT_SOURCE_COLOR[t.importSource!] || "#10b981", letterSpacing: 0.3 }}>
                        {IMPORT_SOURCE_LABEL[t.importSource!] || t.importSource}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ padding: "3px 9px", borderRadius: 6, background: t.type === "income" ? "rgba(16,185,129,0.1)" : colors.inputBg, color: t.type === "income" ? "#10b981" : colors.textSub, fontSize: 11, fontWeight: 500 }}>
                  {t.category}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: t.type === "income" ? "#10b981" : "#ef4444", minWidth: 90, textAlign: "right" }}>
                  {t.type === "income" ? "+" : "-"}{currencySymbol(currency)}{t.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Spending by Category */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Spending by Category</span>
            <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.text, fontSize: 12, cursor: "pointer" }}>
              This Month <ChevronDown size={12} />
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div style={{ position: "relative" }}>
              <RechartsPie width={160} height={160}>
                <Pie data={realSpendingByCategory} cx={75} cy={75} innerRadius={45} outerRadius={72} dataKey="value" stroke="none">
                  {realSpendingByCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </RechartsPie>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{fmt(monthlyExpenses)}</div>
                <div style={{ fontSize: 10, color: colors.textSub }}>Total Expenses</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {realSpendingByCategory.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0, display: "inline-block" }} />
                <span style={{ fontSize: 12, flex: 1, color: colors.textSub }}>{c.name}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{fmt(c.value)}</span>
                <span style={{ fontSize: 11, color: colors.textSub, minWidth: 36, textAlign: "right" }}>({Math.round((c.value / (totalExpenses || 1)) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCalcModal && <CalcModal colors={colors} onClose={() => setShowCalcModal(false)} balance={balance} dailySpend={dailyExpense * 30} safeToSpend={safeToSpend} currency={currency} />}
    </div>
  );
}

// ── Transactions Page ───────────────────────────────────────────────────────
function TransactionsPage({ colors, transactions, onDeleteTransaction, currency }: { colors: Colors; transactions: Transaction[]; onDeleteTransaction: (id: string, source?: "transactions" | "income" | "expenses") => Promise<void>; currency: string }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [catFilter, setCatFilter] = useState("All");
  const [deletingId, setDeletingId] = useState("");

  const cats = ["All", "Food", "Transport", "Rent", "Utilities", "Shopping", "Health", "Subscriptions", "Income", ...Array.from(new Set(transactions.map(t => t.category || "Other")))];
  const filtered = [...transactions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .filter(t => {
      const matchSearch = t.description.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || t.type === typeFilter;
      const matchCat = catFilter === "All" || t.category === catFilter;
      return matchSearch && matchType && matchCat;
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: colors.textSub }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..." style={{ width: "100%", padding: "9px 12px 9px 36px", borderRadius: 9, border: `1px solid ${colors.cardBorder}`, background: colors.card, color: colors.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        {(["all", "income", "expense"] as const).map(f => (
          <button key={f} onClick={() => setTypeFilter(f)} style={{ padding: "9px 16px", borderRadius: 9, border: `1px solid ${typeFilter === f ? "#0A193D" : colors.cardBorder}`, background: typeFilter === f ? "rgba(10,25,61,0.1)" : colors.card, color: typeFilter === f ? "#0A193D" : colors.textSub, fontSize: 13, fontWeight: typeFilter === f ? 600 : 400, cursor: "pointer", textTransform: "capitalize" }}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {/* Category pills */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${catFilter === c ? "#0A193D" : colors.cardBorder}`, background: catFilter === c ? "rgba(10,25,61,0.1)" : colors.card, color: catFilter === c ? "#0A193D" : colors.textSub, fontSize: 12, fontWeight: catFilter === c ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap" }}>
            {c}
          </button>
        ))}
      </div>
      {/* Table */}
      <div className="finlo-table-wrap" style={{ borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}`, overflow: "hidden" }}>
        <div style={{ padding: "14px 22px", borderBottom: `1px solid ${colors.cardBorder}`, fontSize: 13, fontWeight: 600, color: colors.textSub, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 90px 56px" }}>
          <span>Description</span><span>Category</span><span>Date</span><span>Method</span><span style={{ textAlign: "right" }}>Amount</span><span></span>
        </div>
        {filtered.length === 0 ? (
          <div className="finlo-table-empty" style={{ padding: "40px", textAlign: "center", color: colors.textSub }}>
            <Search size={32} style={{ marginBottom: 10, opacity: 0.4 }} />
            <div style={{ fontWeight: 600 }}>No transactions found</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search or filters</div>
          </div>
        ) : filtered.map((t, i) => (
          <div key={t.id} style={{ padding: "13px 22px", borderBottom: i < filtered.length - 1 ? `1px solid ${colors.cardBorder}` : "none", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 90px 56px", alignItems: "center" }}
            onMouseEnter={e => (e.currentTarget.style.background = colors.hover)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: t.type === "income" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {t.type === "income" ? <TrendingUp size={14} color="#10b981" /> : <ShoppingCart size={14} color="#ef4444" />}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</span>
                {hasImportSource(t) && (
                  <span style={{ fontSize: 9.5, fontWeight: 600, padding: "1px 7px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: IMPORT_SOURCE_COLOR[t.importSource!] || "#10b981", width: "fit-content", letterSpacing: 0.3 }}>
                    {IMPORT_SOURCE_LABEL[t.importSource!] || t.importSource}
                  </span>
                )}
              </div>
            </div>
            <span style={{ fontSize: 12, padding: "3px 9px", borderRadius: 6, background: colors.inputBg, color: colors.textSub, display: "inline-block", width: "fit-content" }}>{t.category}</span>
            <span style={{ fontSize: 12, color: colors.textSub }}>{t.date}</span>
            <span style={{ fontSize: 12, color: colors.textSub }}>{t.method}</span>
            <span style={{ fontWeight: 700, fontSize: 14, textAlign: "right", color: t.type === "income" ? "#10b981" : "#ef4444" }}>
              {t.type === "income" ? "+" : "-"}{currencySymbol(currency)}{t.amount.toLocaleString()}
            </span>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                disabled={deletingId === t.id}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!confirm(`Delete "${t.description}"?`)) return;
                  setDeletingId(t.id);
                  try {
                    await onDeleteTransaction(t.id, t.source);
                  } catch (err) {
                    console.error(err);
                    alert("Failed to delete transaction");
                  } finally {
                    setDeletingId("");
                  }
                }}
                title="Delete"
                style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: deletingId === t.id ? 0.5 : 1 }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Upcoming Page ───────────────────────────────────────────────────────────
function UpcomingPage({ colors, transactions, recurring, installments, supabase, onPayInstallment, onDeleteInstallment, currency }: { colors: Colors; transactions: Transaction[]; recurring: UpcomingItem[]; installments: Installment[]; supabase: ReturnType<typeof createClient>; onPayInstallment: (id: string) => void; onDeleteInstallment: (id: string) => Promise<void>; currency: string }) {
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteRecurring = async (id: string) => {
    if (!confirm("Delete this recurring bill?")) return;
    setDeletingId(id);
    try {
      await supabase.from("recurring_expenses").delete().eq("id", id).throwOnError();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setDeletingId(null);
    }
  };

  const markPaidRecurring = async (item: UpcomingItem) => {
    if (!confirm(`Mark "${item.name}" as paid? It moves to the next cycle.`)) return;
    try {
      const { data } = await supabase.from("recurring_expenses").select("next_due_date").eq("id", item.id).single();
      const base = data?.next_due_date ? new Date(data.next_due_date) : new Date();
      const next = new Date(base.getFullYear(), base.getMonth() + 1, base.getDate()).toISOString().slice(0, 10);
      await supabase.from("recurring_expenses").update({ next_due_date: next }).eq("id", item.id).throwOnError();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not mark as paid");
    }
  };

  const incomeItems = [...transactions.filter((t) => t.type === "income")].sort((a, b) => (a.date < b.date ? 1 : -1));
  const curMonthUp = new Date().toISOString().slice(0, 7);
  const checkPaidUp = (r: UpcomingItem) => {
    const rName = (r.name || "").toLowerCase();
    if (rName.length < 3) return false;
    return transactions.some((t) => {
      if (t.type !== "expense") return false;
      if ((t.date || "").slice(0, 7) !== curMonthUp) return false;
      const tDesc = (t.description || "").toLowerCase();
      if (!(tDesc.includes(rName) || rName.includes(tDesc))) return false;
      if (Math.abs(t.amount - r.amount) > 5) return false;
      return true;
    });
  };
  const expenseItems = [...recurring].sort((a, b) => {
    const aPaid = checkPaidUp(a);
    const bPaid = checkPaidUp(b);
    if (aPaid !== bPaid) return aPaid ? 1 : -1;
    return 0;
  });
  const upcomingInstallments = installments
    .filter((i) => i.status === "active" && i.next_due_date)
    .slice()
    .sort((a, b) => new Date(a.next_due_date as string).getTime() - new Date(b.next_due_date as string).getTime());
  const checkPaidInst = (inst: Installment) => {
    const rName = (inst.item_name || "").toLowerCase();
    if (rName.length < 3) return false;
    return transactions.some((t) => {
      if (t.type !== "expense") return false;
      if ((t.date || "").slice(0, 7) !== curMonthUp) return false;
      const tDesc = (t.description || "").toLowerCase();
      if (!(tDesc.includes(rName) || rName.includes(tDesc))) return false;
      if (Math.abs(t.amount - Number(inst.monthly_installment)) > 5) return false;
      return true;
    });
  };
  const expectedIncome = incomeItems.reduce((s, t) => s + t.amount, 0);
  const expectedExpenses = expenseItems.reduce((s, t) => s + t.amount, 0);
  const fmtN = (n: number) => formatCurrency(n, currency);

  const addRecurringExpense = async (data: { name: string; amount: number; category: string; frequency: string; next_due_date: string }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data: catRows } = await supabase.from("categories").select("id").ilike("name", data.category).limit(1);
    const category_id = catRows?.[0]?.id || null;
    const { error } = await supabase.from("recurring_expenses").insert([{
      user_id: user.id,
      title: data.name,
      amount: data.amount,
      category_id,
      frequency: data.frequency,
      next_due_date: data.next_due_date,
    }]);
    if (error) throw new Error(error.message);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Overview */}
      <div style={{ padding: "22px 24px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Financial Overview</div>
        <div className="finlo-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {[
            { label: "Total Income", value: fmtN(expectedIncome), color: "#10b981" },
            { label: "Recurring Bills", value: fmtN(expectedExpenses), color: "#ef4444" },
            { label: "Recurring Count", value: String(expenseItems.length), color: "#f59e0b" },
            { label: "Net (Income - Bills)", value: fmtN(expectedIncome - expectedExpenses), color: "#0A193D" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "14px 16px", borderRadius: 12, background: colors.inputBg, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: colors.textSub, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="finlo-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Upcoming Income */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={16} color="#10b981" /> Income
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {incomeItems.length === 0 && <div style={{ fontSize: 12, color: colors.textSub, padding: 12 }}>No income records yet.</div>}
            {incomeItems.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: colors.inputBg }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}><TrendingUp size={16} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>{item.description}</div>
                  <div style={{ fontSize: 11, color: colors.textSub }}>{item.date}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "#10b981" }}>{fmtN(item.amount)}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: "rgba(16,185,129,0.15)", color: "#10b981" }}>{item.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Expenses */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingDown size={16} color="#ef4444" /> Recurring Bills
            <button onClick={() => setShowAddRecurring(true)} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "none", background: "#0A193D", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={13} /> Add
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {expenseItems.length === 0 && <div style={{ fontSize: 12, color: colors.textSub, padding: 12 }}>No recurring bills yet.</div>}
            {expenseItems.map(item => {
              const isPaid = checkPaidUp(item);
              return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: isPaid ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.04)", borderLeft: `3px solid ${isPaid ? "#10b981" : "#ef4444"}` }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: isPaid ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: isPaid ? "#10b981" : "#ef4444" }}>{isPaid ? <Check size={16} /> : iconMap[item.icon] || <DollarSign size={16} />}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: isPaid ? "#10b981" : colors.text }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: colors.textSub }}>Due: {item.date}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: isPaid ? "#10b981" : colors.text }}>{fmtN(item.amount)}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: isPaid ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.1)", color: isPaid ? "#10b981" : "#ef4444" }}>{isPaid ? "Paid ✓" : "Unpaid"}</span>
                </div>
                {!isPaid && (
                <button
                  onClick={() => markPaidRecurring(item)}
                  title="Mark as paid / clear"
                  style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(16,185,129,0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <Check size={14} />
                </button>
                )}
                <button
                  onClick={() => handleDeleteRecurring(item.id)}
                  title="Delete"
                  style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: deletingId === item.id ? 0.5 : 1 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Installments */}
      <div style={{ padding: "22px 24px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <DollarSign size={16} color="#0A193D" /> Upcoming Installments
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {upcomingInstallments.length === 0 && <div style={{ fontSize: 12, color: colors.textSub, padding: 12 }}>No active installment plans.</div>}
          {upcomingInstallments.map(inst => {
            const isPaid = checkPaidInst(inst);
            const instName = `Installment: ${inst.item_name}`;
            return (
              <div key={inst.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: isPaid ? "rgba(16,185,129,0.06)" : "rgba(10,25,61,0.05)", borderLeft: `3px solid ${isPaid ? "#10b981" : "#0A193D"}` }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: isPaid ? "rgba(16,185,129,0.12)" : "rgba(10,25,61,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: isPaid ? "#10b981" : "#0A193D" }}><DollarSign size={16} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: isPaid ? "#10b981" : colors.text }}>{instName}</div>
                  <div style={{ fontSize: 11, color: colors.textSub }}>Due: {inst.next_due_date} · {inst.paid_count}/{inst.total_months} paid</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: isPaid ? "#10b981" : colors.text }}>{fmtN(Number(inst.monthly_installment))}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: isPaid ? "rgba(16,185,129,0.15)" : "rgba(10,25,61,0.12)", color: isPaid ? "#10b981" : "#0A193D" }}>{isPaid ? "Paid ✓" : "Unpaid"}</span>
                </div>
                {!isPaid && (
                  <button onClick={() => onPayInstallment(inst.id)} title="Pay installment" style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(16,185,129,0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Check size={14} />
                  </button>
                )}
                <button onClick={() => { if (confirm(`Delete "${inst.item_name}" installment and its history?`)) void onDeleteInstallment(inst.id); }} title="Delete installment" style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {showAddRecurring && <AddRecurringModal colors={colors} onClose={() => setShowAddRecurring(false)} onSubmit={addRecurringExpense} currency={currency} />}
    </div>
  );
}

// ── Add Recurring Modal ─────────────────────────────────────────────────────
function AddRecurringModal({ colors, onClose, onSubmit, currency }: { colors: Colors; onClose: () => void; onSubmit: (data: { name: string; amount: number; category: string; frequency: string; next_due_date: string }) => Promise<void>; currency: string }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [frequency, setFrequency] = useState("monthly");
  const [nextDueDate, setNextDueDate] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categoryOptions = ["food", "transport", "utilities", "entertainment", "shopping", "health", "subscriptions", "rent", "family", "travel", "education", "other"];
  const categoryNames: Record<string, string> = { food: "Food", transport: "Transport", utilities: "Utilities", entertainment: "Entertainment", shopping: "Shopping", health: "Health", subscriptions: "Subscriptions", rent: "Rent", family: "Family", travel: "Travel", education: "Education", other: "Other" };

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 9, border: `1px solid ${colors.cardBorder}`,
    background: colors.inputBg, color: colors.text, fontSize: 13, outline: "none", boxSizing: "border-box" as const,
  };

  const handleSubmit = async () => {
    const amt = Number(amount.replace(/,/g, ""));
    if (!name.trim()) { setError("Enter an expense name"); return; }
    if (!amt || amt <= 0) { setError("Enter a valid amount"); return; }
    const due = frequency === "daily" ? new Date().toISOString().slice(0, 10) : nextDueDate;
    if (!due) { setError("Choose a due date"); return; }
    setLoading(true);
    setError("");
    try {
      await onSubmit({ name: name.trim(), amount: amt, category: categoryNames[category] || "Other", frequency, next_due_date: due });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add recurring expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 220 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "min(420px, calc(100vw - 32px))", borderRadius: 18, background: colors.card, border: `1px solid ${colors.cardBorder}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: colors.text }}>Add Recurring Expense</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: colors.inputBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: colors.textSub }}><X size={14} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: colors.textSub, display: "block", marginBottom: 5 }}>Expense Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Netflix, Gym membership" style={inputStyle} />
          </div>
          <div className="finlo-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: colors.textSub, display: "block", marginBottom: 5 }}>Amount ({currency})</label>
              <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: colors.textSub, display: "block", marginBottom: 5 }}>Frequency</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {["daily", "weekly", "bi-weekly", "monthly", "quarterly", "yearly"].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="finlo-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: colors.textSub, display: "block", marginBottom: 5 }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {categoryOptions.map(c => <option key={c} value={c}>{categoryNames[c]}</option>)}
              </select>
            </div>
            {frequency !== "daily" && (
              <div>
                <label style={{ fontSize: 12, color: colors.textSub, display: "block", marginBottom: 5 }}>Next Due Date</label>
                <input type="date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} style={inputStyle} />
              </div>
            )}
          </div>
          {error && <div style={{ fontSize: 12, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: loading ? "#9ca3af" : "#0A193D", color: "#fff", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving..." : "Add Recurring"}
            </button>
            <button onClick={onClose} style={{ padding: "11px 18px", borderRadius: 10, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.textSub, fontSize: 14, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
function BudgetsPage({ colors, budgets, currency, onAddBudget }: { colors: Colors; budgets: Budget[]; currency: string; onAddBudget: (category: string, limitAmount: number) => Promise<void> }) {
  const totalBudgeted = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const remaining = totalBudgeted - totalSpent;
  const fmtN = (n: number) => formatCurrency(n, currency);
  const currentMonthLabel = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  const [showAdd, setShowAdd] = useState(false);
  const [newCat, setNewCat] = useState("Food");
  const [newAmount, setNewAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const budgetCategories = ["Food", "Transport", "Rent", "Utilities", "Shopping", "Entertainment", "Health", "Education", "Subscriptions", "Family", "Travel", "Other"];

  const handleSaveBudget = async () => {
    const amt = Number(newAmount.replace(/,/g, ""));
    if (isNaN(amt) || amt <= 0) { setErr("Enter a valid amount"); return; }
    setErr(""); setBusy(true);
    try {
      await onAddBudget(newCat, amt);
      setShowAdd(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save budget");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: colors.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Monthly Budget Overview — {currentMonthLabel}</div>
        </div>
        <button onClick={() => { setNewCat("Food"); setNewAmount(""); setErr(""); setShowAdd(true); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "none", background: "#0A193D", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", flexShrink: 0 }}>
          <Plus size={15} /> Add Budget
        </button>
      </div>

      {/* Summary */}
      <div className="finlo-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {[
          { label: "Total Budgeted", value: fmtN(totalBudgeted), color: "#0A193D" },
          { label: "Total Spent", value: fmtN(totalSpent), color: "#f59e0b" },
          { label: "Remaining", value: fmtN(remaining), color: "#10b981" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "18px 20px", borderRadius: 14, background: colors.card, border: `1px solid ${colors.cardBorder}`, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: colors.textSub, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="finlo-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {budgets.length === 0 && <div style={{ padding: "30px", textAlign: "center", color: colors.textSub, fontSize: 13, gridColumn: "1 / -1", background: colors.card, borderRadius: 14, border: `1px solid ${colors.cardBorder}` }}>No budgets added yet.</div>}
        {budgets.map(b => {
          const pct = Math.min(Math.round(b.spent / b.limit * 100), 100);
          const isOver = b.spent > b.limit;
          const isWarn = pct >= 80 && !isOver;
          const barColor = isOver ? "#ef4444" : isWarn ? "#f59e0b" : "#0A193D";
          return (
            <div key={b.id} style={{ padding: "20px 22px", borderRadius: 14, background: colors.card, border: `1px solid ${isOver ? "rgba(239,68,68,0.3)" : colors.cardBorder}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${b.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: b.color }}>
                    {iconMap[b.icon] || <DollarSign size={15} />}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 14, color: colors.text }}>{b.category}</span>
                </div>
                {isOver && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>Over budget!</span>}
                {isWarn && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>Near limit</span>}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: colors.textSub, marginBottom: 8 }}>
                <span>Spent: <b style={{ color: colors.text }}>{fmtN(b.spent)}</b></span>
                <span>Limit: <b style={{ color: colors.text }}>{fmtN(b.limit)}</b></span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: colors.inputBg, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, background: barColor, transition: "width 0.32s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11 }}>
                <span style={{ color: barColor, fontWeight: 600 }}>{pct}% used</span>
                <span style={{ color: colors.textSub }}>{fmtN(b.limit - b.spent)} remaining</span>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 220, padding: 16 }} onClick={() => { if (!busy) setShowAdd(false); }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 380, maxHeight: "calc(100dvh - 48px)", overflowY: "auto", borderRadius: 18, background: colors.card, border: `1px solid ${colors.cardBorder}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: colors.text }}>Add Budget</span>
              <button onClick={() => setShowAdd(false)} style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: colors.inputBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: colors.textSub }}><X size={14} /></button>
            </div>

            <div style={{ fontSize: 12, color: colors.textSub, lineHeight: 1.5, marginBottom: 14 }}>
              Set a monthly limit for a category. Budget applies to {currentMonthLabel}.
            </div>

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 6 }}>Category</label>
            <select value={newCat} onChange={e => { setNewCat(e.target.value); setErr(""); }} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 12, outline: "none" }}>
              {budgetCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 6 }}>Monthly Limit ({currency})</label>
            <input inputMode="numeric" value={newAmount} onChange={e => { setNewAmount(e.target.value); setErr(""); }} placeholder="e.g. 15000" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />

            {err && <div style={{ fontSize: 12, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px", marginTop: 12 }}>{err}</div>}

            <div style={{ display: "flex", gap: 10, paddingTop: 16 }}>
              <button onClick={handleSaveBudget} disabled={busy} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: busy ? "#9ca3af" : "#0A193D", color: "#fff", fontWeight: 700, fontSize: 14, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}>
                {busy ? "Saving..." : "Save Budget"}
              </button>
              <button onClick={() => setShowAdd(false)} style={{ padding: "11px 18px", borderRadius: 10, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.textSub, fontSize: 14, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Analytics Page ──────────────────────────────────────────────────────────
function AnalyticsPage({ colors, transactions, currency }: { colors: Colors; transactions: Transaction[]; currency: string }) {
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savings = Math.max(0, totalIncome - totalExpenses);
  const fmtN = (n: number) => formatCurrency(n, currency);

  const catMap: Record<string, number> = {};
  transactions.filter((t) => t.type === "expense").forEach((t) => {
    const cat = (t.category || "Other").charAt(0).toUpperCase() + (t.category || "Other").slice(1);
    catMap[cat] = (catMap[cat] || 0) + t.amount;
  });
  const catColors = ["#0A193D", "#10b981", "#ef4444", "#06b6d4", "#f59e0b", "#0A193D", "#94a3b8"];
  const breakdown = Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([name, value], i) => ({ name, value, color: catColors[i % catColors.length] }));
  const topCat = breakdown[0] || null;
  const avgMonthly = totalExpenses > 0 ? Math.round(totalExpenses) : 0;
  const monthCount = Math.max(1, new Set(transactions.map((t) => (t.date || "").slice(0, 7)).filter(Boolean)).size);

  const monthMap: Record<string, { income: number; expenses: number }> = {};
  transactions.forEach((t) => {
    const ym = (t.date || "").slice(0, 7);
    if (!ym) return;
    monthMap[ym] = monthMap[ym] || { income: 0, expenses: 0 };
    if (t.type === "income") monthMap[ym].income += t.amount;
    else monthMap[ym].expenses += t.amount;
  });
  const realMonthlyData = Object.keys(monthMap).sort().slice(-6).map((ym) => {
    const [y, m] = ym.split("-");
    const monthLabel = new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-US", { month: "short" });
    return { month: monthLabel, income: monthMap[ym].income, expenses: monthMap[ym].expenses };
  });

  const sourceMap: Record<string, number> = {};
  transactions.forEach((t) => {
    const s = hasImportSource(t) ? t.importSource! : "MANUAL";
    sourceMap[s] = (sourceMap[s] || 0) + 1;
  });
  const importedSources = Object.entries(sourceMap).filter(([s]) => s !== "MANUAL");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats */}
      <div className="finlo-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {[
          { label: "Top Spending Category", value: topCat ? topCat.name : "—", sub: topCat ? fmtN(topCat.value) + " total" : "No expenses yet", icon: <Home size={18} color="#0A193D" />, bg: "rgba(10,25,61,0.1)" },
          { label: "Avg Monthly Expenses", value: fmtN(Math.round(avgMonthly / monthCount)), sub: `Across ${monthCount} month(s)`, icon: <BarChart2 size={18} color="#f59e0b" />, bg: "rgba(245,158,11,0.1)" },
          { label: "Total Savings", value: fmtN(savings), sub: "Income − Expenses", icon: <TrendingUp size={18} color="#10b981" />, bg: "rgba(16,185,129,0.1)" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "20px 22px", borderRadius: 14, background: colors.card, border: `1px solid ${colors.cardBorder}`, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: colors.textSub, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: colors.text }}>{s.value}</div>
              <div style={{ fontSize: 11, color: colors.textSub }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Chart */}
      <div style={{ padding: "22px 24px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Monthly Income vs Expenses</div>
        <div style={{ fontSize: 12, color: colors.textSub, marginBottom: 18 }}>Last 6 months</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={realMonthlyData} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.cardBorder} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: colors.textSub }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: colors.textSub }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}K`} />
            <Tooltip content={<CustomTooltip colors={colors} currency={currency} />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[5, 5, 0, 0]} fillOpacity={0.85} />
            <Bar dataKey="expenses" name="Expenses" fill="#0A193D" radius={[5, 5, 0, 0]} fillOpacity={0.75} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {importedSources.length > 0 && (
        <div style={{ padding: "22px 24px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Transactions by Source</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {importedSources.map(([s, count]) => {
              const c = IMPORT_SOURCE_COLOR[s] || "#10b981";
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: c, flexShrink: 0, display: "inline-block" }} />
                  <span style={{ fontSize: 12.5, flex: 1, color: colors.textSub }}>{IMPORT_SOURCE_LABEL[s] || s}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.text }}>{count}</span>
                  <span style={{ fontSize: 11, color: colors.textSub, minWidth: 40, textAlign: "right" }}>{Math.round((count / (transactions.length || 1)) * 100)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="finlo-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Trend Line */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>Monthly Spending Trend</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={realMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.cardBorder} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: colors.textSub }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: colors.textSub }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}K`} />
              <Tooltip content={<CustomTooltip colors={colors} currency={currency} />} />
              <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#0A193D" strokeWidth={2.5} dot={{ fill: "#0A193D", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div style={{ padding: "22px 24px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Spending Breakdown</div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <RechartsPie width={130} height={130}>
              <Pie data={breakdown} cx={60} cy={60} innerRadius={35} outerRadius={58} dataKey="value" stroke="none">
                {breakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </RechartsPie>
            <div style={{ flex: 1 }}>
              {breakdown.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: c.color, flexShrink: 0, display: "inline-block" }} />
                  <span style={{ fontSize: 12, flex: 1, color: colors.textSub }}>{c.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{Math.round((c.value / (totalExpenses || 1)) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AI Page ─────────────────────────────────────────────────────────────────
function AIPage({ colors, transactions, currency }: { colors: Colors; transactions: Transaction[]; currency: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I'm your AI financial assistant. I can answer questions about your spending, income, budgets, and cash flow. What would you like to know?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [affordAmount, setAffordAmount] = useState("");
  const [affordResult, setAffordResult] = useState<null | "safe" | "warn">(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "How much did I spend this month?",
    "What is my biggest expense category?",
    "Will my money last until next payday?",
    "Where can I reduce spending?",
  ];

  const aiIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const aiExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const aiBalance = aiIncome - aiExpenses;
  const aiCatMap: Record<string, number> = {};
  transactions.filter((t) => t.type === "expense").forEach((t) => {
    const cat = (t.category || "Other").charAt(0).toUpperCase() + (t.category || "Other").slice(1);
    aiCatMap[cat] = (aiCatMap[cat] || 0) + t.amount;
  });
  const aiTopEntry = Object.entries(aiCatMap).sort((a, b) => b[1] - a[1])[0];
  const aiTopCategory = aiTopEntry ? `${aiTopEntry[0]} (${aiTopEntry[1].toLocaleString()})` : "N/A";
  const aiDaily = aiExpenses > 0 ? aiExpenses / 30 : 0;
  const aiRunway = aiDaily > 0 ? Math.floor(Math.max(0, aiBalance) / aiDaily) : 0;
  const aiSavings = Math.max(0, aiIncome - aiExpenses);
  const aiSafe = aiSavings;

  const financialContext = {
    currentBalance: aiBalance, monthlyIncome: aiIncome, monthlyExpenses: aiExpenses,
    topCategory: aiTopCategory, safeToSpend: aiSafe, runway: aiRunway,
    upcomingBills: 0, savings: aiSavings,
  };

  async function sendMessage(text?: string) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const resp = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context: {
            "Current Balance": formatCurrency(financialContext.currentBalance, currency),
            "Income this month": formatCurrency(financialContext.monthlyIncome, currency),
            "Expenses this month": formatCurrency(financialContext.monthlyExpenses, currency),
            "Safe to Spend today": formatCurrency(financialContext.safeToSpend, currency),
            "Money Runway": financialContext.runway + " days",
            "Top spending category": financialContext.topCategory,
            "Upcoming bills (next 7 days)": formatCurrency(financialContext.upcomingBills, currency),
            "This month's savings": formatCurrency(financialContext.savings, currency),
          },
        }),
      });
      const data = await resp.json();
      const reply = data.reply || "I couldn't process that. Please try again.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again." }]);
    }
    setLoading(false);
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  function checkAffordability() {
    const amt = parseInt(affordAmount.replace(/,/g, ""));
    if (!amt) return;
    const afterPurchase = aiBalance - amt;
    setAffordResult(afterPurchase > 0 ? "safe" : "warn");
  }

  return (
    <div className="finlo-ai-page" style={{ display: "flex", gap: 20, height: "calc(100vh - 160px)" }}>
      {/* Chat */}
      <div className="finlo-ai-chat" style={{ flex: 1, display: "flex", flexDirection: "column", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}`, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.cardBorder}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#142453,#0A193D)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bot size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: colors.text }}>AI Financial Assistant</div>
            <div style={{ fontSize: 11, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />Online
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "78%", padding: "11px 14px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background: m.role === "user" ? "linear-gradient(135deg,#142453,#0A193D)" : colors.inputBg,
                color: m.role === "user" ? "#fff" : colors.text, fontSize: 13, lineHeight: 1.6,
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex" }}>
              <div style={{ padding: "11px 16px", borderRadius: "14px 14px 14px 4px", background: colors.inputBg, display: "flex", gap: 4 }}>
                {[0, 1, 2].map(j => <span key={j} style={{ width: 7, height: 7, borderRadius: "50%", background: colors.textSub, display: "inline-block", animation: `bounce 1.2s ${j * 0.2}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick questions */}
        <div style={{ padding: "8px 20px", display: "flex", gap: 7, overflowX: "auto", borderTop: `1px solid ${colors.cardBorder}` }}>
          {quickQuestions.map((q, i) => (
            <button key={i} onClick={() => sendMessage(q)} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.textSub, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>{q}</button>
          ))}
        </div>

        <div style={{ padding: "12px 16px", borderTop: `1px solid ${colors.cardBorder}`, display: "flex", gap: 10 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Ask about your finances..." style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 13, outline: "none" }} />
          <button onClick={() => sendMessage()} disabled={loading} style={{ width: 42, height: 42, borderRadius: 10, border: "none", background: loading ? colors.inputBg : "#0A193D", color: "#fff", cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Can I Afford It? */}
      <div className="finlo-ai-side" style={{ width: 280, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ padding: "22px 20px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, display: "flex", alignItems: "center", gap: 7 }}>
            <Sparkles size={16} color="#0A193D" /> Can I Afford It?
          </div>
          <div style={{ fontSize: 12, color: colors.textSub, marginBottom: 16 }}>Enter an amount to see the impact</div>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 600, color: colors.textSub }}>{currencySymbol(currency).trim()}</span>
            <input value={affordAmount} onChange={e => { setAffordAmount(e.target.value); setAffordResult(null); }}
              placeholder="40,000" style={{ width: "100%", padding: "10px 12px 10px 40px", borderRadius: 9, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 14, fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
          </div>
          <button onClick={checkAffordability} style={{ width: "100%", padding: "10px", borderRadius: 9, border: "none", background: "#0A193D", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Check Affordability</button>

          {affordResult && (
            <div style={{ marginTop: 14, padding: "14px", borderRadius: 12, background: affordResult === "safe" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", border: `1px solid ${affordResult === "safe" ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}` }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: affordResult === "safe" ? "#10b981" : "#f59e0b" }}>
                {affordResult === "safe" ? "✅ Looks affordable" : "⚠️ Not recommended"}
              </div>
              <div style={{ fontSize: 12, color: colors.textSub, lineHeight: 1.5 }}>
                {affordResult === "safe"
                  ? "This purchase looks safe based on your current balance and upcoming commitments."
                  : "This purchase may leave very little money after your upcoming commitments."}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: colors.textSub }}>
                <div>Current balance: <b style={{ color: colors.text }}>{formatCurrency(aiBalance, currency)}</b></div>
                <div>After purchase: <b style={{ color: colors.text }}>{formatCurrency(aiBalance - parseInt(affordAmount || "0"), currency)}</b></div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div style={{ padding: "18px 20px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: colors.text }}>Your Financial Snapshot</div>
          {[
            { label: "Balance", value: formatCurrency(aiBalance, currency), color: "#0A193D" },
            { label: "Safe to Spend", value: formatCurrency(financialContext.safeToSpend, currency), color: "#10b981" },
            { label: "Money Runway", value: aiRunway + " days", color: "#f59e0b" },
            { label: "Income", value: formatCurrency(aiIncome, currency), color: colors.textSub },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < 3 ? `1px solid ${colors.cardBorder}` : "none" }}>
              <span style={{ fontSize: 12, color: colors.textSub }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Settings Page ───────────────────────────────────────────────────────────
function SettingsPage({ colors, displayName, userEmail, onSignOut, currency, onCurrencyChange, supabase }: { colors: Colors; displayName: string; userEmail: string; onSignOut: () => void; currency: string; onCurrencyChange: (c: string) => void; supabase: ReturnType<typeof createClient> }) {
  const currencies = ["PKR", "USD", "AED", "SAR", "GBP", "EUR"];
  const profileInitial = (displayName || "U").charAt(0).toUpperCase();
  const [draftCurrency, setDraftCurrency] = useState(currency);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");
  const [pushStatus, setPushStatus] = useState<PushStatus>("idle");
  const [notifBills, setNotifBills] = useState(() => notifPref(NOTIF_PREF_BILLS, true));
  const [notifBudget, setNotifBudget] = useState(() => notifPref(NOTIF_PREF_BUDGET, true));
  const [notifIncome, setNotifIncome] = useState(() => notifPref(NOTIF_PREF_INCOME, true));

  useEffect(() => {
    void getPushStatus().then(setPushStatus);
  }, []);

  const toggleNotifBills = () => { const next = !notifBills; setNotifBills(next); setNotifPref(NOTIF_PREF_BILLS, next); };
  const toggleNotifBudget = () => { const next = !notifBudget; setNotifBudget(next); setNotifPref(NOTIF_PREF_BUDGET, next); };
  const toggleNotifIncome = () => { const next = !notifIncome; setNotifIncome(next); setNotifPref(NOTIF_PREF_INCOME, next); };
  const router = useRouter();

  const handleSave = () => {
    onCurrencyChange(draftCurrency);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    setExportMsg("");
    try {
      const [transactions, income, expenses, recurring] = await Promise.all([
        getUserTransactionsClient(),
        getUserIncomeClient(),
        getUserExpensesClient(),
        getUserRecurringExpensesClient(),
      ]);
      const payload = {
        exportedAt: new Date().toISOString(),
        currency,
        transactions,
        income,
        expenses,
        recurring,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finlo-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportMsg("✓ Data exported");
    } catch (e) {
      setExportMsg("Export failed, please try again");
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (exporting) return;
    setExporting(true);
    setExportMsg("");
    try {
      const [transactions, income, expenses, recurring] = await Promise.all([
        getUserTransactionsClient(),
        getUserIncomeClient(),
        getUserExpensesClient(),
        getUserRecurringExpensesClient(),
      ]);

      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 16;
      let y = margin;

      const fmt = (n: number) => formatCurrency(Number(n || 0), currency);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(99, 102, 241);
      doc.text("Finlo - Data Export", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`Exported: ${new Date().toLocaleString()}  |  User: ${displayName || userEmail || "-"}`, margin, y);
      y += 14;

      const drawSectionHeader = (title: string) => {
        if (y > pageW - 18) { doc.addPage(); y = margin; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(99, 102, 241);
        doc.text(title, margin, y);
        y += 6;
        doc.setDrawColor(99, 102, 241);
        doc.setLineWidth(0.4);
        doc.line(margin, y, pageW - margin, y);
        y += 5;
      };

      const drawRow = (left: string, right: string, color: [number, number, number] = [60, 60, 60]) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...color);
        doc.text(left, margin, y);
        doc.text(right, pageW - margin - doc.getTextWidth(right), y);
        y += 5;
      };

      const summary = {
        totalIncome: income.reduce((s, i) => s + Number(i.amount), 0),
        totalExpense: expenses.reduce((s, e) => s + Number(e.amount), 0),
        txnCount: transactions.length,
        recurringCount: recurring.length,
      };

      drawSectionHeader("Summary");
      drawRow("Total Income", fmt(summary.totalIncome), [16, 185, 129]);
      drawRow("Total Expenses", fmt(summary.totalExpense), [239, 68, 68]);
      drawRow("Net", fmt(summary.totalIncome - summary.totalExpense));
      drawRow("Transactions (records)", String(summary.txnCount));
      drawRow("Recurring Payments", String(summary.recurringCount));
      y += 8;

      drawSectionHeader(`Income (${income.length})`);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text("Name / Date", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      income.slice(0, 60).forEach((i) => {
        if (y > 280) { doc.addPage(); y = margin; }
        drawRow(`${i.notes || "Income"}  (${String(i.date || "").slice(0, 10)})`, fmt(i.amount), [16, 185, 129]);
      });
      y += 8;

      drawSectionHeader(`Expenses (${expenses.length})`);
      expenses.slice(0, 80).forEach((e) => {
        if (y > 280) { doc.addPage(); y = margin; }
        doc.setTextColor(239, 68, 68);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`${e.description || "Expense"}  (${String(e.date || "").slice(0, 10)})`, margin, y);
        doc.text(fmt(e.amount), pageW - margin - doc.getTextWidth(fmt(e.amount)), y);
        y += 5;
      });
      y += 8;

      drawSectionHeader(`Recurring Payments (${recurring.length})`);
      recurring.forEach((r) => {
        if (y > 280) { doc.addPage(); y = margin; }
        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`${r.name}  (${String(r.next_due_date || "").slice(0, 10)})`, margin, y);
        doc.text(fmt(r.amount), pageW - margin - doc.getTextWidth(fmt(r.amount)), y);
        y += 5;
      });
      y += 8;

      drawSectionHeader("Recent Transactions");
      transactions.slice(0, 80).forEach((t) => {
        if (y > 280) { doc.addPage(); y = margin; }
        const c: [number, number, number] = t.type === "income" ? [16, 185, 129] : [239, 68, 68];
        doc.setTextColor(...c);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`${t.description || "Transaction"}  (${String(t.date || "").slice(0, 10)})  [${t.type}]`, margin, y);
        doc.text(fmt(t.amount), pageW - margin - doc.getTextWidth(fmt(t.amount)), y);
        y += 5;
      });

      doc.save(`finlo-export-${new Date().toISOString().slice(0, 10)}.pdf`);
      setExportMsg("✓ PDF exported");
    } catch (e) {
      setExportMsg("PDF export failed, please try again");
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteErr("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Try the server route: deletes the Supabase auth account AND all user data.
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Fallback: at least clear the user's data using the client session.
        const tables = ["transactions", "income", "expenses", "recurring_expenses", "budgets"] as const;
        for (const table of tables) {
          const { error } = await supabase.from(table).delete().eq("user_id", user.id);
          if (error) throw new Error(error.message);
        }
        throw new Error(json.error || "Could not delete the account");
      }

      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (e) {
      setDeleteErr(e instanceof Error ? e.message : "Could not delete account");
      setDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Profile */}
      <div style={{ padding: "22px 24px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}><User size={16} color="#0A193D" /> Profile</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#142453,#0A193D)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 22 }}>{profileInitial}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
            <div style={{ fontSize: 13, color: colors.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</div>
          </div>
          <a href="/dashboard/profile" style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 9, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.text, fontSize: 13, cursor: "pointer", textDecoration: "none" }}>Edit Profile</a>
        </div>
      </div>

      {/* Currency */}
      <div style={{ padding: "22px 24px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><DollarSign size={16} color="#0A193D" /> Currency</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {currencies.map(c => (
            <button key={c} onClick={() => { setDraftCurrency(c); setSaved(false); }} style={{ padding: "8px 18px", borderRadius: 9, border: `1px solid ${draftCurrency === c ? "#0A193D" : colors.cardBorder}`, background: draftCurrency === c ? "rgba(10,25,61,0.1)" : "transparent", color: draftCurrency === c ? "#0A193D" : colors.textSub, fontWeight: draftCurrency === c ? 700 : 400, fontSize: 13, cursor: "pointer" }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div style={{ padding: "22px 24px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><Bell size={16} color="#0A193D" /> Notifications</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "4px 0 12px", borderBottom: `1px solid ${colors.cardBorder}` }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>Mobile / Desktop notifications</div>
            <div style={{ fontSize: 11, color: colors.textSub, marginTop: 2 }}>
              {pushStatus === "enabled"
                ? "Chalu hain — due payments par home screen push aayegi"
                : pushStatus === "denied"
                  ? "Browser settings se allow karein (padlock → Site settings → Notifications)"
                  : pushStatus === "unsupported"
                    ? "Is browser mein push supported nahi"
: pushStatus === "error"
                  ? "Status check fail hua. Dobara try karein."
                  : "Automatic hain — app kholte hi apne aap enable ho jayengi. Mobile par nahi ho raha to pehle \"Add to Home Screen\" karein (iPhone ke liye zaroori)"}
            </div>
          </div>
          <span style={{ padding: "5px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, flexShrink: 0, background: pushStatus === "enabled" ? "rgba(16,185,129,0.14)" : "rgba(148,163,184,0.14)", color: pushStatus === "enabled" ? "#10b981" : colors.textSub }}>
            {pushStatus === "enabled" ? "ON" : pushStatus === "denied" ? "BLOCKED" : "AUTO"}
          </span>
        </div>
        {[
          { label: "Upcoming bill reminders", sub: "Get notified 2 days before bills are due", on: notifBills, toggle: toggleNotifBills },
          { label: "Budget alerts", sub: "Alert when spending reaches 80% of budget", on: notifBudget, toggle: toggleNotifBudget },
          { label: "Income confirmations", sub: "Notify when expected income arrives", on: notifIncome, toggle: toggleNotifIncome },
        ].map((n, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < 2 ? `1px solid ${colors.cardBorder}` : "none" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>{n.label}</div>
              <div style={{ fontSize: 11, color: colors.textSub }}>{n.sub}</div>
            </div>
            <button onClick={n.toggle} aria-pressed={n.on} style={{ width: 40, height: 22, borderRadius: 11, border: "none", background: n.on ? "#0A193D" : colors.cardBorder, position: "relative", cursor: "pointer", padding: 0, flexShrink: 0 }}>
              <span style={{ position: "absolute", top: 2, left: n.on ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.12s ease" }} />
            </button>
          </div>
        ))}
      </div>

      {/* Data */}
      <div style={{ padding: "22px 24px", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><Download size={16} color="#0A193D" /> Data & Privacy</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={handleExport} disabled={exporting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.text, fontSize: 13, cursor: exporting ? "not-allowed" : "pointer", opacity: exporting ? 0.7 : 1 }}>
            <Download size={14} /> {exporting ? "Exporting..." : "Export JSON"}
          </button>
          <button onClick={handleExportPDF} disabled={exporting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.text, fontSize: 13, cursor: exporting ? "not-allowed" : "pointer", opacity: exporting ? 0.7 : 1 }}>
            <FileText size={14} /> {exporting ? "Exporting..." : "Export PDF"}
          </button>
          <button onClick={() => { setConfirmDelete(true); setDeleteErr(""); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "1px solid rgba(239,68,68,0.4)", background: "transparent", color: "#ef4444", fontSize: 13, cursor: "pointer" }}>
            <Trash2 size={14} /> Delete Account
          </button>
          {exportMsg && <span style={{ fontSize: 13, fontWeight: 600, color: exportMsg.includes("✓") ? "#10b981" : "#ef4444" }}>{exportMsg}</span>}
        </div>

        {confirmDelete && (
          <div style={{ marginTop: 16, padding: "16px 18px", borderRadius: 12, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#ef4444", marginBottom: 6 }}>Delete account?</div>
            <div style={{ fontSize: 12.5, color: colors.textSub, lineHeight: 1.5, marginBottom: 12 }}>
              This permanently removes all your transactions, income, expenses, recurring payments, and budgets. This action cannot be undone.
            </div>
            {deleteErr && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{deleteErr}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleDeleteAccount} disabled={deleting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}>
                <Trash2 size={14} /> {deleting ? "Deleting..." : "Yes, delete everything"}
              </button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: "9px 18px", borderRadius: 9, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.text, fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SMS Import Center */}
      <ImportCenter colors={colors} supabase={supabase} />

      {/* Save */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={handleSave} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 26px", borderRadius: 12, border: "none", background: "#0A193D", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 16px rgba(10,25,61,0.35)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Save Changes
        </button>
        {saved && <span style={{ fontSize: 13, fontWeight: 600, color: "#10b981" }}>✓ Saved</span>}
      </div>

      {/* Logout */}
      <button onClick={onSignOut} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12, border: `1px solid ${colors.cardBorder}`, background: colors.card, color: colors.textSub, fontSize: 13, fontWeight: 500, cursor: "pointer", width: "fit-content" }}>
        <LogOut size={15} /> Sign Out
      </button>
    </div>
  );
}

// ── Installments Page ───────────────────────────────────────────────────────
function InstallmentsPage({ colors, installments, onAdd, onMarkPaid, onDelete, currency }: {
  colors: Colors;
  installments: Installment[];
  onAdd: (data: { item_name: string; total_price: number; down_payment: number; monthly_installment: number; total_months: number; total_interest: number; next_due_date?: string; notes?: string }) => Promise<void>;
  onMarkPaid: (inst: Installment) => void;
  onDelete: (id: string) => Promise<void>;
  currency: string;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState(0);
  const [downPayment, setDownPayment] = useState(0);
  const [months, setMonths] = useState(12);
  const [rate, setRate] = useState(15);
  const [nextDue, setNextDue] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [saving, setSaving] = useState(false);

  const financed = Math.max(0, price - downPayment);
  const monthlyRate = rate / 100 / 12;
  const emi = monthlyRate === 0 || months <= 0
    ? financed / (months || 1)
    : (financed * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  const totalPayable = emi * months + downPayment;
  const totalInterest = Math.max(0, totalPayable - price);

  const active = installments.filter((i) => i.status === "active");
  const monthlyOutgoing = active.reduce((s, i) => s + Number(i.monthly_installment), 0);
  const nextDueSoon = (date?: string | null) => {
    if (!date) return null;
    const days = Math.round((new Date(date).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
    return days;
  };

  const doAdd = async () => {
    if (!itemName.trim() || price <= 0 || months <= 0) {
      alert("Please fill in the item name, price and number of months.");
      return;
    }
    setSaving(true);
    try {
      await onAdd({
        item_name: itemName.trim(),
        total_price: price,
        down_payment: downPayment,
        monthly_installment: Math.round(emi * 100) / 100,
        total_months: months,
        total_interest: Math.round(totalInterest * 100) / 100,
        next_due_date: nextDue,
        notes: undefined,
      });
      setShowAdd(false);
      setItemName("");
      setPrice(0);
      setDownPayment(0);
      setMonths(12);
      setRate(15);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not add installment plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Add button */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>Your Installment Plans</div>
          <div style={{ fontSize: 12.5, color: colors.textSub, marginTop: 2 }}>
            {active.length} active · Monthly outgoing: {formatCurrency(monthlyOutgoing, currency)}
          </div>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#142453,#0A193D)", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(10,25,61,0.3)" }}>
          <Plus size={15} /> {showAdd ? "Cancel" : "Add Installment"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 18, borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          <div>
            <Label colors={colors}>Item name</Label>
            <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. iPhone 15 Pro" style={inp(colors)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Label colors={colors}>Total price ({currency})</Label>
              <input type="number" value={price || ""} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} style={inp(colors)} />
            </div>
            <div>
              <Label colors={colors}>Down payment</Label>
              <input type="number" value={downPayment || ""} onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)} style={inp(colors)} />
            </div>
            <div>
              <Label colors={colors}>Months</Label>
              <input type="number" min={1} value={months || ""} onChange={(e) => setMonths(parseInt(e.target.value) || 1)} style={inp(colors)} />
            </div>
            <div>
              <Label colors={colors}>Annual rate (%)</Label>
              <input type="number" min={0} value={rate || ""} onChange={(e) => setRate(parseFloat(e.target.value) || 0)} style={inp(colors)} />
            </div>
          </div>
          <div>
            <Label colors={colors}>First installment due</Label>
            <input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} style={inp(colors)} />
          </div>
          {price > 0 && months > 0 && (
            <div style={{ padding: 12, borderRadius: 12, background: "rgba(10,25,61,0.08)", border: `1px solid rgba(10,25,61,0.25)` }}>
              <div style={{ fontSize: 12.5, color: colors.textSub }}>Estimated monthly installment</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: colors.text, marginTop: 2 }}>{formatCurrency(Math.round(emi), currency)}</div>
              <div style={{ fontSize: 11.5, color: colors.textSub }}>Total payable: {formatCurrency(Math.round(totalPayable), currency)} · Interest: {formatCurrency(Math.round(totalInterest), currency)}</div>
            </div>
          )}
          <button onClick={doAdd} disabled={saving} style={{ padding: "12px", borderRadius: 11, border: "none", background: "#0A193D", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Save Installment"}
          </button>
        </div>
      )}

      {/* List */}
      {installments.length === 0 ? (
        <div style={{ padding: "36px 20px", textAlign: "center", borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}`, color: colors.textSub }}>
          <DollarSign size={30} style={{ marginBottom: 8, opacity: 0.4 }} />
          <div style={{ fontWeight: 600 }}>No installment plans yet</div>
          <div style={{ fontSize: 12.5, marginTop: 4 }}>Add a purchase and we&apos;ll track each payment + remind you before the due date.</div>
        </div>
      ) : (
        installments.map((inst) => {
          const days = nextDueSoon(inst.next_due_date);
          const progress = inst.total_months > 0 ? Math.min(100, (inst.paid_count / inst.total_months) * 100) : 0;
          const done = inst.status === "completed";
          return (
            <div key={inst.id} style={{ padding: 16, borderRadius: 16, background: colors.card, border: `1px solid ${colors.cardBorder}`, display: "flex", flexDirection: "column", gap: 12, opacity: done ? 0.7 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(10,25,61,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <DollarSign size={18} color="#0A193D" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: colors.text, textDecoration: done ? "line-through" : "none" }}>{inst.item_name}</div>
                  <div style={{ fontSize: 12, color: colors.textSub, marginTop: 2 }}>
                    {inst.paid_count}/{inst.total_months} paid · {formatCurrency(Number(inst.monthly_installment), currency)}/mo
                  </div>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: done ? "rgba(16,185,129,0.15)" : days !== null && days <= 2 ? "rgba(239,68,68,0.15)" : "rgba(10,25,61,0.12)", color: done ? "#10b981" : days !== null && days <= 2 ? "#ef4444" : "#0A193D", whiteSpace: "nowrap" }}>
                  {done ? "Done" : days === null ? "No due date" : days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : `Due in ${days}d`}
                </span>
              </div>

              {/* progress bar */}
              <div style={{ height: 7, borderRadius: 999, background: colors.inputBg, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, borderRadius: 999, background: "linear-gradient(90deg,#142453,#0A193D)", transition: "width 0.3s" }} />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 11.5, color: colors.textSub }}>Total: {formatCurrency(Number(inst.total_price), currency)}</span>
                <span style={{ fontSize: 11.5, color: colors.textSub }}>Down: {formatCurrency(Number(inst.down_payment), currency)}</span>
                <span style={{ fontSize: 11.5, color: colors.textSub }}>Interest: {formatCurrency(Number(inst.total_interest), currency)}</span>
                {inst.next_due_date && <span style={{ fontSize: 11.5, color: colors.textSub }}>Next due: {new Date(inst.next_due_date).toLocaleDateString()}</span>}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {!done && (
                  <button onClick={() => onMarkPaid(inst)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "none", background: "rgba(16,185,129,0.15)", color: "#10b981", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                    <Check size={14} /> Mark paid
                  </button>
                )}
                <button onClick={() => { if (confirm(done ? `Delete completed "${inst.item_name}" installment and its history?` : `Delete "${inst.item_name}" plan?`)) onDelete(inst.id); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "none", background: "rgba(239,68,68,0.12)", color: "#ef4444", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function Label({ colors, children }: { colors: Colors; children: ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSub, marginBottom: 5 }}>{children}</div>;
}

function inp(colors: Colors): React.CSSProperties {
  return { width: "100%", padding: "10px 13px", borderRadius: 9, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 13.5, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
}

// ── Add Modal ───────────────────────────────────────────────────────────────
function AddModal({ colors, onClose, addType, setAddType, recurringNames, currency, installmentTarget, onMarkInstallmentPaid, onPasteSms }: { colors: Colors; onClose: () => void; addType: "income" | "expense"; setAddType: (t: "income" | "expense") => void; recurringNames: string[]; currency: string; installmentTarget?: Installment | null; onMarkInstallmentPaid?: (target: Installment) => Promise<void>; onPasteSms?: () => void; }) {
  const [amount, setAmount] = useState(installmentTarget ? String(installmentTarget.monthly_installment) : "");
  const [desc, setDesc] = useState(installmentTarget ? `Installment: ${installmentTarget.item_name}` : "");
  const [showSuggest, setShowSuggest] = useState(false);
  const [showSuggestNL, setShowSuggestNL] = useState(false);
  const [category, setCategory] = useState(installmentTarget ? "Other" : "Food");
  const [customCat, setCustomCat] = useState("");
  const [method, setMethod] = useState("Cash");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [nlInput, setNlInput] = useState("");
  const [parsed, setParsed] = useState<null | { amount: string; category: string; date: string }>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showScanOptions, setShowScanOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState("");
  const uploadRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!showScanOptions) return;
    const close = () => setShowScanOptions(false);
    const timer = setTimeout(() => document.addEventListener("click", close), 0);
    return () => { clearTimeout(timer); document.removeEventListener("click", close); };
  }, [showScanOptions]);

  const expenseCategories = ["Food", "Transport", "Rent", "Utilities", "Shopping", "Entertainment", "Health", "Education", "Subscriptions", "Family", "Travel", "Other"];
  const incomeSources = ["Salary", "Freelance", "Business", "Client Payment", "Other"];
  const methods = ["Cash", "Bank", "Debit Card", "Credit Card", "Easypaisa", "JazzCash", "Other"];

  function parseNL() {
    const bank = parseBankSms(nlInput);
    if (bank) {
      setAddType(bank.kind);
      setAmount(String(bank.amount));
      setCategory(bank.kind === "income" ? bank.source : bank.category);
      setDate(bank.date);
      if (bank.description) setDesc(bank.description);
      setParsed({ amount: String(bank.amount), category: bank.kind === "income" ? bank.source : bank.category, date: bank.date });
      return;
    }
    const amtMatch = nlInput.match(/\d[\d,]*/);
    const amt = amtMatch ? amtMatch[0] : "?";
    let cat = "Other";
    if (/petrol|fuel|uber|taxi|transport/i.test(nlInput)) cat = "Transport";
    else if (/food|restaurant|groceries|dinner|lunch/i.test(nlInput)) cat = "Food";
    else if (/internet|wifi/i.test(nlInput)) cat = "Utilities";
    else if (/rent|house/i.test(nlInput)) cat = "Rent";
    const cleanName = nlInput
      .replace(/\b(paid|rmb|rs\.?|pk[rs]+|rs|for|of|the|a|an)\b/gi, " ")
      .replace(/\d[\d,]*\.?\d*/g, " ")
      .replace(/[₹Rs.,]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleanName) setDesc(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    setParsed({ amount: amt, category: cat, date: "Today" });
  }

  async function handleReceiptFile(file: File) {
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    setScanning(true);
    setError("");
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = String(reader.result || "");
          resolve(result.includes(",") ? result.split(",")[1] : result);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/extract-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType: file.type }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || "Could not read receipt"); return; }
      if (data.amount && Number(data.amount) > 0) setAmount(String(data.amount));
      if (data.description) setDesc(data.description);
      if (data.category && expenseCategories.includes(data.category)) {
        setCategory(data.category);
        setAddType("expense");
      }
      if (data.date && /^\d{4}-\d{2}-\d{2}$/.test(data.date)) setDate(data.date);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong scanning the receipt");
    } finally {
      setScanning(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 9, border: `1px solid ${colors.cardBorder}`,
    background: colors.inputBg, color: colors.text, fontSize: 13, outline: "none", boxSizing: "border-box" as const,
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "min(440px, calc(100vw - 32px))", borderRadius: 20, background: colors.card, border: `1px solid ${colors.cardBorder}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${colors.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: colors.text }}>{installmentTarget ? `Pay installment: ${installmentTarget.item_name}` : "Add Transaction"}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowScanOptions(v => !v); }}
              disabled={scanning}
              aria-label="Scan receipt"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 9, border: "none", background: scanning ? "#9ca3af" : "rgba(10,25,61,0.14)", color: scanning ? "#fff" : "#0A193D", fontSize: 12, fontWeight: 600, cursor: scanning ? "not-allowed" : "pointer", opacity: scanning ? 0.7 : 1 }}
            >
              {scanning ? <ScanLine size={15} className="spin" /> : <Camera size={15} />}
              {scanning ? "Reading…" : "Scan bill"}
            </button>
            {showScanOptions && !scanning && (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, boxShadow: "0 12px 36px rgba(0,0,0,0.18)", overflow: "hidden", zIndex: 50, minWidth: 180 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowScanOptions(false); uploadRef.current?.click(); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 14px", border: "none", background: "transparent", color: colors.text, fontSize: 13, cursor: "pointer", fontWeight: 500 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.inputBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <FileText size={15} /> Upload bill
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowScanOptions(false); setShowCamera(true); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 14px", border: "none", background: "transparent", color: colors.text, fontSize: 13, cursor: "pointer", fontWeight: 500 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.inputBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Camera size={15} /> Scan slip
                </button>
                {onPasteSms && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowScanOptions(false); onPasteSms(); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 14px", border: "none", background: "transparent", color: colors.text, fontSize: 13, cursor: "pointer", fontWeight: 500 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = colors.inputBg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Smartphone size={15} /> Paste bank SMS
                  </button>
                )}
              </div>
            )}
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: colors.inputBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: colors.textSub }}><X size={15} /></button>
          </div>
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleReceiptFile(file);
              e.target.value = "";
            }}
          />
        </div>

        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Type Toggle */}
          <div style={{ display: "flex", gap: 0, borderRadius: 10, background: colors.inputBg, padding: 4 }}>
            {(["expense", "income"] as const).map(t => (
              <button key={t} onClick={() => setAddType(t)} disabled={!!installmentTarget} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: addType === t ? colors.card : "transparent", color: addType === t ? (t === "income" ? "#10b981" : "#ef4444") : colors.textSub, fontWeight: addType === t ? 700 : 400, fontSize: 13, cursor: installmentTarget ? "not-allowed" : "pointer", boxShadow: addType === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.12s", textTransform: "capitalize", opacity: installmentTarget && t === "income" ? 0.4 : 1 }}>
                {t}
              </button>
            ))}
          </div>

          {/* NL Input */}
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 12, color: colors.textSub, marginBottom: 6 }}>Quick entry — SMS paste karo ya likho (e.g. &quot;Paid 3500 internet bill&quot;)</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={nlInput} onChange={e => { setNlInput(e.target.value); setShowSuggestNL(true); }} onFocus={() => setShowSuggestNL(true)} onBlur={() => setTimeout(() => setShowSuggestNL(false), 150)} placeholder={'Bank SMS ya "Paid 3500 internet bill"'} style={{ ...inputStyle, flex: 1 }} autoComplete="off" />
              <button onClick={parseNL} style={{ padding: "10px 14px", borderRadius: 9, border: "none", background: "#0A193D", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Parse</button>
            </div>
            {showSuggestNL && addType === "expense" && (
              (() => {
                const q = nlInput.toLowerCase();
                const matches = recurringNames
                  .filter((n) => n && n.toLowerCase().includes(q))
                  .slice(0, 6);
                if (matches.length === 0) return null;
                return (
                  <div style={{ position: "absolute", left: 0, right: 0, top: "100%", marginTop: 4, background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.18)", zIndex: 25, overflow: "hidden" }}>
                    {matches.map((n) => (
                      <button
                        key={n}
                        onMouseDown={(e) => { e.preventDefault(); setNlInput(n); setShowSuggestNL(false); }}
                        style={{ display: "block", width: "100%", padding: "9px 12px", border: "none", background: "transparent", color: colors.text, fontSize: 13, textAlign: "left", cursor: "pointer" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = colors.inputBg)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                );
              })()
            )}
          </div>

          {parsed && (
            <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(10,25,61,0.08)", border: "1px solid rgba(10,25,61,0.2)" }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: colors.text }}>We understood:</div>
              <div style={{ fontSize: 13, color: colors.textSub, display: "flex", gap: 16 }}>
                <span>{currencySymbol(currency)}<b style={{ color: colors.text }}>{parsed.amount}</b></span>
                <span><b style={{ color: colors.text }}>{parsed.category}</b></span>
                <span><b style={{ color: colors.text }}>{parsed.date}</b></span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => {
                  if (parsed.amount !== "?") setAmount(parsed.amount.replace(/,/g, ""));
                  setCategory(parsed.category);
                  setParsed(null);
                }} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#0A193D", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Confirm</button>
                <button onClick={() => setParsed(null)} style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.textSub, fontSize: 12, cursor: "pointer" }}>Edit</button>
              </div>
            </div>
          )}

          <div className="finlo-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: colors.textSub, display: "block", marginBottom: 5 }}>Amount ({currency})</label>
              <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: colors.textSub, display: "block", marginBottom: 5 }}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <label style={{ fontSize: 12, color: colors.textSub, display: "block", marginBottom: 5 }}>Description</label>
            <input
              value={desc}
              onChange={e => { setDesc(e.target.value); setShowSuggest(true); }}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
              placeholder="What was this for?"
              style={inputStyle}
              autoComplete="off"
            />
            {showSuggest && addType === "expense" && (
              (() => {
                const q = desc.trim().toLowerCase();
                const matches = recurringNames
                  .filter((n) => n && n.toLowerCase().includes(q))
                  .slice(0, 6);
                if (matches.length === 0) return null;
                return (
                  <div style={{ position: "absolute", left: 0, right: 0, top: "100%", marginTop: 4, background: colors.card, border: `1px solid ${colors.cardBorder}`, borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.18)", zIndex: 20, overflow: "hidden" }}>
                    {matches.map((n) => (
                      <button
                        key={n}
                        onMouseDown={(e) => { e.preventDefault(); setDesc(n); setShowSuggest(false); }}
                        style={{ display: "block", width: "100%", padding: "9px 12px", border: "none", background: "transparent", color: colors.text, fontSize: 13, textAlign: "left", cursor: "pointer" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = colors.inputBg)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                );
              })()
            )}
          </div>

          <div className="finlo-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: colors.textSub, display: "block", marginBottom: 5 }}>{addType === "income" ? "Source" : "Category"}</label>
              {addType === "expense" ? (
                <select value={category === "custom" ? "custom" : category} onChange={e => setCategory(e.target.value === "custom" ? "custom" : e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  {expenseCategories.map(c => <option key={c}>{c}</option>)}
                  <option value="custom">✦ Custom…</option>
                </select>
              ) : (
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  {incomeSources.map(c => <option key={c}>{c}</option>)}
                </select>
              )}
              {addType === "expense" && category === "custom" && (
                <input
                  autoFocus
                  value={customCat}
                  onChange={e => setCustomCat(e.target.value)}
                  placeholder="Type custom category…"
                  style={{ ...inputStyle, marginTop: 8 }}
                />
              )}
            </div>
            {addType === "expense" && (
              <div>
                <label style={{ fontSize: 12, color: colors.textSub, display: "block", marginBottom: 5 }}>Payment Method</label>
                <select value={method} onChange={e => setMethod(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  {methods.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            )}
          </div>

          {error && <div style={{ fontSize: 12, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px" }}>{error}</div>}

          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button
              disabled={loading}
              style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: loading ? "#9ca3af" : "#0A193D", color: "#fff", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
              onClick={async () => {
                const amt = Number(amount.replace(/,/g, ""));
                if (!amt || amt <= 0) { setError("Enter a valid amount"); return; }
                const finalDesc = desc.trim() || nlInput.trim();
                setLoading(true);
                setError("");
                try {
                  if (addType === "income") {
                    await addIncomeClient({ user_id: "", amount: amt, source: "other" as IncomeSource, date, status: "confirmed" as const, notes: finalDesc || undefined });
                  } else {
                    if (category === "custom" && !customCat.trim()) {
                      setError("Enter a custom category");
                      setLoading(false);
                      return;
                    }
                    const cat = category === "custom"
                      ? customCat.trim().toLowerCase().replace(/\s+/g, "_")
                      : category === "Food" ? "food" : category === "Transport" ? "transport"
                      : category === "Rent" ? "rent" : category === "Utilities" ? "utilities"
                      : category === "Shopping" ? "shopping" : category === "Entertainment" ? "entertainment"
                      : category === "Health" ? "health" : category === "Education" ? "education"
                      : category === "Subscriptions" ? "subscriptions" : category === "Family" ? "family"
                      : category === "Travel" ? "travel" : "other";
                    const pm = method === "Cash" ? "cash" : method === "Bank" ? "bank"
                      : method === "Debit Card" ? "debit_card" : method === "Credit Card" ? "credit_card"
                      : method === "Easypaisa" ? "easypaisa" : method === "JazzCash" ? "jazzcash" : "other";
                    await addExpenseClient({ user_id: "", amount: amt, description: finalDesc || "", category: cat as ExpenseCategory, date, payment_method: pm as PaymentMethod, status: "completed" as const });
                    if (installmentTarget && onMarkInstallmentPaid) {
                      await onMarkInstallmentPaid(installmentTarget);
                    }
                  }
                  onClose();
                } catch (e: unknown) {
                  const msg = e instanceof Error ? e.message : "Something went wrong";
                  setError(msg);
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Saving..." : installmentTarget ? "Save Expense & Mark Paid" : `Add ${addType.charAt(0).toUpperCase() + addType.slice(1)}`}
            </button>
            <button onClick={onClose} style={{ padding: "11px 18px", borderRadius: 10, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.textSub, fontSize: 14, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      </div>
      {showCamera && (
        <CameraCapture
          onCapture={async (file) => { setShowCamera(false); await handleReceiptFile(file); }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}

// ── SMS Auto-Add Modal (bank SMS → transaction) ────────────────────────────
function SmsAddModal({ colors, currency, initialText, onClose }: { colors: Colors; currency: string; initialText: string; onClose: () => void }) {
  const [text, setText] = useState(initialText);
  const [analyzed, setAnalyzed] = useState(false);
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [source, setSource] = useState("Other");
  const [method, setMethod] = useState("Bank");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const expenseCategories = ["Food", "Transport", "Rent", "Utilities", "Shopping", "Entertainment", "Health", "Education", "Subscriptions", "Family", "Travel", "Other"];
  const incomeSources = ["Salary", "Freelance", "Business", "Client Payment", "Other"];
  const methods = ["Cash", "Bank", "Debit Card", "Credit Card", "Easypaisa", "JazzCash", "Other"];

  useEffect(() => {
    if (text.trim()) analyze(text);
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    else setAnalyzed(false);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  function analyze(raw: string) {
    const parsed = parseBankSms(raw);
    if (!parsed) {
      setError("Is SMS mein transaction nahi mila (amount ya debit/credit wala text nahi).");
      setAnalyzed(false);
      return;
    }
    setError("");
    setKind(parsed.kind);
    setAmount(String(parsed.amount));
    setDate(parsed.date);
    setDesc(parsed.description);
    if (parsed.kind === "income") setSource(parsed.source);
    else setCategory(parsed.category);
    setAnalyzed(true);
  }

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 9, border: `1px solid ${colors.cardBorder}`,
    background: colors.inputBg, color: colors.text, fontSize: 13, outline: "none", boxSizing: "border-box" as const,
  };

  async function save() {
    const amt = Number(amount.replace(/,/g, ""));
    if (!amt || amt <= 0) { setError("Valid amount enter karo"); return; }
    const d = desc.trim() || "Bank transaction";
    setLoading(true);
    setError("");
    try {
      if (kind === "income") {
        const src = source === "Salary" ? "salary" : source === "Freelance" ? "freelance" : source === "Business" ? "business" : source === "Client Payment" ? "client_payment" : "other";
        await addIncomeClient({ user_id: "", amount: amt, source: src as IncomeSource, date, status: "confirmed" as const, notes: d });
      } else {
        const cat = category === "Food" ? "food" : category === "Transport" ? "transport"
          : category === "Rent" ? "rent" : category === "Utilities" ? "utilities"
          : category === "Shopping" ? "shopping" : category === "Entertainment" ? "entertainment"
          : category === "Health" ? "health" : category === "Education" ? "education"
          : category === "Subscriptions" ? "subscriptions" : category === "Family" ? "family"
          : category === "Travel" ? "travel" : "other";
        const pm = method === "Cash" ? "cash" : method === "Bank" ? "bank"
          : method === "Debit Card" ? "debit_card" : method === "Credit Card" ? "credit_card"
          : method === "Easypaisa" ? "easypaisa" : method === "JazzCash" ? "jazzcash" : "other";
        await addExpenseClient({ user_id: "", amount: amt, description: d, category: cat as ExpenseCategory, date, payment_method: pm as PaymentMethod, status: "completed" as const });
      }
      window.location.reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 210, padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "min(460px, calc(100vw - 32px))", borderRadius: 20, background: colors.card, border: `1px solid ${colors.cardBorder}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${colors.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: colors.text, display: "flex", alignItems: "center", gap: 8 }}><Smartphone size={17} color="#0A193D" /> Bank SMS → Transaction</span>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: colors.inputBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: colors.textSub }}><X size={15} /></button>
        </div>

        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: colors.textSub, marginBottom: 6 }}>Bank SMS text {initialText ? "(auto-analyzed)" : "(yahan paste karke Analyze dabao)"}</div>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.45 }} placeholder="e.g. Rs.1,500.00 debited from account 1234 on 12-Aug. Avl Bal 25,000" />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={() => analyze(text)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#0A193D", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Analyze</button>
              <button onClick={() => setText("")} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.textSub, fontSize: 12, cursor: "pointer" }}>Clear</button>
            </div>
          </div>

          {analyzed ? (
            <>
              <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", fontSize: 12.5, color: colors.text }}>
                ✓ Transaction mil gayi: <b>{kind === "income" ? "Income" : "Expense"}</b> · <b>{currencySymbol(currency)}{formatCurrency(Number(amount.replace(/,/g, "")), currency)}</b> · <b>{kind === "income" ? source : category}</b> · <b>{date}</b>
              </div>

              <div style={{ display: "flex", gap: 0, borderRadius: 10, background: colors.inputBg, padding: 4 }}>
                {(["expense", "income"] as const).map(t => (
                  <button key={t} onClick={() => setKind(t)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: kind === t ? colors.card : "transparent", color: kind === t ? (t === "income" ? "#10b981" : "#ef4444") : colors.textSub, fontWeight: kind === t ? 700 : 400, fontSize: 13, cursor: "pointer", boxShadow: kind === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none", textTransform: "capitalize" }}>{t}</button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: colors.textSub, display: "block", marginBottom: 5 }}>Amount ({currency})</label>
                  <input value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: colors.textSub, display: "block", marginBottom: 5 }}>Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: colors.textSub, display: "block", marginBottom: 5 }}>Description</label>
                <input value={desc} onChange={e => setDesc(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: colors.textSub, display: "block", marginBottom: 5 }}>{kind === "income" ? "Source" : "Category"}</label>
                  {kind === "income" ? (
                    <select value={source} onChange={e => setSource(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                      {incomeSources.map(c => <option key={c}>{c}</option>)}
                    </select>
                  ) : (
                    <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                      {expenseCategories.map(c => <option key={c}>{c}</option>)}
                    </select>
                  )}
                </div>
                {kind === "expense" && (
                  <div>
                    <label style={{ fontSize: 12, color: colors.textSub, display: "block", marginBottom: 5 }}>Payment Method</label>
                    <select value={method} onChange={e => setMethod(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                      {methods.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {error && <div style={{ fontSize: 12, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px" }}>{error}</div>}

              <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                <button disabled={loading} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: loading ? "#9ca3af" : "#0A193D", color: "#fff", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }} onClick={save}>
                  {loading ? "Saving..." : `Add ${kind.charAt(0).toUpperCase() + kind.slice(1)}`}
                </button>
                <button onClick={onClose} style={{ padding: "11px 18px", borderRadius: 10, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.textSub, fontSize: 14, cursor: "pointer" }}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              {error && <div style={{ fontSize: 12, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
              <div style={{ fontSize: 12.5, color: colors.textSub, lineHeight: 1.5 }}>Kam karne ka tareeka: SMS app mein bank ke message ko kholo → <b>Share</b> → <b>Finlo</b> → ye modal khud khulega aur transaction mil jayegi. Confirm karo → save ho jayegi. iPhone par &quot;Paste bank SMS&quot; bhi use kar sakte ho.</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Camera Capture (getUserMedia) ───────────────────────────────────────────
function CameraCapture({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("Camera is not supported on this device.");
          setPermissionDenied(true);
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e: unknown) {
        const err = e as { name?: string };
        if (cancelled) return;
        setPermissionDenied(true);
        setError(err?.name === "NotAllowedError"
          ? "Camera permission denied. Allow camera access in your browser settings to scan slips."
          : "Could not open camera. Try uploading the bill instead.");
      }
    };
    start();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) { setError("Camera is not ready yet."); return; }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) onCapture(new File([blob], "slip.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 500, display: "flex", flexDirection: "column" }} onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div onClick={e => e.stopPropagation()} style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
        <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fff" }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Scan slip</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#000" }}>
          <video ref={videoRef} playsInline muted autoPlay style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {error && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24, textAlign: "center", background: "rgba(0,0,0,0.6)" }}>
              <div style={{ color: "#fff", fontSize: 14, lineHeight: 1.5 }}>{error}</div>
              {permissionDenied && (
                <button onClick={() => { setPermissionDenied(false); setError(""); window.location.reload(); }} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#0A193D", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Retry</button>
              )}
            </div>
          )}
        </div>
        <div onClick={e => e.stopPropagation()} style={{ padding: "18px", display: "flex", alignItems: "center", justifyContent: "center", gap: 24, background: "#111" }}>
          <button onClick={capture} aria-label="Take photo" style={{ width: 72, height: 72, borderRadius: "50%", border: "4px solid #fff", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ width: 52, height: 52, borderRadius: "50%", background: "#fff", display: "block" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Balance Modal ───────────────────────────────────────────────────────────
function BalanceModal({ colors, initialBalance, currentBalance, onClose, onSave, onAdjust, currency }: { colors: Colors; initialBalance: number; currentBalance: number; onClose: () => void; onSave: (value: number) => void; onAdjust: (delta: number) => void; currency: string }) {
  const [mode, setMode] = useState<"set" | "adjust">("set");
  const [value, setValue] = useState(initialBalance ? String(initialBalance) : "");
  const [addValue, setAddValue] = useState("");
  const [direction, setDirection] = useState<"add" | "sub">("add");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (mode === "set") {
      const amt = Number(value.replace(/,/g, ""));
      if (isNaN(amt) || amt < 0) {
        setError("Enter a valid amount");
        return;
      }
      onSave(amt);
      onClose();
    } else {
      const amt = Number(addValue.replace(/,/g, ""));
      if (isNaN(amt) || amt <= 0) {
        setError("Enter a valid amount");
        return;
      }
      onAdjust(direction === "add" ? amt : -amt);
      onClose();
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 220 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "min(380px, calc(100vw - 32px))", borderRadius: 18, background: colors.card, border: `1px solid ${colors.cardBorder}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: colors.text }}>Edit Current Balance</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: colors.inputBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: colors.textSub }}><X size={14} /></button>
        </div>

        <div style={{ fontSize: 13, color: colors.text, fontWeight: 600, marginBottom: 14 }}>
          Current Balance: <span style={{ color: "#0A193D" }}>{formatCurrency(Math.round(currentBalance), currency)}</span>
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", gap: 0, borderRadius: 10, background: colors.inputBg, padding: 4, marginBottom: 16 }}>
          {(["set", "adjust"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: mode === m ? colors.card : "transparent", color: mode === m ? "#0A193D" : colors.textSub, fontWeight: mode === m ? 700 : 400, fontSize: 13, cursor: "pointer", textTransform: "capitalize" }}>
              {m === "set" ? "Set Balance" : "Adjust (+/-)"}
            </button>
          ))}
        </div>

        {mode === "set" ? (
          <div style={{ fontSize: 12, color: colors.textSub, lineHeight: 1.5, marginBottom: 12 }}>
            Replace opening balance. Final = opening + income − expenses.
          </div>
        ) : (
          <div style={{ fontSize: 12, color: colors.textSub, lineHeight: 1.5, marginBottom: 12 }}>
            Increase or decrease the current balance by an amount.
          </div>
        )}

        {mode === "set" ? (
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            value={value}
            onChange={e => { setValue(e.target.value); setError(""); }}
            placeholder="0"
            style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 10, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 18, fontWeight: 600, outline: "none" }}
          />
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", gap: 0, borderRadius: 10, background: colors.inputBg, padding: 4 }}>
              <button onClick={() => setDirection("add")} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: direction === "add" ? "#10b981" : "transparent", color: direction === "add" ? "#fff" : colors.textSub, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Add</button>
              <button onClick={() => setDirection("sub")} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: direction === "sub" ? "#ef4444" : "transparent", color: direction === "sub" ? "#fff" : colors.textSub, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>− Subtract</button>
            </div>
          </div>
        )}

        {mode === "adjust" && (
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            value={addValue}
            onChange={e => { setAddValue(e.target.value); setError(""); }}
            placeholder="0"
            style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 10, border: `1px solid ${colors.cardBorder}`, background: colors.inputBg, color: colors.text, fontSize: 18, fontWeight: 600, outline: "none", marginTop: 10 }}
          />
        )}

        {error && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button onClick={handleSave} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#0A193D", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            {mode === "set" ? "Save Balance" : "Apply Change"}
          </button>
          <button onClick={onClose} style={{ padding: "11px 18px", borderRadius: 10, border: `1px solid ${colors.cardBorder}`, background: "transparent", color: colors.textSub, fontSize: 14, cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Calc Modal ──────────────────────────────────────────────────────────────
function CalcModal({ colors, onClose, balance, dailySpend, safeToSpend, currency }: { colors: Colors; onClose: () => void; balance: number; dailySpend: number; safeToSpend: number; currency: string }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 220 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "min(380px, calc(100vw - 32px))", borderRadius: 20, background: colors.card, border: `1px solid ${colors.cardBorder}`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: colors.text }}>How Safe to Spend is Calculated</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: colors.inputBg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: colors.textSub }}><X size={14} /></button>
        </div>
        {[
          { label: "Current Balance", value: formatCurrency(balance, currency), sign: "", color: colors.text },
          { label: "Set-aside for next 30 days", value: formatCurrency(dailySpend || 0, currency), sign: "−", color: "#f59e0b" },
          { label: "Safe to Spend (remaining)", value: formatCurrency(safeToSpend || 0, currency), sign: "", color: "#10b981" },
        ].map((row, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${colors.cardBorder}` }}>
            <span style={{ fontSize: 13, color: colors.textSub }}>{row.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: row.color }}>{row.sign} {row.value}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", marginTop: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: colors.text }}>Safe to Spend (estimate)</span>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#0A193D" }}>{formatCurrency(safeToSpend || 0, currency)}</span>
        </div>
        <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 9, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 12, color: "#f59e0b", lineHeight: 1.5 }}>
          ⚠️ Safe to Spend = Current Balance − what you typically spend over the next 30 days. This is an estimate, not a guarantee.
        </div>
      </div>
    </div>
  );
}
