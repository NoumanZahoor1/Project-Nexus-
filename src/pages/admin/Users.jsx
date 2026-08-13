import { useState, useEffect, useMemo } from 'react'
import {
  Plus, Search, Edit2, Trash2, Shield, UserCheck, UserX,
  Loader2, User, Mail, Phone, Building2, Users
} from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import Modal from '../../components/common/Modal'
import Avatar from '../../components/common/Avatar'
import { Badge } from '../../components/common/Badge'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getUsers, createUser, updateUser, deleteUser } from '../../api'
import { generateId, formatDate, formatRelative, getRoleConfig } from '../../utils/helpers'
import { validateEmail, validatePassword, validateRequired } from '../../utils/validators'

const ROLES = ['admin', 'manager', 'member']
const EMPTY_FORM = { name: '', email: '', password: '', role: 'member', department: '', phone: '', isActive: true }

export default function AdminUsers() {
  const { user: me } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    setLoading(true)
    try { const { data } = await getUsers(); setUsers(data) }
    catch { toast.error('Error', 'Failed to load users') }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    let list = users
    if (search) list = list.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter)
    if (statusFilter !== 'all') list = list.filter(u => statusFilter === 'active' ? u.isActive : !u.isActive)
    list = [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'role') return a.role.localeCompare(b.role)
      if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt)
      return 0
    })
    return list
  }, [users, search, roleFilter, statusFilter, sortBy])

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setErrors({}); setShowModal(true) }
  const openEdit = (u) => { setEditing(u); setForm({ ...u, password: '' }); setErrors({}); setShowModal(true) }

  const validate = () => {
    const e = {
      name: validateRequired(form.name, 'Full name'),
      email: validateEmail(form.email),
      password: !editing ? validatePassword(form.password) : (form.password && form.password.length > 0 && form.password.length < 6 ? 'Min 6 chars' : null),
    }
    setErrors(e)
    return !Object.values(e).some(Boolean)
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (editing) {
        const updates = { name: form.name, email: form.email, role: form.role, department: form.department, phone: form.phone, isActive: form.isActive }
        if (form.password) updates.password = form.password
        await updateUser(editing.id, updates)
        toast.success('User Updated', `${form.name} has been updated.`)
      } else {
        const existing = users.find(u => u.email.toLowerCase() === form.email.toLowerCase())
        if (existing) { toast.error('Email Taken', 'A user with this email already exists.'); setSaving(false); return }
        const newUser = {
          id: `user-${generateId()}`, ...form,
          avatar: form.name.trim().slice(0, 2).toUpperCase(),
          createdAt: new Date().toISOString(), lastLogin: null,
        }
        await createUser(newUser)
        toast.success('User Created', `${form.name} has been added.`)
      }
      await loadUsers()
      setShowModal(false)
    } catch { toast.error('Error', 'Failed to save user') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteUser(deleteTarget.id)
      toast.success('User Deleted', `${deleteTarget.name} has been removed.`)
      await loadUsers()
      setDeleteTarget(null)
    } catch { toast.error('Error', 'Failed to delete user') }
    finally { setSaving(false) }
  }

  const toggleStatus = async (u) => {
    try {
      await updateUser(u.id, { isActive: !u.isActive })
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isActive: !u.isActive } : x))
      toast.success('Updated', `${u.name} is now ${!u.isActive ? 'active' : 'inactive'}.`)
    } catch { toast.error('Error', 'Failed to update status') }
  }

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">{users.length} users in the system</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add User</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-search">
          <Search size={14} color="var(--text-muted)" />
          <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="member">Member</option>
        </select>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="name">Sort: Name</option>
          <option value="role">Sort: Role</option>
          <option value="date">Sort: Newest</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex-center" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><Users size={32} className="empty-state-icon" /><div className="empty-state-title">No users found</div></div></td></tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={u.name} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><Badge type="role" value={u.role} /></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.department || '—'}</td>
                  <td>
                    <span
                      className={`badge ${u.isActive ? 'badge-success' : 'badge-neutral'}`}
                      style={{ cursor: u.id !== me?.id ? 'pointer' : 'default' }}
                      onClick={() => u.id !== me?.id && toggleStatus(u)}
                      title={u.id !== me?.id ? 'Click to toggle' : 'Cannot change own status'}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>{u.lastLogin ? formatRelative(u.lastLogin) : 'Never'}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(u)}><Edit2 size={15} /></button>
                      {u.id !== me?.id && (
                        <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger-500)' }} title="Delete" onClick={() => setDeleteTarget(u)}><Trash2 size={15} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit User' : 'Add New User'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving...</> : (editing ? 'Save Changes' : 'Create User')}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">Full Name <span className="required">*</span></label>
              <input className={`form-control ${errors.name ? 'error' : ''}`} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Role <span className="required">*</span></label>
              <select className="form-control filter-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email <span className="required">*</span></label>
            <input className={`form-control ${errors.email ? 'error' : ''}`} type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="jane@company.com" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">{editing ? 'New Password (leave blank to keep)' : 'Password'} {!editing ? <span className="required">*</span> : ''}</label>
            <input className={`form-control ${errors.password ? 'error' : ''}`} type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder={editing ? '(unchanged)' : 'Min 6 characters'} />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-control" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} placeholder="Engineering" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 555 0100" />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
            <span style={{ fontSize: 13.5, fontWeight: 500 }}>Account Active</span>
          </label>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete User"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </AppLayout>
  )
}
