import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { School, LogOut, Loader2, CheckCircle2, XCircle, Clock, Users } from 'lucide-react'

interface Child {
  id: string
  name: string
  email: string | null
  groups: { id: string; name: string; subject: string | null; teacher: string | null }[]
  attendance: {
    rate: number | null
    records: { status: string; date: string | null; remarks: string | null }[]
  }
}

const ATTENDANCE_LABEL: Record<string, { label: string; className: string; Icon: any }> = {
  present: { label: 'حاضر', className: 'text-emerald-700 dark:text-emerald-400', Icon: CheckCircle2 },
  late: { label: 'متأخر', className: 'text-amber-700 dark:text-amber-400', Icon: Clock },
  absent: { label: 'غائب', className: 'text-red-700 dark:text-red-400', Icon: XCircle },
  excused: { label: 'بعذر', className: 'text-slate-600 dark:text-slate-400', Icon: CheckCircle2 },
}

export const ParentPortal: React.FC = () => {
  const { user, tenant, logout } = useAuth()

  const [children, setChildren] = useState<Child[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/portal/children')
      .then((r) => {
        setChildren(r.data.data)
        if (r.data.data.length) setSelected(r.data.data[0].id)
      })
      .catch(() => setChildren([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  const child = children.find((c) => c.id === selected)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <header className="border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
              <School className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">{user?.name}</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">{tenant?.name}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <LogOut className="h-3.5 w-3.5" />
            خروج
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-5">
        {children.length === 0 ? (
          <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-100 dark:bg-amber-950/40 p-6 text-center text-sm text-amber-800 dark:text-amber-300">
            لم يتم ربط أي طالب بحسابك بعد. تواصل مع إدارة المركز.
          </div>
        ) : (
          <>
            {/* Child switcher, only when there is more than one. */}
            {children.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                      selected === c.id
                        ? 'bg-violet-600 text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {child && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900 p-5">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">نسبة الحضور</p>
                    <p className="mt-1 text-2xl font-black text-violet-700 dark:text-violet-400">
                      {child.attendance.rate !== null ? `%${child.attendance.rate}` : '—'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900 p-5">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">المجموعات</p>
                    <p className="mt-1 text-2xl font-black text-violet-700 dark:text-violet-400">
                      {child.groups.length}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-3">
                    <h2 className="text-sm font-bold">المجموعات</h2>
                  </div>
                  {child.groups.length === 0 ? (
                    <p className="px-5 py-10 text-center text-xs text-slate-500">غير مسجّل في مجموعات.</p>
                  ) : (
                    child.groups.map((g) => (
                      <div key={g.id} className="border-b border-slate-200 dark:border-slate-800 px-5 py-3 last:border-b-0">
                        <p className="text-sm font-bold">{g.name}</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          {g.subject}{g.teacher ? ` • ${g.teacher}` : ''}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-3">
                    <h2 className="text-sm font-bold">سجل الحضور والغياب</h2>
                  </div>
                  {child.attendance.records.length === 0 ? (
                    <p className="px-5 py-10 text-center text-xs text-slate-500">لا يوجد سجل حضور بعد.</p>
                  ) : (
                    child.attendance.records.map((r, i) => {
                      const s = ATTENDANCE_LABEL[r.status] ?? ATTENDANCE_LABEL.excused
                      return (
                        <div key={i} className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3 last:border-b-0">
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            {r.date ? new Date(r.date).toLocaleDateString('ar-EG') : '—'}
                          </span>
                          <span className={`flex items-center gap-1 text-xs font-bold ${s.className}`}>
                            <s.Icon className="h-3.5 w-3.5" />
                            {s.label}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
