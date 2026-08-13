import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Calendar, Users, BarChart3, CheckCircle, Clock, AlertCircle, Activity } from 'lucide-react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import AppLayout from '../../components/layout/AppLayout'
import { Badge } from '../../components/common/Badge'
import Avatar from '../../components/common/Avatar'
import ProgressBar from '../../components/common/ProgressBar'
import { getProjectById, getTasks, getUsers, getActivityByProject, updateProject } from '../../api'
import { formatDate, formatRelative, calcProjectProgress, getTaskStats, getTaskStatusConfig } from '../../utils/helpers'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const TABS = ['Overview', 'Tasks', 'Team', 'Activity']

export default function AdminProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Overview')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [pRes, tRes, uRes, aRes] = await Promise.all([
          getProjectById(id), getTasks(), getUsers(), getActivityByProject(id)
        ])
        setProject(pRes.data)
        setTasks(tRes.data.filter(t => t.projectId === id))
        setUsers(uRes.data)
        setActivity(aRes.data)
      } catch { navigate('/admin/projects') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  const getUser = (uid) => users.find(u => u.id === uid)
  const taskStats = useMemo(() => getTaskStats(tasks), [tasks])
  const progress = useMemo(() => calcProjectProgress(tasks), [tasks])
  const teamMembers = useMemo(() => (project?.memberIds || []).map(id => getUser(id)).filter(Boolean), [project, users])

  const barData = {
    labels: ['To Do', 'In Progress', 'In Review', 'Completed'],
    datasets: [{
      label: 'Tasks',
      data: [taskStats.todo, taskStats.inProgress, taskStats.review, taskStats.completed],
      backgroundColor: ['#94a3b8', '#3b82f6', '#f59e0b', '#22c55e'],
      borderRadius: 6,
    }],
  }

  if (loading) return <AppLayout><div className="flex-center" style={{ minHeight: 400 }}><div className="spinner" /></div></AppLayout>
  if (!project) return null

  const manager = getUser(project.managerId)

  return (
    <AppLayout>
      {/* Breadcrumb */}
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/projects')} style={{ marginBottom: 20, gap: 6 }}>
        <ArrowLeft size={15} /> Back to Projects
      </button>

      {/* Project Header */}
      <div className="card card-pad mb-6">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{project.name}</h1>
              <Badge type="priority" value={project.priority} />
              <Badge type="status" value={project.status} />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{project.description}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          {[
            { label: 'Project Manager', value: manager ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar name={manager.name} size="xs" />{manager.name}</div> : '—' },
            { label: 'Team Size', value: `${teamMembers.length} members` },
            { label: 'Start Date', value: formatDate(project.startDate) },
            { label: 'End Date', value: formatDate(project.endDate) },
            { label: 'Created', value: formatDate(project.createdAt) },
          ].map(item => (
            <div key={item.label} style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {TABS.map(t => <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>)}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card card-pad">
            <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Overall Progress</div>
            <ProgressBar value={progress} size="lg" />
          </div>
          <div className="grid-4">
            {[
              { label: 'To Do', val: taskStats.todo, color: '#94a3b8', icon: <Clock size={20} /> },
              { label: 'In Progress', val: taskStats.inProgress, color: '#3b82f6', icon: <BarChart3 size={20} /> },
              { label: 'In Review', val: taskStats.review, color: '#f59e0b', icon: <AlertCircle size={20} /> },
              { label: 'Completed', val: taskStats.completed, color: '#22c55e', icon: <CheckCircle size={20} /> },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon" style={{ background: `${s.color}20`, color: s.color }}>{s.icon}</div>
                <div className="stat-info"><div className="stat-value">{s.val}</div><div className="stat-label">{s.label}</div></div>
              </div>
            ))}
          </div>
          <div className="chart-card">
            <div className="chart-card-title">Task Status Breakdown</div>
            <div style={{ height: 220 }}>
              <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
            </div>
          </div>
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'Tasks' && (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Task</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Due Date</th></tr></thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-title">No tasks yet</div></div></td></tr>
              ) : tasks.map(t => {
                const assignee = getUser(t.assigneeId)
                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.title}</td>
                    <td>{assignee ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={assignee.name} size="xs" />{assignee.name}</div> : '—'}</td>
                    <td><Badge type="priority" value={t.priority} /></td>
                    <td><Badge type="taskStatus" value={t.status} /></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(t.dueDate)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'Team' && (
        <div className="grid-auto">
          {teamMembers.length === 0 ? (
            <div className="empty-state"><Users size={32} className="empty-state-icon" /><div className="empty-state-title">No team members</div></div>
          ) : teamMembers.map(m => {
            const memberTasks = tasks.filter(t => t.assigneeId === m.id)
            return (
              <div key={m.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar name={m.name} size="md" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.department}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{memberTasks.length} task{memberTasks.length !== 1 ? 's' : ''}</div>
                </div>
                <Badge type="role" value={m.role} />
              </div>
            )
          })}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'Activity' && (
        <div className="card card-pad">
          {activity.length === 0 ? (
            <div className="empty-state"><Activity size={32} className="empty-state-icon" /><div className="empty-state-title">No activity yet</div></div>
          ) : (
            <div className="timeline">
              {activity.map((log, i) => {
                const actor = getUser(log.userId)
                return (
                  <div className="timeline-item" key={log.id}>
                    <div className="timeline-line-wrap">
                      <div className="timeline-dot" />
                      {i < activity.length - 1 && <div className="timeline-connector" />}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-text"><strong>{actor?.name || 'System'}</strong> — {log.description}</div>
                      <div className="timeline-time">{formatRelative(log.createdAt)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </AppLayout>
  )
}
