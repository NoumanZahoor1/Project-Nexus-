import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FolderKanban, ClipboardList, Users, User, ArrowRight, Command } from 'lucide-react'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'

/**
 * SearchModal — Ctrl+K search overlay that searches projects, tasks, and users.
 * Inspired by VS Code / GitHub command palette.
 */
export default function SearchModal({ isOpen, onClose, projects = [], tasks = [], users = [] }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useKeyboardShortcut('Escape', () => { if (isOpen) onClose() })

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const q = query.toLowerCase().trim()

  const filteredProjects = q
    ? projects.filter(p => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)).slice(0, 5)
    : []

  const filteredTasks = q
    ? tasks.filter(t => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)).slice(0, 5)
    : []

  const filteredUsers = q
    ? users.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)).slice(0, 3)
    : []

  const hasResults = filteredProjects.length + filteredTasks.length + filteredUsers.length > 0

  const handleNavigate = (path) => {
    onClose()
    navigate(path)
  }

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="search-modal-input-wrap">
          <Search size={18} className="search-modal-icon" />
          <input
            ref={inputRef}
            className="search-modal-input"
            placeholder="Search projects, tasks, users..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
          />
          <kbd className="search-modal-kbd">ESC</kbd>
        </div>

        {/* Results */}
        <div className="search-modal-results">
          {!q && (
            <div className="search-modal-hint">
              <Command size={14} />
              <span>Start typing to search across your workspace</span>
            </div>
          )}

          {q && !hasResults && (
            <div className="search-modal-empty">
              No results for "<strong>{query}</strong>"
            </div>
          )}

          {filteredProjects.length > 0 && (
            <div className="search-modal-group">
              <div className="search-modal-group-label">
                <FolderKanban size={13} /> Projects
              </div>
              {filteredProjects.map(p => (
                <button
                  key={p.id}
                  className="search-modal-item"
                  onClick={() => handleNavigate(`/admin/projects/${p.id}`)}
                >
                  <FolderKanban size={15} />
                  <div className="search-modal-item-content">
                    <span className="search-modal-item-title">{p.name}</span>
                    <span className="search-modal-item-meta">{p.status} · {p.priority}</span>
                  </div>
                  <ArrowRight size={14} className="search-modal-item-arrow" />
                </button>
              ))}
            </div>
          )}

          {filteredTasks.length > 0 && (
            <div className="search-modal-group">
              <div className="search-modal-group-label">
                <ClipboardList size={13} /> Tasks
              </div>
              {filteredTasks.map(t => (
                <button
                  key={t.id}
                  className="search-modal-item"
                  onClick={() => handleNavigate(`/admin/projects/${t.projectId}`)}
                >
                  <ClipboardList size={15} />
                  <div className="search-modal-item-content">
                    <span className="search-modal-item-title">{t.title}</span>
                    <span className="search-modal-item-meta">{t.status} · {t.priority}</span>
                  </div>
                  <ArrowRight size={14} className="search-modal-item-arrow" />
                </button>
              ))}
            </div>
          )}

          {filteredUsers.length > 0 && (
            <div className="search-modal-group">
              <div className="search-modal-group-label">
                <Users size={13} /> People
              </div>
              {filteredUsers.map(u => (
                <button
                  key={u.id}
                  className="search-modal-item"
                  onClick={() => handleNavigate(`/admin/users`)}
                >
                  <User size={15} />
                  <div className="search-modal-item-content">
                    <span className="search-modal-item-title">{u.name}</span>
                    <span className="search-modal-item-meta">{u.email} · {u.role}</span>
                  </div>
                  <ArrowRight size={14} className="search-modal-item-arrow" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="search-modal-footer">
          <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Open</span>
          <span><kbd>ESC</kbd> Close</span>
        </div>
      </div>
    </div>
  )
}
