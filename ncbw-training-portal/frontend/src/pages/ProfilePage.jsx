import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import { changePassword } from '../api'
import { UserCircle, Mail, Award, KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2, Shield } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  const [showPwForm, setShowPwForm] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', new_pw: '', confirm: '' })
  const [showC, setShowC] = useState(false)
  const [showN, setShowN] = useState(false)
  const [showCon, setShowCon] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError]   = useState(null)
  const [pwOk,    setPwOk]      = useState(false)

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown'

  const handleChangePw = async e => {
    e.preventDefault()
    setPwError(null); setPwOk(false)
    if (pwForm.new_pw !== pwForm.confirm) { setPwError('New passwords do not match'); return }
    if (pwForm.new_pw.length < 8) { setPwError('Password must be at least 8 characters'); return }
    setPwLoading(true)
    try {
      await changePassword({ current_password: pwForm.current, new_password: pwForm.new_pw })
      setPwOk(true)
      setPwForm({ current: '', new_pw: '', confirm: '' })
      setTimeout(() => setShowPwForm(false), 1500)
    } catch (err) { setPwError(err.response?.data?.error || 'Failed to update password') }
    finally { setPwLoading(false) }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="top-bar">
          <div className="top-bar-title">Training Curriculum</div>
          <div className="top-bar-sub">Leadership Development Program</div>
        </div>
        <div className="page-body">
          <div style={{ maxWidth: 700 }}>
            <h2 className="page-title mb-6" style={{ color: 'var(--gold)' }}>Profile</h2>

            {/* Identity card */}
            <div className="card mb-4">
              <div className="flex-center gap-3">
                <div className="profile-avatar"><UserCircle size={44} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{user?.first_name} {user?.last_name}</div>
                  <div className="text-sm text-muted mt-1">@{user?.username}</div>
                  <div className="flex-center gap-2 mt-2">
                    <span className="flex-center gap-1 text-sm" style={{ color: '#555' }}>
                      <Mail size={13} style={{ color: 'var(--gold)' }} /> {user?.email}
                    </span>
                    {user?.role === 'admin'
                      ? <span className="badge badge-gold"><Shield size={11} /> Administrator</span>
                      : <span className="badge badge-gold">Trainee</span>}
                    <span className="badge badge-green">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Organization */}
            <div className="card mb-4">
              <div className="flex-center gap-2 mb-4">
                <Award size={18} style={{ color: 'var(--gold)' }} />
                <span style={{ fontWeight: 700, color: 'var(--gold)' }}>Organization</span>
              </div>
              <div className="profile-grid">
                {[
                  ['Organization',  'National Coalition of 100 Black Women'],
                  ['Chapter',       'Queen City Metropolitan Chapter'],
                  ['Member Since',  joinDate],
                  ['Role',          user?.role === 'admin' ? 'Administrator' : 'Trainee'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{label}</div>
                    <div className="text-sm" style={{ fontWeight: 500 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security */}
            <div className="card">
              <div className="flex-between mb-4">
                <div className="flex-center gap-2">
                  <KeyRound size={18} style={{ color: 'var(--gold)' }} />
                  <span style={{ fontWeight: 700, color: 'var(--gold)' }}>Security</span>
                </div>
                {!showPwForm && (
                  <button className="btn btn-outline btn-sm" onClick={() => setShowPwForm(true)}>
                    Change Password
                  </button>
                )}
              </div>

              {!showPwForm
                ? <p className="text-sm text-muted">Use the button above to change your password.</p>
                : (
                  <form onSubmit={handleChangePw} style={{ maxWidth: 340 }}>
                    {pwError && <div className="alert alert-error"><AlertCircle size={14} />{pwError}</div>}
                    {pwOk    && <div className="alert alert-success"><CheckCircle2 size={14} />Password updated!</div>}
                    {[
                      { label: 'Current Password', key: 'current', show: showC, toggle: () => setShowC(v=>!v) },
                      { label: 'New Password',     key: 'new_pw',  show: showN, toggle: () => setShowN(v=>!v) },
                      { label: 'Confirm New',      key: 'confirm', show: showCon, toggle: () => setShowCon(v=>!v) },
                    ].map(({ label, key, show, toggle }) => (
                      <div className="form-group" key={key}>
                        <label className="form-label">{label}</label>
                        <div className="form-input-wrap">
                          <input
                            type={show ? 'text' : 'password'}
                            className="form-input"
                            placeholder="••••••••"
                            value={pwForm[key]}
                            onChange={e => setPwForm(f => ({...f, [key]: e.target.value}))}
                          />
                          <button type="button" className="form-input-btn" onClick={toggle}>
                            {show ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex-center gap-2 mt-3">
                      <button type="submit" className="btn btn-gold btn-sm" disabled={pwLoading}>
                        {pwLoading ? 'Saving…' : 'Save Password'}
                      </button>
                      <button type="button" className="btn btn-outline btn-sm"
                        onClick={() => { setShowPwForm(false); setPwError(null); setPwOk(false) }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
