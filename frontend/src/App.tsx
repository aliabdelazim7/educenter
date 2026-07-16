import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ThemeToggle } from './components/ThemeToggle'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { AcceptInvitation } from './pages/AcceptInvitation'
import { Users as UserManagement } from './pages/Users'
import { Dashboard } from './pages/Dashboard'
import { Branches } from './pages/Branches'
import { AcademicHub } from './pages/AcademicHub'
import { AttendanceBoard } from './pages/AttendanceBoard'
import { LedgerBoard } from './pages/LedgerBoard'
import { POSRegister } from './pages/POSRegister'
import { InventoryBoard } from './pages/InventoryBoard'
import { Settings } from './pages/Settings'
import { Unauthorized } from './pages/Unauthorized'
import { Students } from './pages/Students'
import { Teachers } from './pages/Teachers'
import { Content } from './pages/Content'
import { Exams } from './pages/Exams'
import { Reports } from './pages/Reports'

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <ThemeToggle />
        <Routes>
          {/* Public authentication routes.
              /register creates a centre + its Owner; every other account is invited. */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/invitation/:token" element={<AcceptInvitation />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected tenant routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/branches"
            element={
              <ProtectedRoute requiredPermission="view branches">
                <Branches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic"
            element={
              <ProtectedRoute requiredPermission="view academic">
                <AcademicHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/:sessionId"
            element={
              <ProtectedRoute requiredPermission="mark attendance">
                <AttendanceBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/financials"
            element={
              <ProtectedRoute requiredPermission="view financial">
                <LedgerBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute requiredPermission="view pos">
                <POSRegister />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute requiredPermission="view students">
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teachers"
            element={
              <ProtectedRoute requiredPermission="view teachers">
                <Teachers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/content"
            element={
              <Content />
            }
          />
          <Route
            path="/exams"
            element={
              <Exams />
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute requiredPermission="view financial">
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute requiredPermission="view inventory">
                <InventoryBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute requiredPermission="manage settings">
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute requiredPermission="manage settings">
                <UserManagement />
              </ProtectedRoute>
            }
          />

          {/* Root fallback redirects to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch-all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  )
}

export default App
