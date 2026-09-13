import { BRAND, FONTS, GLASS, SHADOWS } from "./lp-tokens";
import { PrimaryButton, SecondaryButton } from "./lp-ui";

export default function FinalCTA() {
  return (
    <section
      style={{
        padding: "clamp(56px, 8vh, 96px) 0",
        background: "transparent",
        color: BRAND.text,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        <div
          style={{
            position: "relative",
            borderRadius: 30,
            padding: "clamp(40px, 6vw, 72px) clamp(24px, 6vw, 72px)",
            background: GLASS.bgStrong,
            color: BRAND.text,
            border: `1px solid ${GLASS.border}`,
            backdropFilter: GLASS.blurSoft,
            WebkitBackdropFilter: GLASS.blurSoft,
            boxShadow: SHADOWS.glow,
            textAlign: "center",
            overflow: "hidden",
          }}
        >
          <h2 style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: "clamp(30px, 4.4vw, 48px)", lineHeight: 1.12, letterSpacing: "-0.02em", margin: 0, color: BRAND.text }}>
            Ready to Take Control of Your Finances?
          </h2>
          <p style={{ fontSize: "clamp(15px,1.6vw,17px)", color: BRAND.textMuted, margin: "14px auto 0", maxWidth: 460, lineHeight: 1.6 }}>
            Start organizing your money with Finlo.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 34 }}>
            <PrimaryButton href="/signup" size="lg">Create Your Finlo Account</PrimaryButton>
            <SecondaryButton href="/login" size="lg">Already have an account? Log In</SecondaryButton>
          </div>
        </div>
      </div>
    </section>
  );
}