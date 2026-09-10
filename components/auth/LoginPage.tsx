"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { createClient } from "@/lib/supabase";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    const check = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (active && data.session) {
        router.replace("/dashboard");
        router.refresh();
      }
    };
    check();
    return () => { active = false; };
  }, [router]);

  const p = {
    line: "rgba(10,25,61,0.22)",
    lineDivider: "rgba(10,25,61,0.16)",
    text: "#0f172a",
    desc: "rgba(100,116,139,0.85)",
    descFaint: "rgba(100,116,139,0.75)",
    label: "rgba(51,65,85,0.9)",
    iconMuted: "rgba(100,116,139,0.6)",
    inputBg: "rgba(255,255,255,0.95)",
    inputText: "rgba(15,23,42,0.92)",
  };

  async function handleLogin() {
    if (loading) return;
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      toast({ type: "error", message: loginError.message });
      return;
    }

    toast({ type: "success", message: "Welcome back to Finlo." });
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogle() {
    if (oauthLoading) return;
    setOauthLoading("google");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setOauthLoading(null);
      setError(error.message);
      toast({ type: "error", message: error.message });
    }
  }

  async function handleApple() {
    if (oauthLoading) return;
    setOauthLoading("apple");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setOauthLoading(null);
      setError(error.message);
      toast({ type: "error", message: error.message });
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      backgroundImage: "url('/login-bg.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      display: "flex",
      fontFamily: "var(--font-manrope), 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* ═══════════ LEFT PANEL — Branding / Text ═══════════ */}
      <div className="finlo-left" style={{
        width: "50%",
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "clamp(28px, 5vw, 60px) clamp(24px, 5vw, 56px)",
        overflow: "hidden",
      }}>
        <div style={{ position: "relative", zIndex: 1, width: "80%", maxWidth: "620px", left: "20%" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "clamp(28px, 6vh, 48px)" }}>
            <Image
              src="/finlo-brand-mark.png"
              alt="Finlo"
              width={44}
              height={44}
              style={{
                width: "clamp(34px, 3vw, 44px)",
                height: "clamp(34px, 3vw, 44px)",
                borderRadius: "clamp(8px, 0.8vw, 10px)",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 700, color: "#0B1838", lineHeight: 1, letterSpacing: "-0.5px" }}>Finlo</div>
              <div style={{ fontSize: "clamp(8px, 0.9vw, 10px)", fontWeight: 600, color: "#7A89A8", marginTop: "4px", letterSpacing: "0.4px" }}>Plan. Spend. Stay Ahead.</div>
            </div>
          </div>

          {/* Hero heading */}
          <h1 style={{
            fontFamily: "var(--font-manrope), 'Manrope', sans-serif",
            fontSize: "clamp(38px, 5.8vw, 72px)", fontWeight: 600, lineHeight: 1.1,
            color: "#0B1838", letterSpacing: "-2px", margin: "0 0 clamp(16px, 2.5vh, 24px) 0",
          }}>
            Clarity today.<br />
            <span style={{
              background: "linear-gradient(90deg, #7890FF, #526DDF)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>A brighter tomorrow.</span>
          </h1>

          <p style={{
            fontSize: "clamp(16px, 1.4vw, 18px)", fontWeight: 400, color: "#61708F", lineHeight: 1.6,
            margin: "0 0 clamp(28px, 5vh, 40px) 0", maxWidth: "400px",
          }}>
            Finlo helps you understand your cash flow,<br />
            plan ahead, and spend with confidence.
          </p>

          {/* Features */}
          <div className="finlo-features">
            {[
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A193D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    <circle cx="12" cy="16" r="1.5"/>
                  </svg>
                ),
                title: "Know your runway",
                desc: "See how many days your money will last.",
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                ),
                title: "Spend with confidence",
                desc: "Know how much you can safely spend today.",
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                ),
                title: "Stay on track",
                desc: "Track upcoming bills, income, and goals.",
              },
            ].map((f, i) => (
              <div key={i} className="finlo-feature">
                <div className="finlo-f-icon" style={{
                  width: "clamp(34px, 3.5vw, 42px)", height: "clamp(34px, 3.5vw, 42px)", borderRadius: "12px",
                  background: "rgba(255,255,255,0.35)",
                  border: "1px solid rgba(255,255,255,0.75)",
                  backdropFilter: "blur(14px) saturate(160%)",
                  WebkitBackdropFilter: "blur(14px) saturate(160%)",
                  boxShadow: "0 6px 18px rgba(10,25,61,0.12), inset 0 1px 0 rgba(255,255,255,0.85)",
                }}>
                  {f.icon}
                </div>
                <div className="finlo-f-text">
                  <div className="finlo-f-title" style={{ fontSize: "clamp(13px, 1.15vw, 15px)", color: "#17264A" }}>{f.title}</div>
                  <div className="finlo-f-desc" style={{ fontSize: "clamp(12px, 1.1vw, 13px)", color: "#71809F" }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ RIGHT PANEL — Login Form ═══════════ */}
      <div className="finlo-right" style={{
        width: "50%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(24px, 4vw, 48px) clamp(20px, 5vw, 48px)",
        position: "relative",
      }}>
        <div className="finlo-card" style={{
          width: "100%",
          maxWidth: "480px",
          background: "rgba(255,255,255,0.38)",
          border: "1px solid rgba(255,255,255,0.75)",
          borderRadius: "28px",
          padding: "clamp(28px, 4vw, 44px)",
          boxShadow: "0 24px 60px rgba(10,25,61,0.20), inset 0 1px 0 rgba(255,255,255,0.85)",
          backdropFilter: "blur(22px) saturate(180%)",
          WebkitBackdropFilter: "blur(22px) saturate(180%)",
          position: "relative",
          zIndex: 1,
        }}>
          <h2 style={{ fontSize: "26px", fontWeight: 700, color: p.text, margin: "0 0 6px 0" }}>Welcome back 👋</h2>
          <p style={{ fontSize: "14px", color: p.desc, margin: "0 0 32px 0" }}>Login to continue to your account</p>

          {/* EMAIL */}
          <form onSubmit={e => { e.preventDefault(); handleLogin(); }} noValidate>
          <div style={{ marginBottom: "20px" }}>
            <label htmlFor="login-email" style={{ display: "block", fontSize: "13px", fontWeight: 500, color: p.label, marginBottom: "8px" }}>Email address</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: p.iconMuted, pointerEvents: "none" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input id="login-email" type="email" value={email} autoComplete="email"
                onChange={e => { setEmail(e.target.value); if (error) setError(""); }} placeholder="you@example.com"
                style={{ width: "100%", padding: "14px 14px 14px 44px", background: p.inputBg, border: `1px solid ${p.line}`, borderRadius: "12px", fontSize: "14px", color: p.inputText, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "rgba(10,25,61,0.55)"}
                onBlur={e => e.target.style.borderColor = p.line}
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div style={{ marginBottom: "12px" }}>
            <label htmlFor="login-password" style={{ display: "block", fontSize: "13px", fontWeight: 500, color: p.label, marginBottom: "8px" }}>Password</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: p.iconMuted, pointerEvents: "none" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input id="login-password" type={showPassword ? "text" : "password"} value={password} autoComplete="current-password"
                onChange={e => { setPassword(e.target.value); if (error) setError(""); }} placeholder="Enter your password"
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

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <span />
            <Link href="/auth/forgot-password" style={{ fontSize: "13px", color: "#0A193D", textDecoration: "none" }}>Forgot password?</Link>
          </div>

          {/* LOGIN BTN */}
          {error && (
            <div style={{
              marginBottom: "16px", padding: "12px 14px", borderRadius: "12px",
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)",
              color: "#b91c1c", fontSize: "13px", fontFamily: "inherit",
            }}>{error}</div>
          )}
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "15px", background: "linear-gradient(90deg, #142453 0%, #0A193D 100%)", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: 600, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", boxShadow: "0 2px 10px rgba(10,25,61,0.22)", marginBottom: "24px", opacity: loading ? 0.6 : 1, transition: "transform 0.12s ease" }}
            onMouseOver={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; } }}
            onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {loading ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Log in
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/>
                </svg>
              </>
            )}
          </button>
          </form>

          {/* DIVIDER */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ flex: 1, height: "1px", background: p.lineDivider }} />
            <span style={{ fontSize: "13px", color: p.descFaint, whiteSpace: "nowrap" }}>or continue with</span>
            <div style={{ flex: 1, height: "1px", background: p.lineDivider }} />
          </div>

          {/* SOCIAL */}
          <div className="finlo-social" style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
            <button onClick={handleGoogle} disabled={oauthLoading !== null}
              style={{ flex: 1, padding: "12px 16px", background: p.inputBg, border: `1px solid ${p.line}`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontSize: "14px", color: p.label, cursor: oauthLoading !== null ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: oauthLoading !== null ? 0.6 : 1 }}
              onMouseOver={e => { if (!oauthLoading) { e.currentTarget.style.borderColor = "rgba(10,25,61,0.38)"; } }}
              onMouseOut={e => { e.currentTarget.style.borderColor = p.line; }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button onClick={handleApple} disabled={oauthLoading !== null}
              style={{ flex: 1, padding: "12px 16px", background: p.inputBg, border: `1px solid ${p.line}`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontSize: "14px", color: p.label, cursor: oauthLoading !== null ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: oauthLoading !== null ? 0.6 : 1 }}
              onMouseOver={e => { if (!oauthLoading) { e.currentTarget.style.borderColor = "rgba(10,25,61,0.38)"; } }}
              onMouseOut={e => { e.currentTarget.style.borderColor = p.line; }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={p.inputText}>
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Apple
            </button>
          </div>

          <div style={{ textAlign: "center", fontSize: "14px", color: p.desc }}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" style={{ color: "#0A193D", textDecoration: "none", fontWeight: 500 }}>Sign up</Link>
          </div>
        </div>
      </div>

    </div>
  );
}
