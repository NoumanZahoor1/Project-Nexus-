import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, ClipboardList, Users,
  Bell, User, LogOut, Settings, ChevronRight, Activity
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'

const adminNav = [
  { section: 'Overview', items: [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/projects', icon: FolderKanban, label: 'All Projects' },
    { to: '/admin/users', icon: Users, label: 'Manage Users' },
  ]},
  { section: 'System', items: [
    { to: '/admin/notifications', icon: Bell, label: 'Notifications', badge: true },
    { to: '/admin/profile', icon: User, label: 'My Profile' },
  ]},
]

const managerNav = [
  { section: 'Workspace', items: [
    { to: '/manager/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/manager/projects', icon: FolderKanban, label: 'My Projects' },
    { to: '/manager/tasks', icon: ClipboardList, label: 'All Tasks' },
  ]},
  { section: 'Account', items: [
    { to: '/manager/notifications', icon: Bell, label: 'Notifications', badge: true },
    { to: '/manager/profile', icon: User, label: 'My Profile' },
  ]},
]

const memberNav = [
  { section: 'Workspace', items: [
    { to: '/member/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/member/projects', icon: FolderKanban, label: 'My Projects' },
    { to: '/member/tasks', icon: ClipboardList, label: 'My Tasks' },
  ]},
  { section: 'Account', items: [
    { to: '/member/notifications', icon: Bell, label: 'Notifications', badge: true },
    { to: '/member/profile', icon: User, label: 'My Profile' },
  ]},
]

const navByRole = { admin: adminNav, manager: managerNav, member: memberNav }

/**
 * NexusLogo — Custom SVG logo replacing the Unicode hexagon
 */
function NexusLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      {/* Outer hexagon */}
      <path d="M16 2L28.66 9V23L16 30L3.34 23V9L16 2Z" fill="url(#logo-grad)" opacity="0.2" />
      {/* Inner N shape */}
      <path d="M11 22V10L16 17L21 10V22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Glow dots */}
      <circle cx="16" cy="4" r="1.5" fill="#a78bfa" opacity="0.8" />
      <circle cx="27" cy="10" r="1.2" fill="#818cf8" opacity="0.6" />
      <circle cx="27" cy="22" r="1.2" fill="#818cf8" opacity="0.6" />
    </svg>
  )
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()

  const navGroups = navByRole[user?.role] || memberNav

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <NexusLogo />
          </div>
          <div className="sidebar-logo-text">
            <h1>ProjectNexus</h1>
            <span>Collaboration Platform</span>
          </div>
        </div>

        {/* User info */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user?.avatar || user?.name?.slice(0,2).toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navGroups.map(group => (
            <div key={group.section}>
              <div className="sidebar-section-label">{group.section}</div>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
                  onClick={onClose}
                >
                  <item.icon size={17} className="nav-icon" />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && unreadCount > 0 && (
                    <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="sidebar-footer-btn" onClick={handleLogout}>
            <LogOut size={17} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
