import React, { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { Bell, Loader2, Check, CheckSquare } from 'lucide-react'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  created_at: string
}

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data.data)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll notifications every 45 seconds for a dynamic, live dashboard feel!
    const interval = setInterval(fetchNotifications, 45000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.post(`/notifications/${id}/read`)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all')
      setNotifications([])
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon & Badge */}
      <button
        onClick={() => setOpen(!open)}
        className="relative h-9 w-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
      >
        <Bell className="h-4.5 w-4.5" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
        )}
      </button>

      {/* Dropdown Card */}
      {open && (
        <div className="absolute top-11 right-0 w-80 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950/95 backdrop-blur-md shadow-2xl p-4 z-50 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Notifications ({notifications.length})</span>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-semibold text-violet-700 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1"
              >
                <CheckSquare className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">All caught up! No new notifications.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="group flex justify-between gap-3 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900/50 hover:border-slate-200 dark:hover:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-900/40 text-xs transition-all"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-slate-200 truncate">{n.title}</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal">{n.message}</p>
                  </div>
                  <button
                    onClick={(e) => markAsRead(n.id, e)}
                    className="h-5 w-5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-850 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center justify-center shrink-0 text-slate-500 transition-all opacity-0 group-hover:opacity-100"
                    title="Mark as read"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
