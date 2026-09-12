"use client";

import Image from "next/image";

interface ParentBrandProps {
  companyName: string;
  logo: string;
  label?: string;
}

export function ParentBrand({ companyName, logo, label = "A product by" }: ParentBrandProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        marginTop: "clamp(24px, 4vh, 36px)",
        paddingTop: "clamp(16px, 3vh, 24px)",
        borderTop: "1px solid rgba(10,25,61,0.12)",
        width: "100%",
        maxWidth: "480px",
      }}
      role="contentinfo"
      aria-label={`Parent company: ${companyName}`}
    >
      <span
        style={{
          fontSize: "clamp(11px, 0.9vw, 12px)",
          fontWeight: 500,
          color: "rgba(100,116,139,0.7)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <Image
        src={logo}
        alt={companyName}
        width={120}
        height={40}
        quality={100}
        style={{
          width: "clamp(80px, 12vw, 120px)",
          height: "auto",
          objectFit: "contain",
          opacity: 0.75,
          transition: "opacity 0.2s ease",
        }}
        onLoad={(e) => {
          e.currentTarget.style.opacity = "0.75";
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.opacity = "0.75";
        }}
      />
    </div>
  );
}