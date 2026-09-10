"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { createClient } from "@/lib/supabase";
import { FinloLogoImg } from "@/components/branding/FinloLogoImg";

export default function SignupPage() {
  const isDark = false;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const p = {
    bg: isDark ? "#080b1a" : "#FEFBFE",
    navBg: isDark ? "#080b1a" : "#FEFBFE",
    line: isDark ? "rgba(10,25,61,0.2)" : "rgba(10,25,61,0.22)",
    lineSoft: isDark ? "rgba(10,25,61,0.15)" : "rgba(10,25,61,0.14)",
    lineDivider: isDark ? "rgba(10,25,61,0.18)" : "rgba(10,25,61,0.16)",
    overlay: isDark
      ? "linear-gradient(180deg, rgba(8,11,26,0.72) 0%, rgba(8,11,26,0.45) 35%, rgba(8,11,26,0.55) 60%, rgba(8,11,26,0.90) 100%)"
      : "linear-gradient(180deg, rgba(248,250,252,0.42) 0%, rgba(248,250,252,0.06) 35%, rgba(248,250,252,0.1) 60%, rgba(248,250,252,0.42) 100%)",
    radial: isDark ? "rgba(79,70,229,0.07)" : "rgba(79,70,229,0.10)",
    text: isDark ? "#fff" : "#0f172a",
    title: isDark ? "#E9EDFB" : "#1e293b",
    sub: isDark ? "rgba(210,200,255,0.75)" : "rgba(71,85,105,0.8)",
    desc: isDark ? "rgba(148,130,200,0.55)" : "rgba(100,116,139,0.85)",
    descFaint: isDark ? "rgba(130,110,190,0.5)" : "rgba(100,116,139,0.75)",
    label: isDark ? "rgba(196,181,253,0.85)" : "rgba(51,65,85,0.9)",
    iconMuted: isDark ? "rgba(120,100,200,0.5)" : "rgba(100,116,139,0.6)",
    tagline: isDark ? "rgba(167,139,250,0.7)" : "rgba(10,25,61,0.72)",
    cardBg: isDark ? "rgba(16,12,42,0.75)" : "rgba(255,255,255,0.85)",
    panel: isDark ? "rgba(14,10,38,0.72)" : "rgba(255,255,255,0.9)",
    subPanel: isDark ? "rgba(8,6,22,0.85)" : "rgba(248,250,252,0.95)",
    inputBg: isDark ? "rgba(10,8,30,0.85)" : "rgba(255,255,255,0.95)",
    inputText: isDark ? "rgba(220,210,255,0.9)" : "rgba(15,23,42,0.92)",
    track: isDark ? "rgba(255,255,255,0.07)" : "rgba(10,25,61,0.1)",
    featBg: isDark ? "rgba(10,25,61,0.18)" : "rgba(10,25,61,0.08)",
    featLine: isDark ? "rgba(10,25,61,0.35)" : "rgba(10,25,61,0.25)",
    pillBg: "rgba(255,255,255,0.9)",
    pillText: "rgba(10,25,61,0.85)",
  };

  async function handleSignup() {
    if (loading) return;
    setError("");
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      toast({ type: "error", message: "Passwords do not match." });
      return;
    }
    if (!agreeTerms) {
      setError("Please agree to the Terms & Privacy Policy.");
      toast({ type: "error", message: "Please agree to the Terms & Privacy Policy." });
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
    if (signUpError) {
      setError(signUpError.message);
      toast({ type: "error", message: signUpError.message });
      setLoading(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      toast({ type: "success", message: "Account created. Welcome to Finlo." });
      setLoading(false);
      router.push("/onboarding");
      router.refresh();
    } else {
      toast({ type: "success", message: "Check your email to confirm your account." });
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleApple() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      background: p.bg,
      display: "flex",
      alignItems: "stretch",
      justifyContent: "center",
      fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: "relative",
    }}>
      <div className="finlo-outer"
        style={{
        width: "100%",
        maxWidth: "1536px",
        display: "flex",
        border: `1px solid ${p.line}`,
        borderRadius: "20px",
        position: "relative",
        zIndex: 1,
        margin: "0 auto",
      }}>

        {/* ═══════════ LEFT PANEL ═══════════ */}
        <div className="finlo-left" style={{
          width: "50%",
          minHeight: "100vh",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          borderRight: `1px solid ${p.lineSoft}`,
        }}>

          {/* MOUNTAIN BACKGROUND IMAGE */}
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: isDark ? "url('/mountain.png')" : "url('/mountains11.png')",
            backgroundSize: "cover",
            backgroundPosition: "70% center",
            backgroundRepeat: "no-repeat",
            zIndex: 0,
          }} />

          {/* Overlay so text stays readable */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: p.overlay,
            zIndex: 1,
          }} />

          {/* Extra bottom glow for card area */}
          <div style={{
            position: "absolute",
            bottom: "50px",
            left: "30px",
            width: "400px",
            height: "130px",
            background: "radial-gradient(ellipse, rgba(20,36,83,0.18) 0%, transparent 70%)",
            filter: "blur(28px)",
            zIndex: 1,
            pointerEvents: "none",
          }} />

          {/* CONTENT */}
          <div style={{
            position: "relative",
            zIndex: 2,
            padding: "40px 52px 36px 52px",
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}>

            {/* LOGO */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "48px" }}>
              <FinloLogoImg />
              <div>
                <div style={{ fontSize: "17px", fontWeight: 700, color: p.text, lineHeight: 1.1 }}>Finlo</div>
                <div style={{ fontSize: "11px", color: p.tagline, marginTop: "1px" }}>Plan. Spend. Stay Ahead.</div>
              </div>
            </div>

            {/* HERO */}
            <h1 style={{
              fontSize: "clamp(40px, 4vw, 62px)", fontWeight: 800, lineHeight: 1.05,
              color: p.text, letterSpacing: "-1.5px", margin: "0 0 18px 0",
              textShadow: isDark ? "0 2px 20px rgba(0,0,0,0.5)" : "0 2px 16px rgba(255,255,255,0.6)",
            }}>
              Plan today.<br />
              Live <span style={{
                background: "linear-gradient(90deg, #142453, #0A193D)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>tomorrow.</span>
            </h1>
            <p style={{
              fontSize: "15px", color: p.sub, lineHeight: 1.65,
              margin: "0 0 36px 0", maxWidth: "390px",
              textShadow: isDark ? "0 1px 8px rgba(0,0,0,0.6)" : "0 1px 6px rgba(255,255,255,0.7)",
            }}>
              Finlo helps you understand your cash flow,<br />
              plan ahead, and spend with confidence.
            </p>

            {/* FEATURES */}
            <div className="finlo-features" style={{ marginBottom: "36px" }}>
              {[
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#0A193D" : "#0A193D"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      <circle cx="12" cy="16" r="1.5"/>
                    </svg>
                  ),
                  bg: p.featBg, border: p.featLine,
                  title: "Know your runway",
                  desc: "See how many days your money will last.",
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#34d399" : "#059669"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <polyline points="9 12 11 14 15 10"/>
                    </svg>
                  ),
                  bg: isDark ? "rgba(16,185,129,0.14)" : "rgba(16,185,129,0.1)", border: isDark ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.22)",
                  title: "Spend with confidence",
                  desc: "Know how much you can safely spend today.",
                },
                {
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#60a5fa" : "#2563eb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10"/>
                      <line x1="12" y1="20" x2="12" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                  ),
                  bg: isDark ? "rgba(59,130,246,0.14)" : "rgba(59,130,246,0.1)", border: isDark ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.22)",
                  title: "Stay on track",
                  desc: "Track upcoming bills, income, and goals.",
                },
              ].map((f, i) => (
                <div key={i} className="finlo-feature">
                  <div className="finlo-f-icon" style={{
                    width: "44px", height: "44px", borderRadius: "12px",
                    background: f.bg, border: `1px solid ${f.border}`,
                  }}>
                    {f.icon}
                  </div>
                  <div className="finlo-f-text">
                    <div className="finlo-f-title" style={{ fontSize: "14px", color: p.title, textShadow: isDark ? "0 1px 6px rgba(0,0,0,0.5)" : "none" }}>{f.title}</div>
                    <div className="finlo-f-desc" style={{ fontSize: "12.5px", color: p.desc }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* FINANCIAL PREVIEW */}
            <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "flex-end", marginBottom: "24px" }}>
              <div style={{ position: "relative", width: "100%", maxWidth: "460px" }}>
                {/* Card glow */}
                <div style={{
                  position: "absolute", bottom: "-16px", left: "10px",
                  width: "400px", height: "70px",
                  background: "radial-gradient(ellipse, rgba(20,36,83,0.15) 0%, transparent 70%)",
                  filter: "blur(20px)", zIndex: 0,
                }} />

                {/* Main preview card */}
                <div style={{
                  background: p.panel,
                  border: isDark ? "1px solid rgba(10,25,61,0.3)" : "1px solid rgba(10,25,61,0.2)",
                  borderRadius: "22px",
                  padding: "20px",
                  boxShadow: isDark ? "0 6px 20px rgba(0,0,0,0.20)" : "0 6px 20px rgba(0,0,0,0.10)",
                  transform: "perspective(900px) rotateX(4deg) rotateY(-2deg)",
                  transformOrigin: "bottom center",
                  display: "flex",
                  gap: "14px",
                  position: "relative",
                  zIndex: 1,
                }}>
                  {/* Safe to Spend */}
                  <div style={{
                    flex: "1.1",
                    background: p.subPanel,
                    border: isDark ? "1px solid rgba(10,25,61,0.22)" : "1px solid rgba(10,25,61,0.14)",
                    borderRadius: "16px",
                    padding: "14px 16px",
                  }}>
                    <div style={{ fontSize: "10.5px", fontWeight: 600, color: isDark ? "#34d399" : "#059669", marginBottom: "6px", letterSpacing: "0.3px" }}>Safe to Spend</div>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: p.text, marginBottom: "4px" }}>Rs. 2,150</div>
                    <div style={{ fontSize: "10px", color: p.desc, lineHeight: 1.4, marginBottom: "12px" }}>Estimated amount you can spend today</div>
                    <div style={{ height: "4px", background: p.track, borderRadius: "4px", overflow: "hidden", marginBottom: "10px" }}>
                      <div style={{ height: "100%", width: "65%", background: "linear-gradient(90deg, #10b981, #34d399)", borderRadius: "4px" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#34d399" : "#059669"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <polyline points="9 12 11 14 15 10"/>
                      </svg>
                    </div>
                  </div>

                  {/* Money Runway */}
                  <div style={{
                    flex: 1,
                    background: p.subPanel,
                    border: isDark ? "1px solid rgba(10,25,61,0.22)" : "1px solid rgba(10,25,61,0.14)",
                    borderRadius: "16px",
                    padding: "14px 16px",
                  }}>
                    <div style={{ fontSize: "10.5px", fontWeight: 600, color: isDark ? "#0A193D" : "#0A193D", marginBottom: "6px", letterSpacing: "0.3px" }}>Money Runway</div>
                    <div style={{ fontSize: "26px", fontWeight: 700, color: p.text, marginBottom: "4px" }}>17 days</div>
                    <div style={{ fontSize: "10px", color: p.desc, lineHeight: 1.4, marginBottom: "8px" }}>Estimated days your money will last</div>
                    <svg width="100%" height="44" viewBox="0 0 120 44" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0A193D" stopOpacity="0.4"/>
                          <stop offset="100%" stopColor="#0A193D" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <polyline points="0,40 20,34 40,38 60,24 80,28 100,16 120,10"
                        fill="none" stroke="#0A193D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <polygon points="0,40 20,34 40,38 60,24 80,28 100,16 120,10 120,44 0,44"
                        fill="url(#sg)"/>
                    </svg>
                  </div>

                  {/* Rupee coin */}
                  <div style={{
                    position: "absolute", right: "-28px", bottom: "-18px",
                    width: "76px", height: "76px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #142453 0%, #0A193D 100%)",
                    border: "3px solid rgba(167,139,250,0.4)",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "32px", zIndex: 3, color: "#fff",
                  }}>₹</div>
                </div>
              </div>
            </div>

            {/* TRUST ROW */}
            <div style={{
              display: "flex", gap: "28px",
              paddingTop: "18px",
              borderTop: `1px solid ${p.lineSoft}`,
            }}>
              {[
                { icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, title: "Bank-level security", sub: "Your data is safe with us" },
                { icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: "Private & secure", sub: "We respect your privacy" },
                { icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, title: "Trusted by users", sub: "Join thousands of smart users" },
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                  <span style={{ color: p.iconMuted }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize: "11.5px", fontWeight: 600, color: p.title }}>{t.title}</div>
                    <div style={{ fontSize: "10.5px", color: p.descFaint }}>{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════ RIGHT PANEL ═══════════ */}
        <div className="finlo-right" style={{
          width: "50%", minHeight: "100vh",
          background: isDark ? p.bg : p.navBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "40px 60px",
          position: "relative",
        }}>
          {/* Subtle right panel glow */}
          <div style={{
            position: "absolute", top: "0", left: "0", right: "0", bottom: "0",
            background: `radial-gradient(ellipse at 60% 40%, ${p.radial} 0%, transparent 60%)`,
            pointerEvents: "none",
          }} />

          {/* SIGNUP CARD */}
          <div className="finlo-card" style={{
            width: "100%", maxWidth: "580px",
            background: p.cardBg,
            border: `1px solid ${p.line}`,
            borderRadius: "24px",
            padding: "44px 48px",
            boxShadow: isDark ? "0 6px 24px rgba(0,0,0,0.16)" : "0 6px 24px rgba(0,0,0,0.08)",
            position: "relative", zIndex: 1,
          }}>
            <h2 style={{ fontSize: "26px", fontWeight: 700, color: p.text, margin: "0 0 6px 0" }}>Create account 🚀</h2>
            <p style={{ fontSize: "14px", color: p.desc, margin: "0 0 32px 0" }}>Sign up to get started with Finlo</p>

            {/* EMAIL */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: p.label, marginBottom: "8px" }}>Email address</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: p.iconMuted, pointerEvents: "none" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                  style={{ width: "100%", padding: "14px 14px 14px 44px", background: p.inputBg, border: `1px solid ${p.line}`, borderRadius: "12px", fontSize: "14px", color: p.inputText, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "rgba(10,25,61,0.55)"}
                  onBlur={e => e.target.style.borderColor = p.line}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: p.label, marginBottom: "8px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: p.iconMuted, pointerEvents: "none" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                  style={{ width: "100%", padding: "14px 48px 14px 44px", background: p.inputBg, border: `1px solid ${p.line}`, borderRadius: "12px", fontSize: "14px", color: p.inputText, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "rgba(10,25,61,0.55)"}
                  onBlur={e => e.target.style.borderColor = p.line}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password"
                  style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: p.iconMuted, padding: "4px", display: "flex" }}>
                  {showPassword
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: p.label, marginBottom: "8px" }}>Confirm password</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: p.iconMuted, pointerEvents: "none" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter your password"
                  style={{ width: "100%", padding: "14px 48px 14px 44px", background: p.inputBg, border: `1px solid ${p.line}`, borderRadius: "12px", fontSize: "14px", color: p.inputText, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "rgba(10,25,61,0.55)"}
                  onBlur={e => e.target.style.borderColor = p.line}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label="Toggle confirm password"
                  style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: p.iconMuted, padding: "4px", display: "flex" }}>
                  {showConfirmPassword
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* TERMS AGREEMENT */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "9px", cursor: "pointer" }}>
                <div onClick={() => setAgreeTerms(!agreeTerms)} style={{ width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0, background: agreeTerms ? "#0A193D" : (isDark ? "rgba(10,25,61,0.12)" : "rgba(10,25,61,0.08)"), border: agreeTerms ? "none" : `1px solid ${p.line}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  {agreeTerms && <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9 10,3"/></svg>}
                </div>
                <span style={{ fontSize: "13px", color: p.label }}>
                  I agree to the <Link href="/terms" style={{ color: "#0A193D", textDecoration: "none" }}>Terms</Link> & <Link href="/privacy" style={{ color: "#0A193D", textDecoration: "none" }}>Privacy Policy</Link>
                </span>
              </label>
            </div>

            {/* SIGN UP BTN */}
            {error && (
              <div style={{
                marginBottom: "16px", padding: "12px 14px", borderRadius: "12px",
                background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)",
                color: isDark ? "#fca5a5" : "#b91c1c", fontSize: "13px", fontFamily: "inherit",
              }}>{error}</div>
            )}
            <button onClick={handleSignup} disabled={loading}
              style={{ width: "100%", padding: "15px", background: "linear-gradient(90deg, #142453 0%, #0A193D 100%)", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 600, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", boxShadow: "0 2px 10px rgba(10,25,61,0.22)", marginBottom: "24px", opacity: loading ? 0.6 : 1, transition: "transform 0.12s ease" }}
              onMouseOver={e => { if (!loading) { e.currentTarget.style.background = "linear-gradient(90deg, #142453 0%, #0A193D 100%)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseOut={e => { e.currentTarget.style.background = "linear-gradient(90deg, #142453 0%, #0A193D 100%)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {loading ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Create account
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/>
                  </svg>
                </>
              )}
            </button>

            {/* DIVIDER */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ flex: 1, height: "1px", background: p.lineDivider }} />
              <span style={{ fontSize: "13px", color: p.descFaint, whiteSpace: "nowrap" }}>or continue with</span>
              <div style={{ flex: 1, height: "1px", background: p.lineDivider }} />
            </div>

            {/* SOCIAL */}
            <div className="finlo-social" style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
              <button onClick={handleGoogle} style={{ flex: 1, padding: "12px 16px", background: p.inputBg, border: `1px solid ${p.line}`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontSize: "14px", color: p.label, cursor: "pointer", fontFamily: "inherit" }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(10,25,61,0.38)"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = p.line; }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              <button onClick={handleApple} style={{ flex: 1, padding: "12px 16px", background: p.inputBg, border: `1px solid ${p.line}`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontSize: "14px", color: p.label, cursor: "pointer", fontFamily: "inherit" }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(10,25,61,0.38)"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = p.line; }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={p.inputText}>
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Continue with Apple
              </button>
            </div>

            <div style={{ textAlign: "center", fontSize: "14px", color: p.descFaint }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#0A193D", textDecoration: "none", fontWeight: 500 }}>Log in</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}