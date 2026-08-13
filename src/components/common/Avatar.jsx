import { getInitials, getAvatarGradient } from '../../utils/helpers'

export default function Avatar({ name, size = 'md', style = {} }) {
  const initials = getInitials(name)
  const [from, to] = getAvatarGradient(name)
  return (
    <div
      className={`avatar avatar-${size}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})`, ...style }}
      title={name}
    >
      {initials}
    </div>
  )
}

export function AvatarGroup({ names = [], max = 4, size = 'sm' }) {
  const visible = names.slice(0, max)
  const extra = names.length - max
  return (
    <div className="avatar-group">
      {visible.map((name, i) => (
        <Avatar key={i} name={name} size={size} />
      ))}
      {extra > 0 && (
        <div
          className={`avatar avatar-${size}`}
          style={{ background: 'var(--neutral-400)', fontSize: size === 'xs' ? 8 : 10 }}
        >
          +{extra}
        </div>
      )}
    </div>
  )
}
