import { BRAND, FONTS, GLASS, SHADOWS, SECTION_IDS } from "./lp-tokens";
import { SectionKicker } from "./lp-ui";

const POINTS = [
  "Effortless everyday money tracking",
  "Clear income and expense management",
  "Helpful visibility into recurring bills",
  "Insights that make your money make sense",
];

export default function About() {
  return (
    <section
      id={SECTION_IDS.about}
      style={{
        padding: "clamp(64px, 9vh, 100px) 0",
        scrollMarginTop: 72,
        background: "rgba(120,144,255,0.04)",
        borderTop: "1px solid rgba(255,255,255,0.7)",
        borderBottom: "1px solid rgba(255,255,255,0.7)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 clamp(20px, 5vw, 40px)",
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 40,
          alignItems: "center",
        }}
      >
        {/* Left — about copy */}
        <div style={{ gridColumn: "span 12" }}>
          <SectionKicker>About Finlo</SectionKicker>
          <h2
            style={{
              fontFamily: FONTS.heading,
              fontWeight: 700,
              fontSize: "clamp(28px, 3.8vw, 40px)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: BRAND.text,
              margin: 0,
              maxWidth: 560,
            }}
          >
            Simple, clear, accessible money management.
          </h2>
          <p
            style={{
              fontSize: "clamp(15px,1.5vw,17px)",
              lineHeight: 1.7,
              color: BRAND.textMuted,
              maxWidth: 560,
              margin: "18px 0 0",
            }}
          >
            Finlo is a personal finance platform designed to make everyday money management simple, clear, and accessible.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(1, 1fr)",
              gap: 12,
              marginTop: 28,
              maxWidth: 560,
            }}
          >
            {POINTS.map((p) => (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: "rgba(10,25,61,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: BRAND.navy,
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <span style={{ fontSize: 15, color: BRAND.textSoft, fontWeight: 500 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — ELVA glass card */}
        <div style={{ gridColumn: "span 12" }}>
          <div
            style={{
              position: "relative",
              borderRadius: 26,
              padding: "clamp(32px, 5vw, 52px)",
              background: GLASS.bgStrong,
              color: BRAND.text,
              boxShadow: SHADOWS.glow,
              textAlign: "center",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -60,
                right: -60,
                width: 180,
                height: 180,
                borderRadius: 999,
                background: "radial-gradient(circle, rgba(120,144,255,0.28) 0%, transparent 70%)",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 18,
              }}
            >
              <img
                src="/branding/Black ELVA.svg"
                alt="ELVA"
                width={72}
                height={30}
                style={{ objectFit: "contain", display: "block" }}
              />
            </div>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: BRAND.textSoft,
                maxWidth: 420,
                margin: "20px auto 0",
              }}
            >
              Finlo is a product by ELVA.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}