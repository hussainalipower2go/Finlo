import Link from "next/link";
import { BRAND, FONTS, SECTION_IDS } from "./lp-tokens";

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: `#${SECTION_IDS.features}` },
      { label: "How It Works", href: `#${SECTION_IDS.howItWorks}` },
      { label: "Security", href: `#${SECTION_IDS.security}` },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: `#${SECTION_IDS.about}` },
      { label: "ELVA", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", href: "/login" },
      { label: "Sign Up", href: "/signup" },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: "#0A193D",
        color: BRAND.white,
        padding: "clamp(48px, 7vh, 72px) 0 32px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -160,
          left: "30%",
          width: 420,
          height: 420,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(120,144,255,0.18) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        {/* Top */}
        <div
          className="landing-footer-grid"
          style={{
            display: "grid",
            gap: 32,
            paddingBottom: 40,
            borderBottom: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {/* Brand */}
          <div className="landing-footer-brand">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/finlo-brand-mark.svg"
                alt=""
                width={40}
                height={40}
                style={{ borderRadius: 11, objectFit: "cover", display: "block" }}
              />
              <span style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 24 }}>Finlo</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.55)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                A product by
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/branding/White ELVA.svg"
                alt="ELVA"
                width={72}
                height={28}
                style={{ objectFit: "contain", display: "block", opacity: 0.9 }}
              />
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title} className="landing-footer-col">
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)",
                  marginBottom: 14,
                  fontFamily: FONTS.body,
                }}
              >
                {col.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="landing-footer-link"
                    style={{
                      fontSize: 14,
                      color: "rgba(255,255,255,0.75)",
                      textDecoration: "none",
                      width: "fit-content",
                    }}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingTop: 24,
            fontSize: 13,
            color: "rgba(255,255,255,0.55)",
            textAlign: "center",
          }}
        >
          © 2026 Finlo. A product by ELVA Technologies.
        </div>
      </div>
    </footer>
  );
}