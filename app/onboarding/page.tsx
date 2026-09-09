"use client";
import { useState, useEffect } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { createClient } from "@/lib/supabase";
import { FinloLogoImg } from "@/components/branding/FinloLogoImg";

type IncomeType = "Salary" | "Freelance" | "Business" | "Mixed";
type Goal = "Build savings" | "Get out of debt" | "Track spending" | "Plan a big purchase";

const CURRENCIES: { code: string; label: string; symbol: string }[] = [
  { code: "PKR", label: "Pakistani Rupee", symbol: "Rs." },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "AED", label: "UAE Dirham", symbol: "AED" },
  { code: "SAR", label: "Saudi Riyal", symbol: "SAR" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "EUR", label: "Euro", symbol: "€" },
];

const INCOME_TYPES: { value: IncomeType; desc: string; icon: React.ReactNode }[] = [
  {
    value: "Salary",
    desc: "Fixed amount, regular schedule",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    value: "Freelance",
    desc: "Project-based, varies month to month",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
  },
  {
    value: "Business",
    desc: "Income from a business you run",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
      </svg>
    ),
  },
  {
    value: "Mixed",
    desc: "A combination of sources",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
  },
];

const GOALS: { value: Goal; desc: string }[] = [
  { value: "Build savings", desc: "Set money aside consistently" },
  { value: "Get out of debt", desc: "Pay down what you owe, faster" },
  { value: "Track spending", desc: "Understand where money goes" },
  { value: "Plan a big purchase", desc: "Save toward something specific" },
];

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [currency, setCurrency] = useState("PKR");
  const [income, setIncome] = useState("");
  const [incomeType, setIncomeType] = useState<IncomeType | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  const selectedCurrency = CURRENCIES.find(c => c.code === currency)!;

  const canContinue =
    (step === 1 && !!currency) ||
    (step === 2 && income.trim().length > 0 && Number(income) > 0) ||
    (step === 3 && !!incomeType) ||
    (step === 4 && !!goal);

  const isLastStep = step === TOTAL_STEPS;

  async function goNext() {
    if (!canContinue) return;
    if (isLastStep) {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
        return;
      }
      const preferences = {
        currency,
        monthlyIncome: Number(income),
        incomeType,
        goal,
      };
      try {
        const { data: existing } = await supabase
          .from("income")
          .select("id")
          .eq("user_id", data.session.user.id)
          .eq("title", "Monthly income")
          .maybeSingle();
        if (!existing) {
          await supabase.from("income").insert([
            {
              user_id: data.session.user.id,
              amount: Number(income),
              title: "Monthly income",
              date: new Date().toISOString().slice(0, 10),
            },
          ]);
        }
        localStorage.setItem("finlo_preferences", JSON.stringify(preferences));
        localStorage.setItem("finlo_onboarded", "true");
        toast({ type: "success", message: "Welcome to Finlo! Your dashboard is ready." });
        router.push("/dashboard");
        router.refresh();
      } catch {
        toast({ type: "error", message: "Something went wrong. Please try again." });
      }
      return;
    }
    setStep(s => Math.min(TOTAL_STEPS, s + 1));
  }

  function goBack() {
    setStep(s => Math.max(1, s - 1));
  }

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(10,25,61,0.22)",
    borderRadius: "24px",
    padding: "48px",
    width: "100%",
    maxWidth: "520px",
    boxSizing: "border-box",
  };

  const optionBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    width: "100%",
    padding: "16px 18px",
    borderRadius: "14px",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
    transition: "border-color 120ms ease, background 120ms ease",
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      background: "#FEFBFE",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: "relative",
      overflow: "hidden",
      padding: "40px 20px",
    }}>

      {/* ambient glow */}
      <div style={{
        position: "absolute", top: "-120px", left: "50%", transform: "translateX(-50%)",
        width: "560px", height: "300px",
        background: "radial-gradient(ellipse, rgba(20,36,83,0.35) 0%, transparent 70%)",
        filter: "blur(40px)", pointerEvents: "none", zIndex: 0,
      }} />

      {/* LOGO */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "36px", position: "relative", zIndex: 1 }}>
        <FinloLogoImg size={36} />
        <span style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Finlo</span>
      </div>

      <div className="finlo-onboard-card" style={{ ...cardStyle, position: "relative", zIndex: 1 }}>

        {/* PROGRESS */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "rgba(10,25,61,0.72)" }}>
              Step {step} of {TOTAL_STEPS}
            </span>
            <span style={{ fontSize: "13px", color: "rgba(100,116,139,0.7)" }}>
              {Math.round((step / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: "4px", borderRadius: "999px",
                background: i < step ? "linear-gradient(90deg, #142453, #0A193D)" : "rgba(10,25,61,0.15)",
                transition: "background 160ms ease",
              }} />
            ))}
          </div>
        </div>

        {/* STEP 1 — CURRENCY */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", margin: "0 0 6px 0" }}>What&apos;s your currency?</h2>
            <p style={{ fontSize: "14px", color: "rgba(71,85,105,0.8)", margin: "0 0 28px 0" }}>We&apos;ll use this everywhere your money is shown.</p>
            <div className="finlo-onboard-ccy" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {CURRENCIES.map(c => {
                const active = currency === c.code;
                return (
                  <button key={c.code} type="button" onClick={() => setCurrency(c.code)}
                    style={{
                      ...optionBase,
                      background: active ? "rgba(10,25,61,0.14)" : "rgba(255,255,255,0.92)",
                      border: active ? "1px solid rgba(10,25,61,0.6)" : "1px solid rgba(10,25,61,0.22)",
                    }}>
                    <span style={{
                      width: "34px", height: "34px", borderRadius: "9px", flexShrink: 0,
                      background: "rgba(10,25,61,0.15)", color: "#0A193D",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", fontWeight: 700,
                    }}>{c.symbol.slice(0, 3)}</span>
                    <span>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{c.code}</div>
                      <div style={{ fontSize: "12px", color: "rgba(71,85,105,0.8)" }}>{c.label}</div>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2 — MONTHLY INCOME */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", margin: "0 0 6px 0" }}>Typical monthly income</h2>
            <p style={{ fontSize: "14px", color: "rgba(71,85,105,0.8)", margin: "0 0 28px 0" }}>A rough figure is fine — you can refine this later.</p>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "rgba(51,65,85,0.9)", marginBottom: "8px" }}>Amount</label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
                color: "rgba(10,25,61,0.6)", fontSize: "14px", fontWeight: 600, pointerEvents: "none",
              }}>{selectedCurrency.symbol}</span>
              <input
                type="number"
                min="0"
                inputMode="decimal"
                value={income}
                onChange={e => setIncome(e.target.value)}
                placeholder="0"
                style={{
                  width: "100%", padding: "16px 16px 16px 64px",
                  background: "rgba(255,255,255,0.92)", border: "1px solid rgba(10,25,61,0.22)",
                  borderRadius: "12px", fontSize: "20px", fontWeight: 600, color: "#0f172a",
                  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(10,25,61,0.55)"}
                onBlur={e => e.target.style.borderColor = "rgba(10,25,61,0.22)"}
              />
            </div>
            <p style={{ fontSize: "12px", color: "rgba(100,116,139,0.7)", margin: "10px 0 0 0" }}>
              This helps us estimate your Safe-to-Spend and runway from day one.
            </p>
          </div>
        )}

        {/* STEP 3 — INCOME TYPE */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", margin: "0 0 6px 0" }}>How does your income arrive?</h2>
            <p style={{ fontSize: "14px", color: "rgba(71,85,105,0.8)", margin: "0 0 28px 0" }}>This shapes how we forecast your upcoming money.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {INCOME_TYPES.map(t => {
                const active = incomeType === t.value;
                return (
                  <button key={t.value} type="button" onClick={() => setIncomeType(t.value)}
                    style={{
                      ...optionBase,
                      background: active ? "rgba(10,25,61,0.14)" : "rgba(255,255,255,0.92)",
                      border: active ? "1px solid rgba(10,25,61,0.6)" : "1px solid rgba(10,25,61,0.22)",
                    }}>
                    <span style={{
                      width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
                      background: "rgba(10,25,61,0.15)", color: "#0A193D",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{t.icon}</span>
                    <span>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{t.value}</div>
                      <div style={{ fontSize: "12px", color: "rgba(71,85,105,0.8)" }}>{t.desc}</div>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4 — FINANCIAL GOAL */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", margin: "0 0 6px 0" }}>What matters most right now?</h2>
            <p style={{ fontSize: "14px", color: "rgba(71,85,105,0.8)", margin: "0 0 28px 0" }}>We&apos;ll tailor your dashboard around this.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {GOALS.map(g => {
                const active = goal === g.value;
                return (
                  <button key={g.value} type="button" onClick={() => setGoal(g.value)}
                    style={{
                      ...optionBase,
                      background: active ? "rgba(10,25,61,0.14)" : "rgba(255,255,255,0.92)",
                      border: active ? "1px solid rgba(10,25,61,0.6)" : "1px solid rgba(10,25,61,0.22)",
                      justifyContent: "space-between",
                    }}>
                    <span>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{g.value}</div>
                      <div style={{ fontSize: "12px", color: "rgba(71,85,105,0.8)" }}>{g.desc}</div>
                    </span>
                    <span style={{
                      width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                      border: active ? "none" : "1px solid rgba(10,25,61,0.4)",
                      background: active ? "#0A193D" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {active && <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9 10,3" /></svg>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* NAV BUTTONS */}
        <div style={{ display: "flex", gap: "12px", marginTop: "36px" }}>
          {step > 1 && (
            <button type="button" onClick={goBack}
              style={{
                flex: "0 0 auto", padding: "15px 22px", background: "rgba(255,255,255,0.92)",
                border: "1px solid rgba(10,25,61,0.25)", borderRadius: "14px",
                fontSize: "15px", fontWeight: 600, color: "rgba(51,65,85,0.9)",
                cursor: "pointer", fontFamily: "inherit",
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(10,25,61,0.4)"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(10,25,61,0.25)"; }}
            >
              Back
            </button>
          )}
          <button type="button" onClick={goNext} disabled={!canContinue}
            style={{
              flex: 1, padding: "15px", border: "none", borderRadius: "14px",
              fontSize: "16px", fontWeight: 600, color: "#fff", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              cursor: canContinue ? "pointer" : "not-allowed",
              background: canContinue ? "linear-gradient(90deg, #142453 0%, #0A193D 100%)" : "rgba(10,25,61,0.18)",
              boxShadow: canContinue ? "0 4px 24px rgba(10,25,61,0.35)" : "none",
              opacity: canContinue ? 1 : 0.6,
              transition: "opacity 120ms ease",
            }}
            onMouseOver={e => { if (canContinue) { e.currentTarget.style.background = "linear-gradient(90deg, #142453 0%, #0A193D 100%)"; } }}
            onMouseOut={e => { if (canContinue) { e.currentTarget.style.background = "linear-gradient(90deg, #142453 0%, #0A193D 100%)"; } }}
          >
            {isLastStep ? "Go to dashboard" : "Continue"}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" />
            </svg>
          </button>
        </div>
      </div>

      <p style={{ marginTop: "24px", fontSize: "12px", color: "rgba(100,116,139,0.7)", position: "relative", zIndex: 1 }}>
        You can change any of this later in Settings.
      </p>
    </div>
  );
}
