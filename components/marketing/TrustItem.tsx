import { type ReactNode } from 'react'

interface TrustItemProps {
  icon: ReactNode
  title: string
  description: string
}

export function TrustItem({ icon, title, description }: TrustItemProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[#9482c8]/45">{icon}</span>
      <div>
        <div className="text-[11.5px] font-semibold text-[#d2c8ff]/70">{title}</div>
        <div className="text-[10.5px] text-[#8278b4]/48">{description}</div>
      </div>
    </div>
  )
}
