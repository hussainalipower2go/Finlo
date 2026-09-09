import { type ReactNode } from 'react'

interface TrustItemProps {
  icon: ReactNode
  title: string
  description: string
}

export function TrustItem({ icon, title, description }: TrustItemProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[#0A193D]/45">{icon}</span>
      <div>
        <div className="text-[11.5px] font-semibold text-[#E9EDFB]/70">{title}</div>
        <div className="text-[10.5px] text-[#0A193D]/48">{description}</div>
      </div>
    </div>
  )
}
