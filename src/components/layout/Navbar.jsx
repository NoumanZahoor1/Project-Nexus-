import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, Sun, Moon, Search, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useNotifications } from '../../context/NotificationContext'

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [search, setSearch] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const notifPath = `/${user?.role}/notifications`
  const profilePath = `/${user?.role}/profile`

  return (
    <header className="app-navbar">
      {/* Left side */}
      <div className="navbar-left">
        <button className="mobile-menu-btn navbar-icon-btn" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <div className="navbar-search">
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search projects, tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Right side */}
      <div className="navbar-right">
        {/* Theme toggle */}
        <button className="navbar-icon-btn btn-icon" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button className="navbar-icon-btn btn-icon" onClick={() => navigate(notifPath)} title="Notifications">
          <Bell size={18} />
          {unreadCount > 0 && <span className="navbar-notif-badge" />}
        </button>

        {/* Avatar / User menu */}
        <div style={{ position: 'relative' }}>
          <div
            className="navbar-avatar"
            onClick={() => setShowUserMenu(v => !v)}
            title={user?.name}
          >
            {user?.avatar || user?.name?.slice(0,2).toUpperCase() || 'U'}
          </div>
          {showUserMenu && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                onClick={() => setShowUserMenu(false)}
              />
              <div style={{
                position: 'absolute', top: '44px', right: 0, zIndex: 200,
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)',
                minWidth: '200px', padding: '8px', animation: 'slideUp 0.15s ease'
              }}>
                <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid var(--border-color)', marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{user?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
                </div>
                <button
                  className="sidebar-nav-item"
                  style={{ width: '100%', color: 'var(--text-secondary)', padding: '8px 12px' }}
                  onClick={() => { navigate(profilePath); setShowUserMenu(false) }}
                >
                  My Profile
                </button>
                <button
                  className="sidebar-footer-btn"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
