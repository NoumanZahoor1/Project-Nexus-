/**
 * Sparkline — A tiny inline bar chart for stat cards.
 * Renders a mini visualization of recent data points.
 */
export default function Sparkline({ data = [], color = 'var(--primary-500)', height = 32, width = 80 }) {
  if (!data.length) return null

  const max = Math.max(...data, 1)
  const barWidth = Math.max(2, (width / data.length) - 2)

  return (
    <div className="sparkline" style={{ width, height, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
      {data.map((value, i) => {
        const barHeight = Math.max(2, (value / max) * height)
        const opacity = 0.3 + (0.7 * (i / (data.length - 1 || 1)))
        return (
          <div
            key={i}
            className="sparkline-bar"
            style={{
              width: barWidth,
              height: barHeight,
              backgroundColor: color,
              opacity,
              borderRadius: 2,
              transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        )
      })}
    </div>
  )
}
