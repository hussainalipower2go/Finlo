"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRAND, FONTS, GRADIENTS, SHADOWS, SECTION_IDS } from "./lp-tokens";

const NAV = [
  { label: "Features", href: `#${SECTION_IDS.features}` },
  { label: "How It Works", href: `#${SECTION_IDS.howItWorks}` },
  { label: "Security", href: `#${SECTION_IDS.security}` },
  { label: "About", href: `#${SECTION_IDS.about}` },
  { label: "FAQ", href: `#${SECTION_IDS.faq}` },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: scrolled ? "var(--lp-nav-bg-scrolled)" : "var(--lp-nav-bg)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        borderBottom: scrolled ? `1px solid ${BRAND.borderSoft}` : "1px solid transparent",
        transition: "background 0.2s ease, border-color 0.2s ease, color 0.2s ease",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "14px clamp(20px, 5vw, 40px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        {/* LEFT — logo removed by user request */}
        {/* CENTER — nav links (desktop) */}
        <nav aria-label="Main navigation" style={{ display: "none", alignItems: "center", gap: 6 }}>
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                padding: "9px 14px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                color: BRAND.textSoft,
                textDecoration: "none",
                fontFamily: FONTS.body,
                transition: "background 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(10,25,61,0.05)";
                e.currentTarget.style.color = BRAND.navy;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = BRAND.textSoft;
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* RIGHT — CTAs (desktop) */}
        <div style={{ display: "none", alignItems: "center", gap: 12 }}>
          <Link
            href="/login"
            style={{
padding: "10px 18px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              color: BRAND.text,
              textDecoration: "none",
              fontFamily: FONTS.body,
            }}>
            Log In
          </Link>
          <Link
            href="/signup"
            style={{
              padding: "11px 22px",
              borderRadius: 12,
              background: GRADIENTS.primaryBtn,
              color: BRAND.white,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: FONTS.body,
              boxShadow: SHADOWS.navy,
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              Get Started
            </Link>
        </div>
      </div>
    </header>
  );
}