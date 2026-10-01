import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { validateEmail, validatePassword } from '../../utils/validators'
import useDocumentTitle from '../../hooks/useDocumentTitle'

const DEMO_ACCOUNTS = [
  { role: 'Admin', desc: 'Manage users, projects and reports', email: 'admin@projectnexus.com', pass: 'admin123', color: '#6366f1' },
  { role: 'Manager', desc: 'Lead projects and assign tasks', email: 'sarah@projectnexus.com', pass: 'manager123', color: '#059669' },
  { role: 'Member', desc: 'Work on tasks and update status', email: 'emily@projectnexus.com', pass: 'member123', color: '#d97706' },
]

const HIGHLIGHTS = [
  'Role-based access for admins, managers and members',
  'Drag-and-drop Kanban boards',
  'Progress and productivity analytics',
]

const Logo = ({ size = 28, stroke = '#fff', width = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <polygon points="16,2 29,9.5 29,24.5 16,32 3,24.5 3,9.5" stroke={stroke} strokeWidth={width} strokeLinejoin="round" />
    <path d="M10 22V10L22 22V10" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function BoardPreview() {
  return (
    <div className="nx-board" aria-hidden="true">
      <div className="nx-board-bar">
        <span /><span /><span />
        <em>Website Redesign</em>
      </div>

      <div className="nx-board-cols">
        <div className="nx-col">
          <h4>To do <b>2</b></h4>
          <div className="nx-task"><i className="t-high" />Write API docs</div>
          <div className="nx-task"><i className="t-low" />Set up CI pipeline</div>
        </div>

        <div className="nx-col">
          <h4>In progress <b>1</b></h4>
          <div className="nx-task"><i className="t-med" />Design dashboard</div>
        </div>

        <div className="nx-col">
          <h4>Done <b>2</b></h4>
          <div className="nx-task nx-task-done"><Check size={12} />Project setup</div>
          <div className="nx-task nx-task-done"><Check size={12} />Build login flow</div>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  useDocumentTitle('Sign In - ProjectNexus')
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeDemo, setActiveDemo] = useState('')

  const validate = () => {
    const e = {
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    }
    setErrors(e)
    return !Object.values(e).some(Boolean)
  }

  const signIn = async (email, password) => {
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success('Welcome back!', `Signed in as ${user.name}`)
      navigate(`/${user.role}/dashboard`)
    } catch (err) {
      toast.error('Sign in failed', err.message)
      setActiveDemo('')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    signIn(form.email, form.password)
  }

  // One click: fill the fields and sign in
  const demoLogin = (d) => {
    if (loading) return
    setActiveDemo(d.role)
    setErrors({})
    setForm({ email: d.email, password: d.pass })
    signIn(d.email, d.pass)
  }

  return (
    <div className="auth-layout">
      {/* ---------- Brand panel ---------- */}
      <aside className="auth-left">
        <div className="auth-left-glow" />
        <div className="auth-left-glow2" />
        <div className="auth-grid-bg" />

        <div className="auth-left-content">
          <div className="auth-brand">
            <div className="auth-brand-icon-modern"><Logo /></div>
            <span className="auth-brand-name">ProjectNexus</span>
          </div>

          <h2 className="auth-hero-title">Ship projects without the status meetings.</h2>
          <p className="auth-hero-subtitle">
            Plan sprints, assign work and track progress in one workspace for your whole team.
          </p>

          <BoardPreview />

          <ul className="auth-highlights">
            {HIGHLIGHTS.map((h) => (
              <li key={h}><Check size={15} />{h}</li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ---------- Form panel ---------- */}
      <main className="auth-right">
        <div className="auth-form-container">
          <div className="auth-mobile-brand">
            <Logo size={24} stroke="var(--primary-600)" width={3} />
            <span>ProjectNexus</span>
          </div>

          <div className="auth-form-header">
            <h1 className="auth-form-title">Sign in</h1>
            <p className="auth-form-subtitle">
              New to ProjectNexus? <Link to="/register" className="auth-form-link">Create an account</Link>
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <div className="auth-input-wrap">
                <Mail size={17} className="auth-input-icon" />
                <input
                  id="email"
                  className={`form-control auth-input ${errors.email ? 'error' : ''}`}
                  type="email"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="auth-input-wrap">
                <Lock size={17} className="auth-input-icon" />
                <input
                  id="password"
                  className={`form-control auth-input ${errors.password ? 'error' : ''}`}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading && !activeDemo ? (
                <><Loader2 size={18} className="auth-spin" /> Signing in...</>
              ) : (
                <>Sign in <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* ---------- Demo access ---------- */}
          <div className="auth-divider"><span>Or explore with a demo account</span></div>

          <div className="auth-demo-grid">
            {DEMO_ACCOUNTS.map((d) => (
              <button
                key={d.role}
                type="button"
                className="auth-demo-pill"
                style={{ '--demo-color': d.color }}
                onClick={() => demoLogin(d)}
                disabled={loading}
              >
                <span className="demo-pill-avatar">{d.role[0]}</span>
                <span className="demo-pill-text">
                  <strong>{d.role}</strong>
                  <small>{d.desc}</small>
                </span>
                {loading && activeDemo === d.role
                  ? <Loader2 size={16} className="auth-spin demo-pill-arrow" />
                  : <ArrowRight size={16} className="demo-pill-arrow" />}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
