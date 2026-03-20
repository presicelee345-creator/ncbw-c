import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GraduationCap, UserCircle, Users, Shield, Lock, LogOut, BookOpen } from 'lucide-react'

export default function Sidebar({ tracks = [], enrolledTrackIds = [] }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <GraduationCap size={20} />
        </div>
        <div>
          <div className="sidebar-brand-name">NCBW</div>
          <div className="sidebar-brand-sub">Queen City Metro Chapter</div>
        </div>
      </div>

      {/* Nav links */}
      <div className="sidebar-scroll">
        <div className="sidebar-section">
          <div className="sidebar-label">Navigation</div>
          <NavLink to="/profile" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <UserCircle size={16} />
            Profile
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Leadership Tracks</div>
          {tracks.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center' }}>
              <BookOpen size={20} style={{ color: '#333', margin: '0 auto 6px', display: 'block' }} />
              <span className="text-xs text-muted">No tracks yet</span>
            </div>
          ) : tracks.map(track => {
            const enrolled = enrolledTrackIds.includes(track.id) || track.enrolled
            return (
              <NavLink
                key={track.id}
                to={`/track/${track.id}`}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}${!enrolled ? ' locked' : ''}`}
              >
                {enrolled ? <Users size={16} /> : <Lock size={16} />}
                <span className="truncate">{track.name}</span>
              </NavLink>
            )
          })}
        </div>

        {user?.role === 'admin' && (
          <div className="sidebar-section">
            <div className="sidebar-label">Administration</div>
            <NavLink to="/admin" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Shield size={16} />
              Admin Dashboard
            </NavLink>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        {user && (
          <div style={{ padding: '0 10px', marginBottom: 6 }}>
            <div className="sidebar-user-name truncate">{user.first_name} {user.last_name}</div>
            <div className="sidebar-user-email truncate">{user.email}</div>
          </div>
        )}
        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </div>
  )
}
