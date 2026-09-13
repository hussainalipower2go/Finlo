import { ShieldCheck, KeyRound, Database, Lock } from "lucide-react";
import { BRAND, FONTS, SHADOWS, SECTION_IDS } from "./lp-tokens";
import { SectionHeading, SectionKicker } from "./lp-ui";

const ITEMS = [
  {
    icon: Lock,
    title: "Secure sign-in",
    desc: "Accounts use email-and-password authentication with Google and Apple sign-in options, powered by Supabase Auth.",
    tint: "#2563eb",
  },
  {
    icon: KeyRound,
    title: "Your data stays yours",
    desc: "Each account's financial data is isolated with row-level security on the database, so users only see their own records.",
    tint: "#7c3aed",
  },
  {
    icon: ShieldCheck,
    title: "Session-based access",
    desc: "Authenticated sessions guard every private page, from the dashboard to your account settings.",
    tint: "#059669",
  },
  {
    icon: Database,
    title: "You stay in control",
    desc: "Export your data to CSV or PDF, and delete your account and data directly from settings whenever you want.",
    tint: "#f59e0b",
  },
];

export default function Security() {
  return (
    <section
      id={SECTION_IDS.security}
      style={{
        padding: "clamp(64px, 9vh, 100px) 0",
        scrollMarginTop: 72,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        <SectionKicker>Security & Privacy</SectionKicker>
        <SectionHeading
          title="Private by design,"
          accent="protected by default"
          description="Your financial information is personal. Finlo is built so only you can access it."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(1, 1fr)",
            gap: 16,
            marginTop: 44,
          }}
          className="landing-features-grid"
        >
          {ITEMS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                style={{
                  borderRadius: 18,
                  padding: "24px 22px",
                  background: BRAND.surface,
                  border: `1px solid ${BRAND.borderSoft}`,
                  boxShadow: SHADOWS.card,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={20} strokeWidth={2} color={s.tint} />
                  </span>
                  <h3
                    style={{
                      fontFamily: FONTS.heading,
                      fontWeight: 600,
                      fontSize: 17,
                      color: BRAND.text,
                      margin: 0,
                    }}
                  >
                    {s.title}
                  </h3>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: BRAND.textMuted, margin: 0 }}>
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}