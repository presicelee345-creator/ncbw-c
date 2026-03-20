import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { login, register, forgotPassword } from '../api'
import { GraduationCap, Eye, EyeOff, User, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validatePassword(pw) {
  const errs = []
  if (pw.length < 8) errs.push('At least 8 characters')
  if (!/[A-Z]/.test(pw)) errs.push('At least 1 uppercase letter')
  if (!/[!@#$%^&*()\-_=+[\]{};':",.<>/?`~|\\]/.test(pw)) errs.push('At least 1 special character')
  return errs
}

export default function LoginPage() {
  const { loginUser } = useAuth()
  const [tab,       setTab]       = useState('login')
  const [error,     setError]     = useState(null)
  const [warning,   setWarning]   = useState(null)
  const [success,   setSuccess]   = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [fieldErrs, setFieldErrs] = useState({})
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const [showLoginPw,  setShowLoginPw]  = useState(false)
  const [showRegPw,    setShowRegPw]    = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)

  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [regForm,   setRegForm]   = useState({
    first_name: '', last_name: '', username: '', email: '', password: '', confirm_password: ''
  })

  const switchTab = t => { setTab(t); setError(null); setWarning(null); setFieldErrs({}) }

  /* ── Login ── */
  const handleLogin = async e => {
    e.preventDefault()
    setError(null); setWarning(null); setLoading(true)
    try {
      const res = await login(loginForm)
      loginUser(res.data.token, res.data.user)
    } catch (err) {
      const data = err.response?.data || {}
      setError(data.error || 'Login failed')
      if (data.attempts_remaining != null)
        setWarning(`${data.attempts_remaining} attempt${data.attempts_remaining === 1 ? '' : 's'} remaining before lockout.`)
    } finally { setLoading(false) }
  }

  /* ── Register ── */
  const handleRegister = async e => {
    e.preventDefault()
    setError(null); setSuccess(null)
    const errs = {}
    if (!regForm.first_name.trim()) errs.first_name = 'Required'
    else if (!/^[A-Za-z\s'-]+$/.test(regForm.first_name)) errs.first_name = 'Letters only'
    if (!regForm.last_name.trim()) errs.last_name = 'Required'
    else if (!/^[A-Za-z\s'-]+$/.test(regForm.last_name)) errs.last_name = 'Letters only'
    if (!regForm.username.trim()) errs.username = 'Required'
    else if (!/^[a-zA-Z0-9_]{3,30}$/.test(regForm.username)) errs.username = '3–30 chars, letters/numbers/underscores'
    if (!regForm.email.trim()) errs.email = 'Required'
    else if (!EMAIL_RE.test(regForm.email)) errs.email = 'Invalid email'
    const pwErrs = validatePassword(regForm.password)
    if (pwErrs.length) errs.password = pwErrs.join(' · ')
    if (!regForm.confirm_password) errs.confirm_password = 'Required'
    else if (regForm.password !== regForm.confirm_password) errs.confirm_password = 'Passwords do not match'
    if (Object.keys(errs).length) { setFieldErrs(errs); return }
    setFieldErrs({}); setLoading(true)
    try {
      const res = await register({
        first_name: regForm.first_name, last_name: regForm.last_name,
        username: regForm.username, email: regForm.email, password: regForm.password
      })
      loginUser(res.data.token, res.data.user)
    } catch (err) { setError(err.response?.data?.error || 'Registration failed') }
    finally { setLoading(false) }
  }

  /* ── Forgot password ── */
  const handleForgot = async e => {
    e.preventDefault(); setError(null); setSuccess(null)
    if (!EMAIL_RE.test(forgotEmail)) { setError('Please enter a valid email'); return }
    setForgotLoading(true)
    try { await forgotPassword({ email: forgotEmail }) } catch {}
    finally {
      setForgotLoading(false)
      setSuccess('If that email is registered, a reset link has been sent.')
      setForgotEmail('')
    }
  }

  /* ── Input helper ── */
  const inp = (value, onChange, placeholder, type = 'text', hasError) => (
    <input
      className={`form-input${hasError ? ' error' : ''}`}
      type={type} value={value} onChange={onChange} placeholder={placeholder}
    />
  )

  return (
    <div className="login-page">
      <div className="login-dots" />
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-icon"><GraduationCap size={28} /></div>
          <div className="login-title">NCBW</div>
          <div className="login-sub">Queen City Metropolitan Chapter</div>
          <div className="login-tag">Training Portal</div>
        </div>

        <div className="login-body">
          {/* Forgot password form */}
          {showForgot ? (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: 4 }}>Reset Password</div>
                <div className="text-sm text-muted">Enter your email to receive a reset link.</div>
              </div>
              {error   && <div className="alert alert-error"><AlertCircle size={15} />{error}</div>}
              {success && <div className="alert alert-success"><CheckCircle2 size={15} />{success}</div>}
              <form onSubmit={handleForgot}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div className="form-input-wrap">
                    <Mail size={15} className="form-input-icon" />
                    {inp(forgotEmail, e => setForgotEmail(e.target.value), 'your@email.com', 'email')}
                  </div>
                </div>
                <button type="submit" className="btn btn-gold" style={{ width: '100%', marginBottom: 8 }}
                  disabled={forgotLoading}>
                  {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                </button>
                <button type="button" className="btn btn-ghost" style={{ width: '100%', color: 'var(--gold)' }}
                  onClick={() => { setShowForgot(false); setError(null); setSuccess(null) }}>
                  ← Back to login
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Tabs */}
              <div className="tab-bar">
                <button className={`tab-btn${tab === 'login' ? ' active' : ''}`} onClick={() => switchTab('login')}>Sign In</button>
                <button className={`tab-btn${tab === 'register' ? ' active' : ''}`} onClick={() => switchTab('register')}>Register</button>
              </div>

              {error   && <div className="alert alert-error"><AlertCircle size={15} />{error}</div>}
              {warning && <div className="alert alert-warn"><AlertCircle size={15} />{warning}</div>}

              {/* Login form */}
              {tab === 'login' && (
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <div className="form-input-wrap">
                      <User size={15} className="form-input-icon" />
                      {inp(loginForm.username, e => setLoginForm(f => ({...f, username: e.target.value})), 'your_username')}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className="form-input-wrap">
                      <Lock size={15} className="form-input-icon" />
                      {inp(loginForm.password, e => setLoginForm(f => ({...f, password: e.target.value})), '••••••••', showLoginPw ? 'text' : 'password')}
                      <button type="button" className="form-input-btn" onClick={() => setShowLoginPw(v => !v)}>
                        {showLoginPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginBottom: 14 }}>
                    <button type="button" onClick={() => setShowForgot(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: '.82rem' }}>
                      Forgot password?
                    </button>
                  </div>
                  <button type="submit" className="btn btn-gold" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign In'}
                  </button>
                </form>
              )}

              {/* Register form */}
              {tab === 'register' && (
                <form onSubmit={handleRegister}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 0 }}>
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      {inp(regForm.first_name, e => setRegForm(f=>({...f,first_name:e.target.value})), 'Jane', 'text', fieldErrs.first_name)}
                      {fieldErrs.first_name && <div className="form-error">{fieldErrs.first_name}</div>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      {inp(regForm.last_name, e => setRegForm(f=>({...f,last_name:e.target.value})), 'Doe', 'text', fieldErrs.last_name)}
                      {fieldErrs.last_name && <div className="form-error">{fieldErrs.last_name}</div>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    {inp(regForm.username, e => setRegForm(f=>({...f,username:e.target.value})), 'jane_doe', 'text', fieldErrs.username)}
                    {fieldErrs.username && <div className="form-error">{fieldErrs.username}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    {inp(regForm.email, e => setRegForm(f=>({...f,email:e.target.value})), 'jane@example.com', 'email', fieldErrs.email)}
                    {fieldErrs.email && <div className="form-error">{fieldErrs.email}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className="form-input-wrap">
                      {inp(regForm.password, e => setRegForm(f=>({...f,password:e.target.value})), '••••••••', showRegPw ? 'text' : 'password', fieldErrs.password)}
                      <button type="button" className="form-input-btn" onClick={() => setShowRegPw(v => !v)}>
                        {showRegPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {fieldErrs.password && <div className="form-error">{fieldErrs.password}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <div className="form-input-wrap">
                      {inp(regForm.confirm_password, e => setRegForm(f=>({...f,confirm_password:e.target.value})), '••••••••', showConfirm ? 'text' : 'password', fieldErrs.confirm_password)}
                      <button type="button" className="form-input-btn" onClick={() => setShowConfirm(v => !v)}>
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {fieldErrs.confirm_password && <div className="form-error">{fieldErrs.confirm_password}</div>}
                  </div>
                  <button type="submit" className="btn btn-gold" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Creating account…' : 'Create Account'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
        <div className="login-footer">© {new Date().getFullYear()} NCBW Queen City Metro Chapter</div>
      </div>
    </div>
  )
}
