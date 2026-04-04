import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', fontFamily: 'DM Sans, sans-serif',
      background: '#F8F5F0', color: '#6B6258', fontSize: 14, flexDirection: 'column', gap: 12
    }}>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: '#8B3A52' }}>GlowSuite</div>
      <div>Loading your dashboard...</div>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && profile && !allowedRoles.includes(profile.role))
    return <Navigate to="/login" replace />

  return children
}
