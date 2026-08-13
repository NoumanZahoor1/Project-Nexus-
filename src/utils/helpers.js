import { format, formatDistanceToNow, isPast, isWithinInterval, addDays } from 'date-fns'

// ===== DATE HELPERS =====
export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  try { return format(new Date(dateStr), 'MMM dd, yyyy') } catch { return dateStr }
}

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  try { return format(new Date(dateStr), 'MMM dd, yyyy · h:mm a') } catch { return dateStr }
}

export const formatRelative = (dateStr) => {
  if (!dateStr) return '—'
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }) } catch { return dateStr }
}

export const isOverdue = (dueDate) => {
  if (!dueDate) return false
  return isPast(new Date(dueDate))
}

export const isDueSoon = (dueDate, days = 7) => {
  if (!dueDate) return false
  const d = new Date(dueDate)
  return isWithinInterval(d, { start: new Date(), end: addDays(new Date(), days) })
}

// ===== PROJECT HELPERS =====
export const getPriorityConfig = (priority) => {
  const map = {
    critical: { label: 'Critical', className: 'badge-danger', dotColor: '#ef4444' },
    high:     { label: 'High',     className: 'badge-warning', dotColor: '#f59e0b' },
    medium:   { label: 'Medium',   className: 'badge-info', dotColor: '#3b82f6' },
    low:      { label: 'Low',      className: 'badge-neutral', dotColor: '#94a3b8' },
  }
  return map[priority] || map.low
}

export const getStatusConfig = (status) => {
  const map = {
    active:    { label: 'Active',    className: 'badge-success', dotColor: '#22c55e' },
    planning:  { label: 'Planning',  className: 'badge-info', dotColor: '#3b82f6' },
    'on-hold': { label: 'On Hold',  className: 'badge-warning', dotColor: '#f59e0b' },
    completed: { label: 'Completed', className: 'badge-neutral', dotColor: '#94a3b8' },
    cancelled: { label: 'Cancelled', className: 'badge-danger', dotColor: '#ef4444' },
  }
  return map[status] || map.planning
}

export const getTaskStatusConfig = (status) => {
  const map = {
    'todo':        { label: 'To Do',       className: 'badge-neutral', color: '#64748b', bg: '#f1f5f9' },
    'in-progress': { label: 'In Progress', className: 'badge-info',    color: '#3b82f6', bg: '#eff6ff' },
    'review':      { label: 'In Review',   className: 'badge-warning', color: '#f59e0b', bg: '#fffbeb' },
    'completed':   { label: 'Completed',   className: 'badge-success', color: '#22c55e', bg: '#f0fdf4' },
  }
  return map[status] || map.todo
}

export const getRoleConfig = (role) => {
  const map = {
    admin:   { label: 'Administrator', className: 'badge-danger' },
    manager: { label: 'Project Manager', className: 'badge-violet' },
    member:  { label: 'Team Member',   className: 'badge-primary' },
  }
  return map[role] || map.member
}

// ===== PROJECT PROGRESS =====
export const calcProjectProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0
  const completed = tasks.filter(t => t.status === 'completed').length
  return Math.round((completed / tasks.length) * 100)
}

// ===== USER INITIALS =====
export const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ===== AVATAR GRADIENT (deterministic from name) =====
const gradients = [
  ['#4f46e5', '#7c3aed'],
  ['#0891b2', '#2563eb'],
  ['#059669', '#10b981'],
  ['#d97706', '#f59e0b'],
  ['#dc2626', '#ef4444'],
  ['#7c3aed', '#a855f7'],
  ['#0284c7', '#38bdf8'],
  ['#16a34a', '#4ade80'],
]
export const getAvatarGradient = (name) => {
  if (!name) return gradients[0]
  const idx = name.charCodeAt(0) % gradients.length
  return gradients[idx]
}

// ===== SORT HELPERS =====
export const sortBy = (arr, field, dir = 'asc') => {
  return [...arr].sort((a, b) => {
    const va = a[field] ?? ''
    const vb = b[field] ?? ''
    const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true })
    return dir === 'asc' ? cmp : -cmp
  })
}

// ===== STATS =====
export const getTaskStats = (tasks) => ({
  total: tasks.length,
  todo: tasks.filter(t => t.status === 'todo').length,
  inProgress: tasks.filter(t => t.status === 'in-progress').length,
  review: tasks.filter(t => t.status === 'review').length,
  completed: tasks.filter(t => t.status === 'completed').length,
})

export const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
