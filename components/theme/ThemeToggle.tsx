"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        padding: "9px 14px",
        borderRadius: 999,
        background: isDark ? "rgba(255,255,255,0.08)" : "rgba(10,25,61,0.05)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.14)" : "rgba(10,25,61,0.10)"}`,
        color: isDark ? "rgba(255,255,255,0.85)" : "#0A193D",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
        transition: "all 0.3s ease",
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontFamily: "inherit",
      }}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}