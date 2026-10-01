import { FolderKanban, ClipboardList, Users, Bell, Search as SearchIcon } from 'lucide-react'

/**
 * Enhanced Empty State — Shows a rich visual placeholder when no data is available.
 * Includes icon, title, description, and optional action button.
 */
export default function EmptyState({
  icon: Icon,
  type = 'default',
  title = 'Nothing here yet',
  description = 'Content will appear here once available.',
  actionLabel,
  onAction,
}) {
  const typeConfig = {
    projects: { icon: FolderKanban, title: 'No projects found', description: 'Create your first project to get started.' },
    tasks: { icon: ClipboardList, title: 'No tasks yet', description: 'Tasks will appear here once created.' },
    users: { icon: Users, title: 'No users found', description: 'Invite team members to get started.' },
    notifications: { icon: Bell, title: 'All caught up!', description: 'You have no notifications right now.' },
    search: { icon: SearchIcon, title: 'No results found', description: 'Try a different search term or filter.' },
  }

  const config = typeConfig[type] || {}
  const ResolvedIcon = Icon || config.icon || FolderKanban
  const resolvedTitle = title !== 'Nothing here yet' ? title : (config.title || title)
  const resolvedDesc = description !== 'Content will appear here once available.' ? description : (config.description || description)

  return (
    <div className="empty-state-enhanced">
      <div className="empty-state-icon-wrap">
        <div className="empty-state-icon-bg" />
        <ResolvedIcon size={32} className="empty-state-icon-svg" />
      </div>
      <h3 className="empty-state-title">{resolvedTitle}</h3>
      <p className="empty-state-desc">{resolvedDesc}</p>
      {actionLabel && onAction && (
        <button className="btn btn-primary btn-sm" onClick={onAction} style={{ marginTop: 12 }}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
