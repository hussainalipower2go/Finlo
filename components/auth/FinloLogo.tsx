import { FinloLogoImg } from '@/components/branding/FinloLogoImg'

export function FinloLogo() {
  return (
    <div className="finlo-logo">
      <FinloLogoImg size={34} radius={10} />
      <span className="text">Finlo</span>
    </div>
  )
}