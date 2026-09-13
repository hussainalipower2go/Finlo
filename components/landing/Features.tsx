"use client";

import {
  ReceiptText,
  TrendingUp,
  Zap,
  CalendarClock,
  LayoutDashboard,
  History,
  LineChart,
} from "lucide-react";
import { BRAND, FONTS, GLASS, SECTION_IDS } from "./lp-tokens";
import { SectionHeading, SectionKicker } from "./lp-ui";

const FEATURES = [
  {
    icon: ReceiptText,
    title: "Expense Tracking",
    desc: "Track and categorize everyday expenses.",
    tint: "#e14d5d",
    bg: "rgba(225,77,93,0.09)",
  },
  {
    icon: TrendingUp,
    title: "Income Management",
    desc: "Record and manage your income.",
    tint: "#059669",
    bg: "rgba(5,150,105,0.09)",
  },
  {
    icon: Zap,
    title: "Quick Entry",
    desc: "Quickly add income and expense transactions.",
    tint: "#f59e0b",
    bg: "rgba(245,158,11,0.10)",
  },
  {
    icon: CalendarClock,
    title: "Recurring Bills",
    desc: "Organize recurring and upcoming payments.",
    tint: "#2563eb",
    bg: "rgba(37,99,235,0.09)",
  },
  {
    icon: LayoutDashboard,
    title: "Financial Dashboard",
    desc: "Understand income, expenses and balances from one dashboard.",
    tint: "#7c3aed",
    bg: "rgba(124,58,237,0.09)",
  },
  {
    icon: History,
    title: "Transaction History",
    desc: "See previous transactions and where money was spent.",
    tint: "#0891b2",
    bg: "rgba(8,145,178,0.09)",
  },
  {
    icon: LineChart,
    title: "Financial Insights",
    desc: "Understand your financial activity with clear insights.",
    tint: "#7890FF",
    bg: "rgba(120,144,255,0.14)",
  },
];

export default function Features() {
  return (
    <section
      id={SECTION_IDS.features}
      style={{
        padding: "clamp(64px, 9vh, 100px) 0",
        scrollMarginTop: 72,
        background: "rgba(120,144,255,0.04)",
        borderTop: "1px solid rgba(255,255,255,0.7)",
        borderBottom: "1px solid rgba(255,255,255,0.7)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        <SectionKicker>Features</SectionKicker>
        <SectionHeading
          title="Everything you need to"
          accent="manage your money"
          description="Seven focused tools that work together, so understanding your finances never feels like extra work."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(1, 1fr)",
            gap: 18,
            marginTop: 48,
          }}
          className="landing-features-grid"
        >
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                style={{
                  position: "relative",
                  borderRadius: 20,
                  padding: "28px 26px",
                  background: GLASS.bgStrong,
                  border: "1px solid rgba(255,255,255,0.75)",
                  backdropFilter: GLASS.blurSoft,
                  WebkitBackdropFilter: GLASS.blurSoft,
                  boxShadow: "0 1px 2px rgba(255,255,255,0.04), 0 12px 32px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
                  transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(255,255,255,0.05), 0 20px 48px rgba(82,109,223,0.16), inset 0 1px 0 rgba(255,255,255,0.95)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.95)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 2px rgba(255,255,255,0.04), 0 12px 32px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.9)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.75)";
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: f.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 18,
                  }}
                >
                  <Icon size={22} strokeWidth={2} color={f.tint} />
                </div>
                <h3
                  style={{
                    fontFamily: FONTS.heading,
                    fontWeight: 600,
                    fontSize: 18,
                    color: BRAND.text,
                    margin: 0,
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: BRAND.textMuted,
                    margin: "8px 0 0",
                  }}
                >
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
