import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Edit2, Trash2, Eye, MoreVertical, Calendar,
  Users, FolderKanban, CheckCircle, Loader2, Tag, Clock
} from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import Modal from '../../components/common/Modal'
import Avatar from '../../components/common/Avatar'
import { AvatarGroup } from '../../components/common/Avatar'
import { Badge } from '../../components/common/Badge'
import ProgressBar from '../../components/common/ProgressBar'
import { useToast } from '../../context/ToastContext'
import { getProjects, getUsers, getTasks, createProject, updateProject, deleteProject } from '../../api'
import { generateId, formatDate, calcProjectProgress, getPriorityConfig, getStatusConfig } from '../../utils/helpers'
import { validateRequired, validateDate, validateEndDate } from '../../utils/validators'

const PRIORITIES = ['low', 'medium', 'high', 'critical']
const STATUSES = ['planning', 'active', 'on-hold', 'completed', 'cancelled']

const EMPTY_FORM = {
  name: '', description: '', startDate: '', endDate: '',
  priority: 'medium', status: 'planning', managerId: '', memberIds: [], tags: '',
}

export default function AdminProjects() {
  const navigate = useNavigate()
  const toast = useToast()
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [managerFilter, setManagerFilter] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [openMenu, setOpenMenu] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [pRes, uRes, tRes] = await Promise.all([getProjects(), getUsers(), getTasks()])
      setProjects(pRes.data); setUsers(uRes.data); setTasks(tRes.data)
    } catch { toast.error('Error', 'Failed to load data') }
    finally { setLoading(false) }
  }

  const managers = users.filter(u => u.role === 'manager')
  const members = users.filter(u => u.role === 'member')
  const getUser = (id) => users.find(u => u.id === id)
  const getProjectTasks = (pid) => tasks.filter(t => t.projectId === pid)
  const getMemberNames = (ids) => ids.map(id => getUser(id)?.name).filter(Boolean)

  const filtered = useMemo(() => {
    let list = projects
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter)
    if (priorityFilter !== 'all') list = list.filter(p => p.priority === priorityFilter)
    if (managerFilter !== 'all') list = list.filter(p => p.managerId === managerFilter)
    return list
  }, [projects, search, statusFilter, priorityFilter, managerFilter])

  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    onHold: projects.filter(p => p.status === 'on-hold').length,
  }), [projects])

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setErrors({}); setShowModal(true) }
  const openEdit = (p, e) => { e.stopPropagation(); setEditing(p); setForm({ ...p, tags: (p.tags || []).join(', ') }); setErrors({}); setShowModal(true); setOpenMenu(null) }

  const validate = () => {
    const e = {
      name: validateRequired(form.name, 'Project name'),
      description: validateRequired(form.description, 'Description'),
      startDate: validateDate(form.startDate, 'Start date'),
      endDate: validateEndDate(form.startDate, form.endDate),
      managerId: validateRequired(form.managerId, 'Project manager'),
    }
    setErrors(e); return !Object.values(e).some(Boolean)
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [], updatedAt: new Date().toISOString() }
      if (editing) {
        await updateProject(editing.id, payload)
        toast.success('Updated', `${form.name} has been updated.`)
      } else {
        await createProject({ ...payload, id: `proj-${generateId()}`, createdBy: 'user-001', createdAt: new Date().toISOString() })
        toast.success('Created', `${form.name} has been created.`)
      }
      await loadData(); setShowModal(false)
    } catch { toast.error('Error', 'Failed to save project') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteProject(deleteTarget.id)
      toast.success('Deleted', `${deleteTarget.name} removed.`)
      await loadData(); setDeleteTarget(null)
    } catch { toast.error('Error', 'Delete failed') }
    finally { setSaving(false) }
  }

  const toggleMember = (id) => {
    setForm(p => ({ ...p, memberIds: p.memberIds.includes(id) ? p.memberIds.filter(x => x !== id) : [...p.memberIds, id] }))
  }

  return (
    <AppLayout>
      {/* Click away to close menu */}
      {openMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setOpenMenu(null)} />}

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">All Projects</h1>
          <p className="page-subtitle">Manage and monitor all organizational projects</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> New Project</button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: '#6366f1' },
          { label: 'Active', value: stats.active, color: '#22c55e' },
          { label: 'Completed', value: stats.completed, color: '#94a3b8' },
          { label: 'On Hold', value: stats.onHold, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="card card-pad-sm" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--text-primary)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-search">
          <Search size={14} color="var(--text-muted)" />
          <input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className="filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="all">All Priority</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <select className="filter-select" value={managerFilter} onChange={e => setManagerFilter(e.target.value)}>
          <option value="all">All Managers</option>
          {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><FolderKanban size={40} className="empty-state-icon" /><div className="empty-state-title">No projects found</div></div>
      ) : (
        <div className="grid-auto">
          {filtered.map(p => {
            const manager = getUser(p.managerId)
            const ptasks = getProjectTasks(p.id)
            const progress = calcProjectProgress(ptasks)
            const memberNames = getMemberNames(p.memberIds || [])
            return (
              <div className="project-card" key={p.id} onClick={() => navigate(`/admin/projects/${p.id}`)}>
                <div className="project-card-header">
                  <div style={{ flex: 1 }}>
                    <div className="project-card-title">{p.name}</div>
                    <p className="project-card-desc" style={{ WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', display: '-webkit-box' }}>{p.description}</p>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === p.id ? null : p.id) }}>
                      <MoreVertical size={16} />
                    </button>
                    {openMenu === p.id && (
                      <div style={{ position: 'absolute', right: 0, top: 32, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 100, minWidth: 150, padding: 6 }}>
                        <button className="sidebar-nav-item" style={{ width: '100%', color: 'var(--text-primary)', padding: '7px 10px', fontSize: 13 }} onClick={e => { e.stopPropagation(); navigate(`/admin/projects/${p.id}`); setOpenMenu(null) }}><Eye size={14} /> View Details</button>
                        <button className="sidebar-nav-item" style={{ width: '100%', color: 'var(--text-primary)', padding: '7px 10px', fontSize: 13 }} onClick={e => openEdit(p, e)}><Edit2 size={14} /> Edit Project</button>
                        <button className="sidebar-nav-item" style={{ width: '100%', color: 'var(--danger-500)', padding: '7px 10px', fontSize: 13 }} onClick={e => { e.stopPropagation(); setDeleteTarget(p); setOpenMenu(null) }}><Trash2 size={14} /> Delete</button>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Badge type="priority" value={p.priority} />
                  <Badge type="status" value={p.status} />
                </div>
                {manager && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={manager.name} size="xs" />
                    <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{manager.name}</span>
                  </div>
                )}
                <AvatarGroup names={memberNames} max={4} size="xs" />
                <ProgressBar value={progress} label={`${ptasks.length} tasks`} />
                <div className="project-card-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {formatDate(p.startDate)}</span>
                  <span>→</span>
                  <span>{formatDate(p.endDate)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Project' : 'New Project'} size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving...</> : (editing ? 'Save Changes' : 'Create Project')}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Project Name <span className="required">*</span></label>
            <input className={`form-control ${errors.name ? 'error' : ''}`} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Customer Portal Redesign" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Description <span className="required">*</span></label>
            <textarea className={`form-control ${errors.description ? 'error' : ''}`} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What is this project about?" rows={3} />
            {errors.description && <span className="form-error">{errors.description}</span>}
          </div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">Start Date <span className="required">*</span></label>
              <input className={`form-control ${errors.startDate ? 'error' : ''}`} type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
              {errors.startDate && <span className="form-error">{errors.startDate}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">End Date <span className="required">*</span></label>
              <input className={`form-control ${errors.endDate ? 'error' : ''}`} type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
              {errors.endDate && <span className="form-error">{errors.endDate}</span>}
            </div>
          </div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">Priority <span className="required">*</span></label>
              <select className="form-control filter-select" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status <span className="required">*</span></label>
              <select className="form-control filter-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Project Manager <span className="required">*</span></label>
            <select className={`form-control filter-select ${errors.managerId ? 'error' : ''}`} value={form.managerId} onChange={e => setForm(p => ({ ...p, managerId: e.target.value }))}>
              <option value="">— Select Manager —</option>
              {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {errors.managerId && <span className="form-error">{errors.managerId}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Team Members</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxHeight: 180, overflowY: 'auto' }}>
              {members.map(m => (
                <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, background: form.memberIds.includes(m.id) ? 'var(--primary-100)' : 'transparent', border: `1px solid ${form.memberIds.includes(m.id) ? 'var(--primary-300)' : 'transparent'}`, transition: 'all 0.15s', fontSize: 13 }}>
                  <input type="checkbox" checked={form.memberIds.includes(m.id)} onChange={() => toggleMember(m.id)} />
                  <Avatar name={m.name} size="xs" />
                  {m.name}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma-separated)</label>
            <input className="form-control" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="react, backend, API" />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Project"
        footer={<><button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting...' : 'Delete Project'}</button></>}
      >
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Delete <strong>{deleteTarget?.name}</strong>? All associated data will be lost. This cannot be undone.</p>
      </Modal>
    </AppLayout>
  )
}
