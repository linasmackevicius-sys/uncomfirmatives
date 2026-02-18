interface Props {
  status: string
  color?: string
}

const defaultColors: Record<string, string> = {
  open: '#569cd6',
  in_progress: '#dcdcaa',
  resolved: '#4ec9b0',
  closed: '#6a6a6a',
}

export default function StatusBadge({ status, color }: Props) {
  const bg = color || defaultColors[status] || '#6a6a6a'
  return (
    <span
      className="badge"
      style={{ backgroundColor: `${bg}22`, color: bg, border: `1px solid ${bg}44` }}
    >
      {status.replace('_', ' ')}
    </span>
  )
}
