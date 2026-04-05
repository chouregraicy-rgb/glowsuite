import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'

function RoleRouter() {
  const { profile, loading } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', background: '#F8F5F0' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, color: '#8B3A52', marginBottom: 8 }}>GlowSuite</div>
        <div style={{ fontSize: 14, color: '#6B6258' }}>Loading...</div>
      </div>
    </div>
  )

  if (profile?.role === 'employee') return <EmployeeDashboard />
  return <Dashboard />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <RoleRouter />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
