"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { BRAND, FONTS, GLASS, GRADIENTS, SHADOWS } from "./lp-tokens";

export function PrimaryButton({
  href,
  children,
  size = "md",
  className = "",
}: {
  href: string;
  children: ReactNode;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: GRADIENTS.primaryBtn,
        color: BRAND.white,
        borderRadius: 14,
        padding: size === "lg" ? "17px 30px" : "13px 24px",
        fontSize: size === "lg" ? 16 : 15,
        fontWeight: 600,
        fontFamily: FONTS.body,
        border: "none",
        cursor: "pointer",
        textDecoration: "none",
        boxShadow: "0 2px 10px rgba(10,25,61,0.22)",
        whiteSpace: "nowrap",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 12px 28px rgba(10,25,61,0.28)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 10px rgba(10,25,61,0.22)";
      }}
    >
      {children}
      <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
    </Link>
  );
}

export function SecondaryButton({
  href,
  children,
  size = "md",
  className = "",
}: {
  href: string;
  children: ReactNode;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: GLASS.bgStrong,
        color: BRAND.navy,
        borderRadius: 14,
        padding: size === "lg" ? "17px 30px" : "13px 24px",
        fontSize: size === "lg" ? 16 : 15,
        fontWeight: 600,
        fontFamily: FONTS.body,
        border: `1px solid ${BRAND.border}`,
        backdropFilter: GLASS.blurSoft,
        WebkitBackdropFilter: GLASS.blurSoft,
        boxShadow: GLASS.inset,
        cursor: "pointer",
        textDecoration: "none",
        whiteSpace: "nowrap",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = "rgba(10,25,61,0.22)";
        e.currentTarget.style.boxShadow = "0 14px 34px rgba(10,25,61,0.12), inset 0 1px 0 rgba(255,255,255,0.9)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = BRAND.border;
        e.currentTarget.style.boxShadow = GLASS.inset;
      }}
    >
      {children}
    </Link>
  );
}

export function SectionKicker({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 16px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.5)",
        border: `1px solid ${BRAND.borderSoft}`,
        backdropFilter: GLASS.blurSoft,
        WebkitBackdropFilter: GLASS.blurSoft,
        color: BRAND.navy,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        fontFamily: FONTS.body,
        marginBottom: 18,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: GRADIENTS.textAccent,
          display: "inline-block",
        }}
      />
      {children}
    </span>
  );
}

export function SectionHeading({
  title,
  accent,
  description,
  align = "center",
}: {
  title: string;
  accent?: string;
  description?: string;
  align?: "center" | "left";
}) {
  const centered = align === "center";
  return (
    <div style={{ maxWidth: 640, margin: centered ? "0 auto" : 0, textAlign: centered ? "center" : "left" }}>
      <h2
        style={{
          fontFamily: FONTS.heading,
          fontWeight: 700,
          fontSize: "clamp(30px, 4.2vw, 46px)",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          color: BRAND.text,
          margin: 0,
        }}
      >
        {title}{" "}
        {accent ? (
          <span
            style={{
              background: GRADIENTS.textAccent,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {accent}
          </span>
        ) : null}
      </h2>
      {description ? (
        <p
          style={{
            fontSize: "clamp(15px, 1.5vw, 17px)",
            lineHeight: 1.7,
            color: BRAND.textMuted,
            margin: "16px 0 0 0",
          }}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function ELVABadge({ dark = false }: { dark?: boolean }) {
  return (
    <div
      aria-label="Finlo is a product by ELVA"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 16px",
        borderRadius: 999,
        background: dark ? "rgba(255,255,255,0.06)" : BRAND.white,
        border: `1px solid ${dark ? "rgba(255,255,255,0.12)" : BRAND.borderSoft}`,
        boxShadow: dark ? "none" : SHADOWS.card,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: dark ? "rgba(255,255,255,0.65)" : BRAND.textMuted,
          fontFamily: FONTS.body,
          whiteSpace: "nowrap",
        }}
      >
        A product by
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/branding/Black ELVA.svg"
        alt="ELVA"
        width={72}
        height={28}
        style={{ objectFit: "contain", display: "block" }}
      />
    </div>
  );
}