"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { BRAND, FONTS, SHADOWS, SECTION_IDS } from "./lp-tokens";
import { SectionHeading, SectionKicker } from "./lp-ui";

const FAQS = [
  {
    q: "What is Finlo?",
    a: "Finlo is a personal finance platform that helps you track income, manage expenses, organize recurring bills, and understand where your money goes — all from one simple dashboard.",
  },
  {
    q: "How does Finlo help manage my finances?",
    a: "Finlo brings your income, expenses, budget, upcoming bills, and financial insights together in one place, so you can see your full picture and make confident decisions.",
  },
  {
    q: "Can I track income and expenses?",
    a: "Yes. You can record income and expenses in seconds, organize them by categories and payment methods, and review your transaction history whenever you need to.",
  },
  {
    q: "Can I manage recurring bills?",
    a: "Yes. Finlo lets you set up recurring expenses and upcoming payments, see when they are due, and mark them as paid — so nothing slips through the cracks.",
  },
  {
    q: "Can I see where my money was spent?",
    a: "Yes. Your dashboard and analytics show spending by category with percentages, so you can quickly understand where your money goes each month.",
  },
  {
    q: "Is my information private?",
    a: "Your financial data is tied to your account and isolated from other users with database row-level security. Only you can access your records, and you can export or delete your data from Settings at any time.",
  },
  {
    q: "Who created Finlo?",
    a: "Finlo is a product by ELVA.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id={SECTION_IDS.faq}
      style={{
        padding: "clamp(64px, 9vh, 100px) 0",
        scrollMarginTop: 72,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        <SectionKicker>FAQ</SectionKicker>
        <SectionHeading
          title="Questions,"
          accent="answered"
          description="Everything you need to know before you get started."
        />

        <div
          style={{
            maxWidth: 720,
            margin: "48px auto 0",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {FAQS.map((item, i) => {
            const open = openIndex === i;
            const id = `faq-${i}`;
            return (
              <div
                key={id}
                style={{
                  borderRadius: 16,
                  background: BRAND.surface,
                  border: `1px solid ${open ? "rgba(255,255,255,0.18)" : BRAND.borderSoft}`,
                  boxShadow: open ? SHADOWS.cardHover : SHADOWS.card,
                  overflow: "hidden",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`${id}-panel`}
                  onClick={() => setOpenIndex(open ? null : i)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "20px 22px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: FONTS.body,
                    color: open ? BRAND.text : BRAND.textSoft,
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{item.q}</span>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      background: open ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: BRAND.text,
                      transition: "transform 0.2s ease",
                      transform: open ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    <ChevronDown size={16} />
                  </span>
                </button>
                {open ? (
                  <div
                    id={`${id}-panel`}
                    role="region"
                    aria-label={item.q}
                    style={{
                      padding: "0 22px 20px",
                      fontSize: 14.5,
                      lineHeight: 1.7,
                      color: BRAND.textMuted,
                    }}
                  >
                    {item.a}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}