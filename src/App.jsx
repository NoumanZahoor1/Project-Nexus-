import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { NotificationProvider } from './context/NotificationContext'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminProjects from './pages/admin/Projects'
import AdminProjectDetail from './pages/admin/ProjectDetail'

// Manager Pages
import ManagerDashboard from './pages/manager/Dashboard'
import ManagerProjects from './pages/manager/Projects'
import ManagerProjectWorkspace from './pages/manager/ProjectWorkspace'
import ManagerTasks from './pages/manager/Tasks'

// Member Pages
import MemberDashboard from './pages/member/Dashboard'
import MemberProjects from './pages/member/MyProjects'
import MemberProjectView from './pages/member/ProjectView'
import MemberTasks from './pages/member/MyTasks'

// Shared Pages
import Notifications from './pages/shared/Notifications'
import Profile from './pages/shared/Profile'

// ===== ROUTE GUARDS =====
function RequireAuth({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard
    return <Navigate to={`/${user.role}/dashboard`} replace />
  }

  return children
}

function PublicOnly({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to={`/${user.role}/dashboard`} replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <NotificationProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

        {/* Root redirect */}
        <Route
          path="/"
          element={<Navigate to={user ? `/${user.role}/dashboard` : '/login'} replace />}
        />

        {/* ===== ADMIN ROUTES ===== */}
        <Route path="/admin/dashboard" element={
          <RequireAuth allowedRoles={['admin']}>
            <AdminDashboard />
          </RequireAuth>
        } />
        <Route path="/admin/users" element={
          <RequireAuth allowedRoles={['admin']}>
            <AdminUsers />
          </RequireAuth>
        } />
        <Route path="/admin/projects" element={
          <RequireAuth allowedRoles={['admin']}>
            <AdminProjects />
          </RequireAuth>
        } />
        <Route path="/admin/projects/:id" element={
          <RequireAuth allowedRoles={['admin']}>
            <AdminProjectDetail />
          </RequireAuth>
        } />
        <Route path="/admin/notifications" element={
          <RequireAuth allowedRoles={['admin']}>
            <Notifications />
          </RequireAuth>
        } />
        <Route path="/admin/profile" element={
          <RequireAuth allowedRoles={['admin']}>
            <Profile />
          </RequireAuth>
        } />

        {/* ===== MANAGER ROUTES ===== */}
        <Route path="/manager/dashboard" element={
          <RequireAuth allowedRoles={['manager']}>
            <ManagerDashboard />
          </RequireAuth>
        } />
        <Route path="/manager/projects" element={
          <RequireAuth allowedRoles={['manager']}>
            <ManagerProjects />
          </RequireAuth>
        } />
        <Route path="/manager/projects/:id/workspace" element={
          <RequireAuth allowedRoles={['manager']}>
            <ManagerProjectWorkspace />
          </RequireAuth>
        } />
        <Route path="/manager/tasks" element={
          <RequireAuth allowedRoles={['manager']}>
            <ManagerTasks />
          </RequireAuth>
        } />
        <Route path="/manager/notifications" element={
          <RequireAuth allowedRoles={['manager']}>
            <Notifications />
          </RequireAuth>
        } />
        <Route path="/manager/profile" element={
          <RequireAuth allowedRoles={['manager']}>
            <Profile />
          </RequireAuth>
        } />

        {/* ===== MEMBER ROUTES ===== */}
        <Route path="/member/dashboard" element={
          <RequireAuth allowedRoles={['member']}>
            <MemberDashboard />
          </RequireAuth>
        } />
        <Route path="/member/projects" element={
          <RequireAuth allowedRoles={['member']}>
            <MemberProjects />
          </RequireAuth>
        } />
        <Route path="/member/projects/:id" element={
          <RequireAuth allowedRoles={['member']}>
            <MemberProjectView />
          </RequireAuth>
        } />
        <Route path="/member/tasks" element={
          <RequireAuth allowedRoles={['member']}>
            <MemberTasks />
          </RequireAuth>
        } />
        <Route path="/member/notifications" element={
          <RequireAuth allowedRoles={['member']}>
            <Notifications />
          </RequireAuth>
        } />
        <Route path="/member/profile" element={
          <RequireAuth allowedRoles={['member']}>
            <Profile />
          </RequireAuth>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </NotificationProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
