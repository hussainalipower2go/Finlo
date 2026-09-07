import { FinloLogoImg } from '@/components/branding/FinloLogoImg'

export function FinloLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <FinloLogoImg size={38} radius={10} />
      <div>
        <div className="text-[17px] font-bold leading-[1.1] text-white">Finlo</div>
        <div className="mt-1 text-[11px] text-[#a78bfa]/70">Plan. Spend. Stay Ahead.</div>
      </div>
    </div>
  )
}