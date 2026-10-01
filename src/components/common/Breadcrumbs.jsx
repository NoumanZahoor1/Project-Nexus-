import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const LABEL_MAP = {
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
  dashboard: 'Dashboard',
  projects: 'Projects',
  tasks: 'Tasks',
  users: 'Users',
  notifications: 'Notifications',
  profile: 'Profile',
  workspace: 'Workspace',
}

/**
 * Breadcrumbs — Shows navigation path with clickable links.
 * Automatically parses current URL path.
 */
export default function Breadcrumbs() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(Boolean)

  if (pathnames.length <= 1) return null

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        <li className="breadcrumb-item">
          <Link to="/" className="breadcrumb-link breadcrumb-home">
            <Home size={14} />
          </Link>
        </li>
        {pathnames.map((segment, index) => {
          const path = `/${pathnames.slice(0, index + 1).join('/')}`
          const isLast = index === pathnames.length - 1
          const label = LABEL_MAP[segment] || decodeURIComponent(segment)

          // Skip ID segments in display
          if (segment.match(/^[a-zA-Z0-9_-]{10,}$/) && !LABEL_MAP[segment]) {
            return (
              <li key={path} className="breadcrumb-item">
                <ChevronRight size={12} className="breadcrumb-separator" />
                <span className="breadcrumb-current">Details</span>
              </li>
            )
          }

          return (
            <li key={path} className="breadcrumb-item">
              <ChevronRight size={12} className="breadcrumb-separator" />
              {isLast ? (
                <span className="breadcrumb-current">{label}</span>
              ) : (
                <Link to={path} className="breadcrumb-link">{label}</Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
