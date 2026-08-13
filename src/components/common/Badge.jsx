import { getPriorityConfig, getStatusConfig, getTaskStatusConfig, getRoleConfig } from '../../utils/helpers'

export function Badge({ type, value, className = '' }) {
  let config
  if (type === 'priority') config = getPriorityConfig(value)
  else if (type === 'status') config = getStatusConfig(value)
  else if (type === 'taskStatus') config = getTaskStatusConfig(value)
  else if (type === 'role') config = getRoleConfig(value)
  else config = { label: value, className: 'badge-neutral' }

  return (
    <span className={`badge ${config.className} ${className}`}>
      {config.dotColor && <span className="badge-dot" style={{ background: config.dotColor }} />}
      {config.label}
    </span>
  )
}

export function CustomBadge({ children, variant = 'neutral', className = '' }) {
  return <span className={`badge badge-${variant} ${className}`}>{children}</span>
}

export default Badge

