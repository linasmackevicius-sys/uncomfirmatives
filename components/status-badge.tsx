interface Props {
  status: string
  color?: string
}

const defaultColors: Record<string, string> = {
  open: '#3b82f6',
  in_progress: '#f59e0b',
  resolved: '#22c55e',
  closed: '#71717a',
}

export default function StatusBadge({ status, color }: Props) {
  const bg = color || defaultColors[status] || '#71717a'
  return (
    <span
      className="badge"
      style={{ backgroundColor: `${bg}22`, color: bg, border: `1px solid ${bg}44` }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}
