import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Sends each role to the surface it is actually allowed to use.
 *
 * Students and parents hold no admin permissions, so the staff dashboard would
 * only render empty panels and 403s for them.
 */
export const HomeRedirect: React.FC = () => {
  const { user, loading, hasRole } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (hasRole('Student')) return <Navigate to="/portal" replace />
  if (hasRole('Parent')) return <Navigate to="/parent" replace />

  return <Navigate to="/dashboard" replace />
}
