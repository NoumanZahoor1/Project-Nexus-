import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Mail, Lock, User, Building, Phone, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { validateEmail, validatePassword, validateRequired, validateConfirmPassword } from '../../utils/validators'
import useDocumentTitle from '../../hooks/useDocumentTitle'

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

export default function Register() {
  useDocumentTitle('Create Account - ProjectNexus')
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', department: '', phone: '' })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const validate = () => {
    const e = {
      name: validateRequired(form.name, 'Full name'),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirm: validateConfirmPassword(form.password, form.confirm),
    }
    setErrors(e)
    return !Object.values(e).some(Boolean)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const user = await register({
        name: form.name, email: form.email, password: form.password,
        department: form.department, phone: form.phone,
      })
      toast.success('Account Created!', `Welcome to ProjectNexus, ${user.name}!`)
      navigate('/member/dashboard')
    } catch (err) {
      toast.error('Registration Failed', err.message)
    } finally {
      setLoading(false)
    }
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

          <h2 className="auth-hero-title">Join Your Team Workspace</h2>
          <p className="auth-hero-subtitle">
            Create a free account and start collaborating with your team on projects that matter.
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
            <h1 className="auth-form-title">Create Account</h1>
            <p className="auth-form-subtitle">
              Already have an account? <Link to="/login" className="auth-form-link">Sign in here</Link>
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name <span className="required">*</span></label>
                <div className="auth-input-wrap">
                  <User size={17} className="auth-input-icon" />
                  <input
                    id="name"
                    className={`form-control auth-input ${errors.name ? 'error' : ''}`}
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={set('name')}
                  />
                </div>
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="department">Department</label>
                <div className="auth-input-wrap">
                  <Building size={17} className="auth-input-icon" />
                  <input
                    id="department"
                    className="form-control auth-input"
                    placeholder="Engineering"
                    value={form.department}
                    onChange={set('department')}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address <span className="required">*</span></label>
              <div className="auth-input-wrap">
                <Mail size={17} className="auth-input-icon" />
                <input
                  id="reg-email"
                  className={`form-control auth-input ${errors.email ? 'error' : ''}`}
                  type="email"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <div className="auth-input-wrap">
                <Phone size={17} className="auth-input-icon" />
                <input
                  id="phone"
                  className="form-control auth-input"
                  type="tel"
                  placeholder="+1 555 0100"
                  value={form.phone}
                  onChange={set('phone')}
                />
              </div>
            </div>

            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password <span className="required">*</span></label>
                <div className="auth-input-wrap">
                  <Lock size={17} className="auth-input-icon" />
                  <input
                    id="reg-password"
                    className={`form-control auth-input ${errors.password ? 'error' : ''}`}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min 6 chars"
                    value={form.password}
                    onChange={set('password')}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowPass(v => !v)}
                    aria-label="Toggle password"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm">Confirm Password <span className="required">*</span></label>
                <div className="auth-input-wrap">
                  <Lock size={17} className="auth-input-icon" />
                  <input
                    id="confirm"
                    className={`form-control auth-input ${errors.confirm ? 'error' : ''}`}
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={form.confirm}
                    onChange={set('confirm')}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowConfirm(v => !v)}
                    aria-label="Toggle confirm password"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirm && <span className="form-error">{errors.confirm}</span>}
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Role: Team Member</strong> — Accounts start as Team Members. Administrators can upgrade roles anytime.
            </div>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? (
                <><Loader2 size={18} className="auth-spin" /> Creating Account...</>
              ) : (
                <>Create Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
