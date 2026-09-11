"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import { LANGUAGES, storeLanguage, type LangCode } from "@/lib/i18n";

interface LanguageSwitcherProps {
  value: LangCode;
  onChange: (lang: LangCode) => void;
  isDark?: boolean;
  accent?: string;
}

export function LanguageSwitcher({ value, onChange, isDark = false, accent = "#7890FF" }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = LANGUAGES.find((l) => l.code === value) || LANGUAGES[0];
  const bg = isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.65)";
  const border = isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.8)";
  const text = isDark ? "#eef1fb" : "#0f172a";
  const textSub = isDark ? "rgba(238,241,251,0.7)" : "rgba(100,116,139,0.9)";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Language"
        aria-label="Change language"
        style={{
          height: 36,
          minWidth: 62,
          padding: "0 10px",
          borderRadius: 8,
          border: `1px solid ${border}`,
          background: bg,
          color: text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.35)" : "0 8px 24px rgba(31,45,90,0.12)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <Globe size={16} />
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.3px" }}>{current.code.toUpperCase()}</span>
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 299 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 44,
              zIndex: 300,
              width: 224,
              maxHeight: 340,
              overflowY: "auto",
              background: isDark ? "#1c1d28" : "#ffffff",
              border: `1px solid ${border}`,
              borderRadius: 14,
              boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
              padding: 6,
            }}
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  onChange(l.code as LangCode);
                  storeLanguage(l.code as LangCode);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "9px 12px",
                  borderRadius: 9,
                  border: "none",
                  background: l.code === value ? (isDark ? "rgba(120,144,255,0.2)" : "rgba(120,144,255,0.14)") : "transparent",
                  color: l.code === value ? (isDark ? "#c9d4ff" : "#0A193D") : textSub,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: l.code === value ? 600 : 400,
                  fontFamily: "inherit",
                }}
              >
                <span>
                  {l.native}
                  <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.7 }}>{l.name}</span>
                </span>
                {l.code === value && <Check size={14} color={accent} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}