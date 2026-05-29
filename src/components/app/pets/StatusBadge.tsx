type Visibility = 'public' | 'private' | 'unlisted'

const STYLES: Record<Visibility, { bg: string; color: string; dot: string; label: string }> = {
  public: {
    bg: '#3CB07A22',
    color: '#1F6A47',
    dot: '#3CB07A',
    label: 'public',
  },
  unlisted: {
    bg: '#F2A02E22',
    color: '#7A4A0F',
    dot: '#F2A02E',
    label: 'unlisted',
  },
  private: {
    bg: '#14100E14',
    color: '#14100E',
    dot: '#14100E66',
    label: 'draft',
  },
}

export function StatusBadge({ visibility }: { visibility: Visibility }) {
  const styles = STYLES[visibility]

  return (
    <span
      className="status-badge"
      style={{
        background: styles.bg,
        color: styles.color,
      }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: styles.dot }} />
      {styles.label}
    </span>
  )
}
