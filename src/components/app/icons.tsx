import type { CSSProperties, PropsWithChildren } from 'react'

type IconProps = {
  size?: number
  color?: string
  stroke?: number
  fill?: string
  style?: CSSProperties
}

function Icon({
  children,
  size = 24,
  color = 'currentColor',
  stroke = 1.75,
  fill = 'none',
  style = {},
}: PropsWithChildren<IconProps>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </svg>
  )
}

export function IconCamera(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8h2.5l1.5-2h8l1.5 2H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </Icon>
  )
}

export function IconHeart(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20s-7-4.3-7-9.5C5 8 7 6 9.5 6c1.5 0 2.5 1 2.5 1s1-1 2.5-1C17 6 19 8 19 10.5c0 5.2-7 9.5-7 9.5z" />
    </Icon>
  )
}

export function IconComment(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-4 3v-3H6a2 2 0 0 1-2-2V6z" />
    </Icon>
  )
}

export function IconArrowRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </Icon>
  )
}

export function IconSparkle(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3l1.8 4.8L18.6 9l-4.8 1.8L12 15.6l-1.8-4.8L5.4 9l4.8-1.2L12 3z" />
      <path d="M19 16l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8L19 16z" />
    </Icon>
  )
}

export function LogoPaw({ size = 26, fg = '#fff', style = {} }: { size?: number; fg?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fg} style={{ display: 'block', ...style }}>
      <circle cx="8" cy="9" r="2.5" />
      <circle cx="16" cy="9" r="2.5" />
      <circle cx="5" cy="14" r="2" />
      <circle cx="19" cy="14" r="2" />
      <ellipse cx="12" cy="17.5" rx="4.5" ry="3.5" />
    </svg>
  )
}
