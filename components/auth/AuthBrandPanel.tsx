import { BarChart3, CalendarDays, ShieldCheck } from 'lucide-react'
import { FinloLogo } from '@/components/branding/FinloLogo'
import { FeatureItem } from '@/components/marketing/FeatureItem'
import { FinancialPreview } from '@/components/marketing/FinancialPreview'
import { TrustItem } from '@/components/marketing/TrustItem'

const features = [
  {
    icon: CalendarDays,
    iconColor: 'text-[#a78bfa]',
    bg: 'rgba(109,40,217,0.18)',
    border: 'rgba(109,40,217,0.35)',
    glow: 'rgba(109,40,217,0.2)',
    title: 'Know your runway',
    description: 'See how many days your money will last.',
  },
  {
    icon: ShieldCheck,
    iconColor: 'text-[#34d399]',
    bg: 'rgba(16,185,129,0.14)',
    border: 'rgba(16,185,129,0.3)',
    glow: 'rgba(16,185,129,0.15)',
    title: 'Spend with confidence',
    description: 'Know how much you can safely spend today.',
  },
  {
    icon: BarChart3,
    iconColor: 'text-[#60a5fa]',
    bg: 'rgba(59,130,246,0.14)',
    border: 'rgba(59,130,246,0.3)',
    glow: 'rgba(59,130,246,0.15)',
    title: 'Stay on track',
    description: 'Track upcoming bills, income, and goals.',
  },
]

const trustItems = [
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: 'Bank-level security',
    description: 'Your data is safe with us',
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Private & secure',
    description: 'We respect your privacy',
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Trusted by users',
    description: 'Join thousands of smart users',
  },
]

export function AuthBrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden border-r border-[rgba(109,40,217,0.15)] lg:flex lg:flex-col">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/mountain.png')",
          backgroundSize: 'cover',
          backgroundPosition: '40% center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(180deg, rgba(8,11,26,0.72) 0%, rgba(8,11,26,0.45) 35%, rgba(8,11,26,0.55) 60%, rgba(8,11,26,0.9) 100%)',
        }}
      />

      <div
        className="pointer-events-none absolute z-[1]"
        style={{
          bottom: '50px',
          left: '30px',
          width: '400px',
          height: '130px',
          background: 'radial-gradient(ellipse, rgba(109,40,217,0.45) 0%, transparent 70%)',
          filter: 'blur(28px)',
        }}
      />

      <div className="relative z-[2] flex flex-1 flex-col" style={{ padding: '40px 52px 36px 52px' }}>
        <div className="mb-12">
          <FinloLogo />
        </div>

        <h1 className="mb-[18px] text-[clamp(40px,4vw,62px)] font-extrabold leading-[1.05] tracking-[-1.5px] text-white" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
          Plan today.<br />
          Live <span className="bg-gradient-to-r from-[#7c3aed] to-[#818cf8] bg-clip-text text-transparent">tomorrow.</span>
        </h1>
        <p className="mb-9 max-w-[390px] text-[15px] leading-[1.65] text-[#d2c8ff]/75" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
          Finlo helps you understand your cash flow,<br />
          plan ahead, and spend with confidence.
        </p>

        <div className="mb-9 flex flex-col gap-5">
          {features.map((f) => (
            <FeatureItem key={f.title} {...f} />
          ))}
        </div>

        <div className="mb-14 mt-auto flex items-end">
          <FinancialPreview />
        </div>

        <div className="flex flex-wrap gap-7 border-t border-[rgba(109,40,217,0.15)] pt-[26px]">
          {trustItems.map((t) => (
            <TrustItem key={t.title} {...t} />
          ))}
        </div>
      </div>
    </aside>
  )
}
