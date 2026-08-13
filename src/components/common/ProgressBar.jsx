export default function ProgressBar({ value = 0, label, showValue = true, variant = 'default', size = 'md' }) {
  const clamp = Math.min(Math.max(Math.round(value), 0), 100)
  const colorClass = clamp >= 75 ? 'green' : clamp >= 40 ? '' : clamp >= 20 ? 'amber' : 'red'
  const height = size === 'sm' ? 5 : size === 'lg' ? 12 : 8

  return (
    <div className="progress-bar-wrapper">
      {(label || showValue) && (
        <div className="progress-bar-header">
          {label && <span className="progress-bar-label">{label}</span>}
          {showValue && <span className="progress-bar-value">{clamp}%</span>}
        </div>
      )}
      <div className="progress-bar-track" style={{ height }}>
        <div
          className={`progress-bar-fill ${colorClass}`}
          style={{ width: `${clamp}%` }}
        />
      </div>
    </div>
  )
}
