import { Fragment } from "react";
import { UserRound, PencilLine, Sparkles, ArrowRight } from "lucide-react";
import { BRAND, FONTS, GLASS, SECTION_IDS } from "./lp-tokens";
import { SectionHeading, SectionKicker } from "./lp-ui";

const STEPS = [
  {
    number: "01",
    icon: UserRound,
    title: "Create Account",
    desc: "Sign up in seconds with your email — or use Google or Apple to get started instantly.",
  },
  {
    number: "02",
    icon: PencilLine,
    title: "Add Your Finances",
    desc: "Record income and expenses in a tap, or let the quick-entry understand what you type.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Understand Your Money",
    desc: "See your balance, upcoming bills, and insights in one clear dashboard.",
  },
];

function Arrow({ hidden = false }: { hidden?: boolean }) {
  if (hidden) return null;
  return (
    <div
      className="landing-step-arrow"
      aria-hidden="true"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.6)",
          border: "1px solid rgba(255,255,255,0.9)",
          boxShadow: "0 8px 24px rgba(10,25,61,0.10), inset 0 1px 0 rgba(255,255,255,0.95)",
          color: BRAND.accentBlueDeep,
        }}
      >
        <ArrowRight size={18} strokeWidth={2.5} />
      </span>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section
      id={SECTION_IDS.howItWorks}
      style={{
        padding: "clamp(64px, 9vh, 100px) 0",
        scrollMarginTop: 72,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 40px)" }}>
        <SectionKicker>How It Works</SectionKicker>
        <SectionHeading
          title="Up and running in"
          accent="three simple steps"
          description="No spreadsheets, no setup headaches. Just a clearer view of your money."
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            marginTop: 48,
          }}
          className="landing-steps-row"
        >
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Fragment key={s.number}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      position: "relative",
                      height: "100%",
                      borderRadius: 22,
                      padding: "32px 28px",
                      background: GLASS.bgStrong,
                      border: "1px solid rgba(255,255,255,0.75)",
                      backdropFilter: GLASS.blurSoft,
                      WebkitBackdropFilter: GLASS.blurSoft,
                      boxShadow: "0 1px 2px rgba(10,25,61,0.04), 0 14px 36px rgba(10,25,61,0.09), inset 0 1px 0 rgba(255,255,255,0.9)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 16,
                          background: GLASS.chipBg,
                          border: "1px solid rgba(255,255,255,0.8)",
                          boxShadow: GLASS.inset,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: BRAND.accentBlueDeep,
                        }}
                      >
                        <Icon size={24} strokeWidth={2} />
                      </div>
                      <span
                        style={{
                          fontSize: 40,
                          fontWeight: 800,
                          fontFamily: FONTS.heading,
                          color: "rgba(10,25,61,0.10)",
                          lineHeight: 1,
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {s.number}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontFamily: FONTS.heading,
                        fontWeight: 600,
                        fontSize: 19,
                        color: BRAND.text,
                        margin: 0,
                      }}
                    >
                      {s.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.65,
                        color: BRAND.textMuted,
                        margin: "10px 0 0",
                      }}
                    >
                      {s.desc}
                    </p>
                  </div>
                </div>
                <Arrow hidden={i === STEPS.length - 1} />
              </Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}