import { type LucideIcon } from 'lucide-react'

interface FeatureItemProps {
  icon: LucideIcon
  iconColor: string
  bg: string
  border: string
  glow: string
  title: string
  description: string
}

export function FeatureItem({ icon: Icon, iconColor, bg, border, glow, title, description }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-3.5">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl backdrop-blur-[8px]"
        style={{ background: bg, border: `1px solid ${border}`, boxShadow: `0 0 18px ${glow}` }}
      >
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <div className="mb-[3px] text-sm font-semibold text-[#E9EDFB]" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
          {title}
        </div>
        <div className="text-[12.5px] leading-[1.5] text-[#0A193D]/65">{description}</div>
      </div>
    </div>
  )
}
