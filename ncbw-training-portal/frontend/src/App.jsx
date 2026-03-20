import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage        from './pages/LoginPage'
import ProfilePage      from './pages/ProfilePage'
import TrackPage        from './pages/TrackPage'
import AdminLayout      from './pages/admin/AdminLayout'
import AdminTrainees    from './pages/admin/AdminTrainees'
import AdminTracks      from './pages/admin/AdminTracks'
import AdminQuizzes     from './pages/admin/AdminQuizzes'
import AdminCertificates from './pages/admin/AdminCertificates'
import AdminEmails      from './pages/admin/AdminEmails'
import AdminReports     from './pages/admin/AdminReports'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="loading-center" style={{ height: '100vh' }}>
      <div className="spinner" />
      <span className="text-muted text-sm">Loading…</span>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/profile" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to={user.role === 'admin' ? '/admin' : '/profile'} replace /> : <LoginPage />
      } />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/track/:trackId" element={<ProtectedRoute><TrackPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route index          element={<AdminTrainees />} />
        <Route path="tracks"  element={<AdminTracks />} />
        <Route path="quizzes" element={<AdminQuizzes />} />
        <Route path="certificates" element={<AdminCertificates />} />
        <Route path="emails"  element={<AdminEmails />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>
      <Route path="*" element={
        <Navigate to={user ? (user.role === 'admin' ? '/admin' : '/profile') : '/login'} replace />
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
