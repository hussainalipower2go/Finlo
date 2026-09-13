import { TrendingUp, TrendingDown, Wallet, ReceiptText, CalendarClock } from "lucide-react";
import { BRAND, DASH, FONTS, GLASS } from "./lp-tokens";
import { AreaGraph, Bars } from "./showcase-graph";
import { SectionHeading, SectionKicker } from "./lp-ui";

const FLOATING = [
  {
    icon: TrendingUp,
    title: "Total Income",
    desc: "Every source of income, in one place.",
    top: "-16px",
    left: "-14px",
  },
  {
    icon: TrendingDown,
    title: "Total Expenses",
    desc: "Know exactly what you spent.",
    top: "38%",
    right: "-10px",
  },
  {
    icon: Wallet,
    title: "Balance",
    desc: "Your current balance, always visible.",
    bottom: "-18px",
    left: "-8px",
  },
];

export default function ProductPreview() {
  return (
    <section
      style={{
        padding: "clamp(64px, 9vh, 100px) 0",
        background: "rgba(120,144,255,0.06)",
        color: BRAND.text,
        position: "relative",
        overflow: "hidden",
        borderTop: "1px solid rgba(255,255,255,0.7)",
        borderBottom: "1px solid rgba(255,255,255,0.7)",
      }}
    >
      {/* Decorative glows */}
      <div
        style={{
          position: "absolute",
          top: -140,
          left: "10%",
          width: 420,
          height: 420,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(120,144,255,0.18) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -120,
          right: "6%",
          width: 460,
          height: 460,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(56,189,248,0.14) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 clamp(20px, 5vw, 40px)",
        }}
      >
        <SectionKicker>Product Preview</SectionKicker>
        <SectionHeading
          title="See your whole financial"
          accent="picture at a glance"
          description="Income, spending, categories, and upcoming bills — the dashboard brings it all together."
        />

        {/* Framed analytics dashboard */}
        <div style={{ position: "relative", maxWidth: 980, margin: "56px auto 0" }}>
          {FLOATING.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                style={{
                  position: "absolute",
                  zIndex: 3,
                  top: f.top,
                  left: f.left,
                  right: f.right,
                  bottom: f.bottom,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 16,
                  background: GLASS.bgStrong,
                  border: "1px solid rgba(255,255,255,0.9)",
                  backdropFilter: GLASS.blur,
                  WebkitBackdropFilter: GLASS.blur,
                  boxShadow: "0 16px 40px rgba(10,25,61,0.16), inset 0 1px 0 rgba(255,255,255,0.95)",
                  maxWidth: 210,
                }}
                className="landing-chip"
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.75)",
                    border: "1px solid rgba(255,255,255,0.95)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#526DDF",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.navy }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: BRAND.textMuted, marginTop: 2 }}>
                    {f.desc}
                  </div>
                </div>
              </div>
            );
          })}

          <div
            style={{
              position: "relative",
              zIndex: 1,
              borderRadius: 26,
              background: "rgba(255,255,255,0.97)",
              color: DASH.text,
              boxShadow: "0 40px 120px rgba(4,8,26,0.55)",
              overflow: "hidden",
              padding: "22px 24px",
            }}
          >
            {/* Mock header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                paddingBottom: 16,
                borderBottom: `1px solid ${DASH.borderSoft}`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/finlo-brand-mark.svg" alt="" width={28} height={28} style={{ borderRadius: 8 }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: BRAND.navy, fontFamily: FONTS.heading }}>
                Finlo
              </span>
              <div style={{ flex: 1 }} />
              {["Dashboard", "Transactions", "Budgets", "Analytics"].map((tab, i) => (
                <span
                  key={tab}
                  style={{
                    fontSize: 12,
                    fontWeight: i === 3 ? 700 : 500,
                    color: i === 3 ? BRAND.navy : DASH.textFaint,
                    background: i === 3 ? "rgba(10,25,61,0.07)" : "transparent",
                    padding: "6px 12px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab}
                </span>
              ))}
            </div>

            {/* Stat cards */}
            <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
              {[
                {
                  label: "Total Income",
                  value: "Rs. 2,18,400",
                  delta: "+14%",
                  color: "#047857",
                  text: "6 months",
                },
                {
                  label: "Total Expenses",
                  value: "Rs. 1,64,300",
                  delta: "-3%",
                  color: "#e14d5d",
                  text: "6 months",
                },
                {
                  label: "Balance",
                  value: "Rs. 84,720",
                  delta: "+9%",
                  color: "#1d4ed8",
                  text: "available",
                },
              ].map((s) => (
                <div key={s.label} style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      borderRadius: 16,
                      padding: "14px 16px",
                      background: "rgba(10,25,61,0.03)",
                      border: `1px solid ${DASH.borderSoft}`,
                    }}
                  >
                    <div style={{ fontSize: 11, color: DASH.textMuted, fontWeight: 500 }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: DASH.text, marginTop: 4, fontFamily: FONTS.heading }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginTop: 4 }}>
                      {s.delta} · {s.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart + categories */}
            <div style={{ display: "flex", gap: 18, marginTop: 18, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 340px", minWidth: 240 }}>
                <div style={{ fontSize: 12, color: DASH.textMuted, fontWeight: 600, marginBottom: 10 }}>
                  Spending — last 6 months
                </div>
                <div
                  style={{
                    borderRadius: 16,
                    padding: "14px 16px",
                    background: BRAND.white,
                    border: `1px solid ${DASH.borderSoft}`,
                  }}
                >
                  <AreaGraph height={96} />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 10,
                      color: DASH.textFaint,
                      marginTop: 6,
                    }}
                  >
                    <span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span>
                  </div>
                </div>
              </div>

              <div style={{ flex: "1 1 240px", minWidth: 200 }}>
                <div style={{ fontSize: 12, color: DASH.textMuted, fontWeight: 600, marginBottom: 10 }}>
                  Spending categories
                </div>
                <div
                  style={{
                    borderRadius: 16,
                    padding: "16px",
                    background: BRAND.white,
                    border: `1px solid ${DASH.borderSoft}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 11,
                  }}
                >
                  {[
                    { label: "Food & Dining", pct: "32%", color: "#7890FF", w: "32%" },
                    { label: "Bills & Utilities", pct: "27%", color: "#10b981", w: "27%" },
                    { label: "Transport", pct: "18%", color: "#f59e0b", w: "18%" },
                    { label: "Shopping", pct: "14%", color: "#e14d5d", w: "14%" },
                    { label: "Other", pct: "9%", color: "#0A193D", w: "9%" },
                  ].map((c) => (
                    <div key={c.label}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          color: DASH.textSoft,
                          marginBottom: 5,
                        }}
                      >
                        <span>{c.label}</span>
                        <span style={{ fontWeight: 600 }}>{c.pct}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 999, background: "rgba(10,25,61,0.06)" }}>
                        <div
                          style={{
                            width: c.w,
                            height: "100%",
                            borderRadius: 999,
                            background: c.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recurring bills + transactions */}
            <div style={{ display: "flex", gap: 18, marginTop: 18, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 300px", minWidth: 220 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 12,
                    color: DASH.textMuted,
                    fontWeight: 600,
                    marginBottom: 10,
                  }}
                >
                  <CalendarClock size={14} /> Recurring bills
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { name: "Flat Rent", amt: "Rs. 20,000", due: "due Jul 1" },
                    { name: "Internet", amt: "Rs. 3,500", due: "due Jul 12" },
                    { name: "Streaming", amt: "Rs. 1,200", due: "due Jul 5" },
                  ].map((b) => (
                    <div
                      key={b.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: 12,
                        background: "rgba(10,25,61,0.03)",
                        border: `1px solid ${DASH.borderSoft}`,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: DASH.textSoft }}>{b.name}</div>
                        <div style={{ fontSize: 11, color: DASH.textFaint }}>{b.due}</div>
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: DASH.text }}>{b.amt}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ flex: "1 1 300px", minWidth: 220 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 12,
                    color: DASH.textMuted,
                    fontWeight: 600,
                    marginBottom: 10,
                  }}
                >
                  <ReceiptText size={14} /> Where money went
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 96 }}>
                  <div style={{ flex: 1 }}>
                    <Bars data={[12, 18, 10, 22, 16, 26]} color="#7890FF" />
                    <div style={{ textAlign: "center", fontSize: 10, color: DASH.textFaint, marginTop: 6 }}>Spend by month</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Bars data={[8, 12, 9, 16, 11, 20]} color="#10b981" />
                    <div style={{ textAlign: "center", fontSize: 10, color: DASH.textFaint, marginTop: 6 }}>Saved</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}