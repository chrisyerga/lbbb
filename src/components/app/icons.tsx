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

export function IconPlus(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  )
}

export function IconPencil(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
      <path d="M14 7l3 3" />
    </Icon>
  )
}

export function IconRss(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 5c7.7 0 14 6.3 14 14" />
      <path d="M5 11c4.4 0 8 3.6 8 8" />
      <circle cx="6.5" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function IconPalette(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4a8 8 0 0 0 0 16h1.2a1.8 1.8 0 0 0 1.3-3.1l-.4-.4a1.3 1.3 0 0 1 .9-2.2h1.2A3.8 3.8 0 0 0 20 10.5C20 6.9 16.4 4 12 4z" />
      <circle cx="8.5" cy="10" r=".8" fill="currentColor" stroke="none" />
      <circle cx="11.5" cy="8" r=".8" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="10" r=".8" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12.5l4.2 4.2L19 7" />
    </Icon>
  )
}

export function IconArrowUp(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 19V5M5 12l7-7 7 7" />
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
