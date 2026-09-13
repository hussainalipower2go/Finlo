import { TrendingUp, Wallet } from "lucide-react";
import { TrendGraph } from "./showcase-graph";
import { BRAND, DASH, FONTS, GLASS, GRADIENTS, SHADOWS } from "./lp-tokens";
import { ELVABadge, PrimaryButton, SecondaryButton } from "./lp-ui";

function DashboardPreview() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
      }}
      aria-hidden="true"
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          inset: "-6% -10%",
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(120,144,255,0.28) 0%, rgba(82,109,223,0.08) 48%, transparent 72%)",
          filter: "blur(44px)",
          zIndex: 0,
        }}
      />

      {/* Framed app window */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          borderRadius: 26,
          background: GLASS.bgStrong,
          border: `1px solid ${GLASS.border}`,
          boxShadow: GLASS.shadow,
          backdropFilter: GLASS.blur,
          WebkitBackdropFilter: GLASS.blur,
          overflow: "hidden",
          padding: 18,
        }}
      >
        {/* Window top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "2px 4px 16px",
            borderBottom: `1px solid ${DASH.borderSoft}`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/finlo-brand-mark.svg"
            alt=""
            width={28}
            height={28}
            style={{ borderRadius: 8 }}
          />
          <span style={{ fontSize: 16, fontWeight: 700, color: BRAND.navy, fontFamily: FONTS.heading }}>
            Finlo
          </span>
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(10,25,61,0.04)",
              borderRadius: 999,
              padding: "5px 12px",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 999, background: BRAND.greenLight }} />
            <span style={{ fontSize: 12, color: DASH.textMuted, fontWeight: 500 }}>
              Dashboard
            </span>
          </div>
        </div>

        {/* Balance card */}
        <div
          style={{
            marginTop: 16,
            borderRadius: 18,
            padding: "18px 20px",
            background: GRADIENTS.darkPanel,
            color: BRAND.white,
            boxShadow: SHADOWS.navy,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -30,
              width: 160,
              height: 160,
              borderRadius: 999,
              background: "radial-gradient(circle, rgba(120,144,255,0.35) 0%, transparent 70%)",
            }}
          />
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>
            Current Balance
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              fontFamily: FONTS.heading,
              marginTop: 4,
              letterSpacing: "-0.02em",
            }}
          >
            Rs. 84,720
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 10,
              fontSize: 12,
              color: "#34d399",
              fontWeight: 600,
            }}
          >
            <span>▲</span> +12.4% this month
          </div>
        </div>

        {/* Stat row */}
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <div
            style={{
              flex: 1,
              borderRadius: 14,
              padding: "12px 14px",
              background: "rgba(5,150,105,0.07)",
              border: "1px solid rgba(5,150,105,0.16)",
            }}
          >
            <div style={{ fontSize: 11, color: DASH.textMuted, fontWeight: 500 }}>Income</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#047857", marginTop: 3 }}>
              Rs. 36,500
            </div>
          </div>
          <div
            style={{
              flex: 1,
              borderRadius: 14,
              padding: "12px 14px",
              background: "rgba(225,77,93,0.07)",
              border: "1px solid rgba(225,77,93,0.16)",
            }}
          >
            <div style={{ fontSize: 11, color: DASH.textMuted, fontWeight: 500 }}>Expenses</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#e14d5d", marginTop: 3 }}>
              Rs. 22,180
            </div>
          </div>
          <div
            style={{
              flex: 1,
              borderRadius: 14,
              padding: "12px 14px",
              background: "rgba(37,99,235,0.07)",
              border: "1px solid rgba(37,99,235,0.16)",
            }}
          >
            <div style={{ fontSize: 11, color: DASH.textMuted, fontWeight: 500 }}>Saved</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1d4ed8", marginTop: 3 }}>
              39%
            </div>
          </div>
        </div>

        {/* Trend + safe to spend */}
        <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "stretch" }}>
          <div
            style={{
              flex: 1.4,
              borderRadius: 14,
              padding: "12px 14px",
              background: BRAND.white,
              border: `1px solid ${DASH.borderSoft}`,
            }}
          >
            <div style={{ fontSize: 11, color: DASH.textMuted, fontWeight: 500 }}>6-month trend</div>
            <TrendGraph />
          </div>
          <div
            style={{
              flex: 1,
              borderRadius: 14,
              padding: "12px 14px",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: 11, color: "#047857", fontWeight: 600 }}>Safe to Spend</div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#065f46",
                fontFamily: FONTS.heading,
                marginTop: 2,
              }}
            >
              Rs. 8,150
            </div>
            <div style={{ height: 5, borderRadius: 999, background: "rgba(16,185,129,0.2)", marginTop: 8 }}>
              <div
                style={{
                  width: "68%",
                  height: "100%",
                  borderRadius: 999,
                  background: GRADIENTS.green,
                }}
              />
            </div>
          </div>
        </div>

        {/* Recent + upcoming */}
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <div style={{ flex: 1.2, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: DASH.textMuted, fontWeight: 600, marginBottom: 8 }}>
              Recent transactions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { name: "Salary", amt: "+ Rs. 36,500", icon: "↑", color: "#047857", bg: "rgba(5,150,105,0.1)" },
                { name: "Groceries", amt: "- Rs. 4,250", icon: "↓", color: "#b91c1c", bg: "rgba(225,77,93,0.1)" },
                { name: "Electricity", amt: "- Rs. 3,800", icon: "↓", color: "#b91c1c", bg: "rgba(225,77,93,0.1)" },
              ].map((r) => (
                <div
                  key={r.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 11px",
                    borderRadius: 12,
                    background: "rgba(10,25,61,0.03)",
                    border: `1px solid ${DASH.borderSoft}`,
                  }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: r.bg,
                      color: r.color,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {r.icon}
                  </span>
                  <span style={{ flex: 1, fontSize: 12.5, color: DASH.textSoft, fontWeight: 500 }}>
                    {r.name}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: r.color }}>{r.amt}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 0.8, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: DASH.textMuted, fontWeight: 600, marginBottom: 8 }}>
              Upcoming bills
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { name: "Rent", due: "Jul 1" },
                { name: "Netflix", due: "Jul 5" },
                { name: "Internet", due: "Jul 10" },
              ].map((r) => (
                <div
                  key={r.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 11px",
                    borderRadius: 12,
                    background: BRAND.white,
                    border: `1px solid ${DASH.borderSoft}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: BRAND.navy,
                      background: "rgba(10,25,61,0.06)",
                      borderRadius: 8,
                      padding: "4px 7px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.due}
                  </span>
                  <span style={{ flex: 1, fontSize: 12.5, color: DASH.textSoft, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const FLOATING = [
  {
    icon: TrendingUp,
    title: "Income up",
    desc: "Rs. 36,500 this month",
    top: "10%",
    left: "-16px",
    tint: "#059669",
  },
  {
    icon: Wallet,
    title: "Safe to spend",
    desc: "Rs. 8,150 available",
    bottom: "9%",
    right: "-12px",
    tint: "#526DDF",
  },
];

export default function Hero() {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundImage: "url('/login-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        padding: "clamp(64px, 9vh, 96px) 0 clamp(64px, 9vh, 110px)",
      }}
    >
      {/* Readability overlays */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.50) 40%, rgba(223,236,255,0.62) 100%)",
          pointerEvents: "none",
        }}
      />
      {/* Sunrise warmth */}
      <div
        style={{
          position: "absolute",
          bottom: -160,
          left: "30%",
          width: 560,
          height: 560,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,210,160,0.35) 0%, transparent 62%)",
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />
      {/* Periwinkle glow */}
      <div
        style={{
          position: "absolute",
          top: -140,
          right: -120,
          width: 520,
          height: 520,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(120,144,255,0.25) 0%, transparent 62%)",
          filter: "blur(36px)",
          pointerEvents: "none",
        }}
      />

      <div
        className="landing-hero-grid"
        style={{
          position: "relative",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 clamp(20px, 5vw, 40px)",
          display: "grid",
          gap: 40,
          alignItems: "center",
        }}
      >
        {/* LEFT — copy (≈45%) */}
        <div className="landing-hero-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/finlo-logo-background.svg"
            alt="Finlo"
            width={200}
            height={67}
            style={{
              width: "clamp(180px, 20vw, 260px)",
              height: "auto",
              objectFit: "contain",
              display: "block",
              marginBottom: 28,
            }}
          />

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 999,
              background: GLASS.chipBg,
              border: `1px solid ${GLASS.chipBorder}`,
              backdropFilter: GLASS.blurSoft,
              WebkitBackdropFilter: GLASS.blurSoft,
              boxShadow: GLASS.inset,
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: BRAND.navy,
              textTransform: "uppercase",
              fontFamily: FONTS.body,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: GRADIENTS.textAccent,
                display: "inline-block",
              }}
            />
            Personal Finance, Simplified
          </div>

          <h1
            style={{
              fontFamily: FONTS.heading,
              fontWeight: 800,
              fontSize: "clamp(38px, 5.4vw, 60px)",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: BRAND.navy,
              margin: "20px 0 0",
            }}
          >
            Take Control of{" "}
            <span
              style={{
                background: GRADIENTS.textAccent,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Your Money.
            </span>
          </h1>

          <p
            style={{
              fontSize: "clamp(15px, 1.6vw, 18px)",
              lineHeight: 1.7,
              color: BRAND.textMuted,
              maxWidth: 460,
              margin: "18px 0 0",
            }}
          >
            Track expenses, manage income, plan recurring bills, and understand where your money goes — all in one simple place.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 14,
              marginTop: 32,
            }}
          >
            <PrimaryButton href="/signup" size="lg">
              Get Started Free
            </PrimaryButton>
            <SecondaryButton href="/login" size="lg">
              Log In
            </SecondaryButton>
          </div>

          <div style={{ marginTop: 28 }}>
            <ELVABadge />
          </div>
        </div>

        {/* RIGHT — dashboard preview (≈55%) */}
        <div className="landing-hero-right" style={{ position: "relative", marginTop: 24 }}>
          <DashboardPreview />

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
                  gap: 10,
                  padding: "12px 16px",
                  borderRadius: 16,
                  background: GLASS.bgStrong,
                  border: `1px solid ${GLASS.border}`,
                  backdropFilter: GLASS.blur,
                  WebkitBackdropFilter: GLASS.blur,
                  boxShadow: "0 16px 40px rgba(10,25,61,0.16), inset 0 1px 0 rgba(255,255,255,0.9)",
                  maxWidth: 220,
                }}
                className="landing-chip"
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.7)",
                    border: `1px solid rgba(255,255,255,0.9)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: f.tint,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: BRAND.navy }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: BRAND.textMuted, marginTop: 2 }}>{f.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}