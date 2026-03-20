import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { GraduationCap, Users, BookOpen, FileQuestion, Award, Mail, BarChart3, LogOut, ChevronRight } from 'lucide-react'

const NAV = [
  { to: '/admin',              label: 'Trainees',         icon: Users,         end: true },
  { to: '/admin/tracks',       label: 'Tracks',           icon: BookOpen },
  { to: '/admin/quizzes',      label: 'Quizzes',          icon: FileQuestion },
  { to: '/admin/certificates', label: 'Certificates',     icon: Award },
  { to: '/admin/emails',       label: 'Email Templates',  icon: Mail },
  { to: '/admin/reports',      label: 'Reports',          icon: BarChart3 },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="app-layout">
      {/* Admin sidebar */}
      <div className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><GraduationCap size={20} /></div>
          <div>
            <div className="sidebar-brand-name">NCBW</div>
            <div className="sidebar-brand-sub">Admin Dashboard</div>
          </div>
        </div>

        <div className="sidebar-scroll">
          <div className="sidebar-section">
            <div className="sidebar-label">Management</div>
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
                <Icon size={16} />{label}
              </NavLink>
            ))}
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label">Portal</div>
            <button className="sidebar-link" onClick={() => navigate('/profile')}>
              <ChevronRight size={16} />Back to Portal
            </button>
          </div>
        </div>

        <div className="sidebar-footer">
          {user && (
            <div style={{ padding: '0 10px', marginBottom: 6 }}>
              <div className="sidebar-user-name truncate">{user.first_name} {user.last_name}</div>
              <div className="sidebar-user-email truncate">{user.email}</div>
            </div>
          )}
          <button className="sidebar-logout" onClick={() => { logout(); navigate('/login') }}>
            <LogOut size={15} />Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="main-content">
        <div className="top-bar">
          <div className="top-bar-title">Training Curriculum</div>
          <div className="top-bar-sub">Leadership Development Program — Administration</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
