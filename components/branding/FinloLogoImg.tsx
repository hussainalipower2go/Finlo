import Image from "next/image";

export function FinloLogoImg({ size = 38, radius = 10 }: { size?: number; radius?: number }) {
  return (
    <Image
      src="/finlo-brand-mark.svg"
      alt="Finlo"
      width={size}
      height={size}
      style={{ borderRadius: radius, objectFit: "cover", flexShrink: 0 }}
    />
  )
}