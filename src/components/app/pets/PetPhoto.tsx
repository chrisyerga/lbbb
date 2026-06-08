import { LogoPaw } from '../icons'

const ACCENTS = ['#E0382E', '#F2A02E', '#3CB07A', '#7E5BFF'] as const

function accentForName(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return ACCENTS[Math.abs(hash) % ACCENTS.length]
}

type PetPhotoProps = {
  name: string
  imageUrl?: string | null
  size?: number
  accentColor?: string | null
}

export function PetPhoto({ name, imageUrl, size = 132, accentColor }: PetPhotoProps) {
  const accent = accentColor ?? accentForName(name)

  if (imageUrl) {
    return (
      <div className="pet-photo shrink-0 overflow-hidden bg-white" style={{ width: size, height: size }}>
        <img src={imageUrl} alt={`${name} profile`} className="h-full w-full object-cover object-center" />
      </div>
    )
  }

  return (
    <div
      className="pet-photo relative shrink-0 overflow-hidden"
      style={{ width: size, height: size, background: accent }}
    >
      <span
        className="font-display absolute inset-0 flex items-center justify-center font-extrabold text-white"
        style={{ fontSize: size * 0.55, lineHeight: 1, letterSpacing: '-0.04em' }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
      <LogoPaw
        size={size * 0.45}
        fg="rgba(255,255,255,.18)"
        style={{ position: 'absolute', right: -6, bottom: -6, transform: 'rotate(15deg)' }}
      />
    </div>
  )
}
