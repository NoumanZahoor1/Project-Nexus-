import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Users, Target, Zap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { validateEmail, validatePassword, validateRequired, validateConfirmPassword } from '../../utils/validators'

export default function Register() {
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
      <div className="auth-left">
        <div className="auth-left-glow" />
        <div className="auth-left-glow2" />
        <div className="auth-left-content">
          <div className="auth-brand">
            <div className="auth-brand-icon">⬡</div>
            <span className="auth-brand-name">ProjectNexus</span>
          </div>
          <h2 className="auth-hero-title">Join Your Team Today</h2>
          <p className="auth-hero-subtitle">
            Create a free account and start collaborating with your team on projects that matter.
          </p>
          <div className="auth-features">
            {[
              { icon: <Users size={20} color="#a5b4fc" />, text: 'Collaborate with your team in real time' },
              { icon: <Target size={20} color="#a5b4fc" />, text: 'Track your tasks and deadlines effortlessly' },
              { icon: <Zap size={20} color="#a5b4fc" />, text: 'Get notified on updates that matter to you' },
            ].map((f, i) => (
              <div className="auth-feature-item" key={i}>
                <div className="auth-feature-icon">{f.icon}</div>
                <span className="auth-feature-text">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <div style={{ fontSize: 28, marginBottom: 8 }}>⬡</div>
            <h1 className="auth-form-title">Create Your Account</h1>
            <p className="auth-form-subtitle">
              Already have an account?{' '}
              <Link to="/login" className="auth-form-link">Sign in here</Link>
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="form-label">Full Name <span className="required">*</span></label>
                <input className={`form-control ${errors.name ? 'error' : ''}`} placeholder="Jane Smith" value={form.name} onChange={set('name')} />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-control" placeholder="e.g. Engineering" value={form.department} onChange={set('department')} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address <span className="required">*</span></label>
              <input className={`form-control ${errors.email ? 'error' : ''}`} type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-control" type="tel" placeholder="+1 555 0100" value={form.phone} onChange={set('phone')} />
            </div>

            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="form-label">Password <span className="required">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input className={`form-control ${errors.password ? 'error' : ''}`} type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={set('password')} style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password <span className="required">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input className={`form-control ${errors.confirm ? 'error' : ''}`} type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirm && <span className="form-error">{errors.confirm}</span>}
              </div>
            </div>

            {/* Role note */}
            <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Role: Team Member</strong> — All new accounts start as Team Members. An Administrator can upgrade your role later.
            </div>

            <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
              {loading ? <><Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /> Creating Account...</> : 'Create My Account'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
              By registering you agree to ProjectNexus Terms of Service
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
