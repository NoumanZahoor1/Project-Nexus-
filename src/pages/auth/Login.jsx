import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, FolderKanban, Users, BarChart3, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { validateEmail, validatePassword } from '../../utils/validators'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    }
    setErrors(e)
    return !Object.values(e).some(Boolean)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success('Welcome back!', `Signed in as ${user.name}`)
      navigate(`/${user.role}/dashboard`)
    } catch (err) {
      toast.error('Sign In Failed', err.message)
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (email, password) => setForm({ email, password })

  return (
    <div className="auth-layout">
      {/* Left branding panel */}
      <div className="auth-left">
        <div className="auth-left-glow" />
        <div className="auth-left-glow2" />
        <div className="auth-left-content">
          <div className="auth-brand">
            <div className="auth-brand-icon">⬡</div>
            <span className="auth-brand-name">ProjectNexus</span>
          </div>
          <h2 className="auth-hero-title">Streamline Your Projects, Amplify Your Team</h2>
          <p className="auth-hero-subtitle">
            One unified platform to plan, manage, and deliver projects on time — with full visibility for everyone.
          </p>
          <div className="auth-features">
            {[
              { icon: <ShieldCheck size={20} color="#a5b4fc" />, text: 'Role-Based Portals for Admin, Manager & Members' },
              { icon: <BarChart3 size={20} color="#a5b4fc" />, text: 'Real-Time Progress Tracking & Analytics' },
              { icon: <FolderKanban size={20} color="#a5b4fc" />, text: 'Smart Task Management with Kanban Boards' },
              { icon: <Users size={20} color="#a5b4fc" />, text: 'Team Collaboration with Task Discussions' },
            ].map((f, i) => (
              <div className="auth-feature-item" key={i}>
                <div className="auth-feature-icon">{f.icon}</div>
                <span className="auth-feature-text">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <div style={{ fontSize: 28, marginBottom: 8 }}>⬡</div>
            <h1 className="auth-form-title">Welcome Back</h1>
            <p className="auth-form-subtitle">
              Sign in to your workspace. Don't have an account?{' '}
              <Link to="/register" className="auth-form-link">Create one free</Link>
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address <span className="required">*</span></label>
              <input
                className={`form-control ${errors.email ? 'error' : ''}`}
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                autoComplete="email"
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  className={`form-control ${errors.password ? 'error' : ''}`}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  autoComplete="current-password"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
              {loading ? <><Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /> Signing in...</> : 'Sign In to ProjectNexus'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="auth-demo-box" style={{ marginTop: 24 }}>
            <div className="auth-demo-title">🔑 Demo Credentials — Click to fill</div>
            {[
              { label: 'Admin', email: 'admin@projectnexus.com', password: 'admin123' },
              { label: 'Manager', email: 'sarah@projectnexus.com', password: 'manager123' },
              { label: 'Member', email: 'emily@projectnexus.com', password: 'member123' },
            ].map(d => (
              <div
                key={d.label}
                className="auth-demo-item"
                style={{ cursor: 'pointer', padding: '4px 6px', borderRadius: 6, transition: 'background 0.15s' }}
                onClick={() => fillDemo(d.email, d.password)}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span><strong>{d.label}:</strong> {d.email}</span>
                <span style={{ opacity: 0.7 }}>{d.password}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
