import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import {
  School, LogOut, Loader2, BookOpen, CalendarCheck, Receipt,
  ExternalLink, CheckCircle2, XCircle, Clock,
} from 'lucide-react'

interface Profile {
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

export const StudentPortal: React.FC = () => {
  const { user, tenant, logout } = useAuth()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [content, setContent] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'content' | 'invoices'>('overview')

  useEffect(() => {
    Promise.all([
      api.get('/portal/me').then((r) => setProfile(r.data.data)).catch(() => setProfile(null)),
      api.get('/portal/content').then((r) => setContent(r.data.data)).catch(() => setContent([])),
      api.get('/portal/invoices').then((r) => setInvoices(r.data.data)).catch(() => setInvoices([])),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  const TABS = [
    { key: 'overview' as const, label: 'نظرة عامة', Icon: CalendarCheck },
    { key: 'content' as const, label: 'المحتوى التعليمي', Icon: BookOpen },
    { key: 'invoices' as const, label: 'الاشتراك والمدفوعات', Icon: Receipt },
  ]

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
        {!profile ? (
          <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-100 dark:bg-amber-950/40 p-6 text-center text-sm text-amber-800 dark:text-amber-300">
            لم يتم ربط حسابك بملف طالب بعد. تواصل مع إدارة المركز.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="نسبة الحضور"
                value={profile.attendance.rate !== null ? `%${profile.attendance.rate}` : '—'}
              />
              <StatCard label="المجموعات" value={String(profile.groups.length)} />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                    tab === t.key
                      ? 'bg-violet-600 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <t.Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="space-y-6">
                <Panel title="مجموعاتي">
                  {profile.groups.length === 0 ? (
                    <Empty>لم يتم تسجيلك في أي مجموعة بعد.</Empty>
                  ) : (
                    profile.groups.map((g) => (
                      <Row key={g.id}>
                        <div>
                          <p className="text-sm font-bold">{g.name}</p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            {g.subject}{g.teacher ? ` • ${g.teacher}` : ''}
                          </p>
                        </div>
                      </Row>
                    ))
                  )}
                </Panel>

                <Panel title="سجل الحضور">
                  {profile.attendance.records.length === 0 ? (
                    <Empty>لا يوجد سجل حضور بعد.</Empty>
                  ) : (
                    profile.attendance.records.map((r, i) => {
                      const s = ATTENDANCE_LABEL[r.status] ?? ATTENDANCE_LABEL.excused
                      return (
                        <Row key={i}>
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            {r.date ? new Date(r.date).toLocaleDateString('ar-EG') : '—'}
                          </span>
                          <span className={`flex items-center gap-1 text-xs font-bold ${s.className}`}>
                            <s.Icon className="h-3.5 w-3.5" />
                            {s.label}
                          </span>
                        </Row>
                      )
                    })
                  )}
                </Panel>
              </div>
            )}

            {tab === 'content' && (
              <Panel title="المحتوى التعليمي">
                {content.length === 0 ? (
                  <Empty>لا يوجد محتوى منشور لمجموعاتك بعد.</Empty>
                ) : (
                  content.map((c) => (
                    <Row key={c.id}>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{c.title}</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">{c.content_type}</p>
                      </div>
                      {c.drive_link && (
                        <a
                          href={c.drive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-md bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-[11px] font-semibold text-white shrink-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                          فتح
                        </a>
                      )}
                    </Row>
                  ))
                )}
              </Panel>
            )}

            {tab === 'invoices' && (
              <Panel title="الاشتراك والمدفوعات">
                {invoices.length === 0 ? (
                  <Empty>لا توجد فواتير على حسابك.</Empty>
                ) : (
                  invoices.map((inv) => (
                    <Row key={inv.id}>
                      <div>
                        <p className="text-sm font-bold" dir="ltr">{inv.invoice_number}</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          {inv.due_date ? `الاستحقاق: ${new Date(inv.due_date).toLocaleDateString('ar-EG')}` : ''}
                        </p>
                      </div>
                      <div className="text-left shrink-0">
                        <p className="text-sm font-black" dir="ltr">
                          {Number(inv.grand_total).toLocaleString('ar-EG')} ج
                        </p>
                        <span className={`text-[10px] font-bold ${
                          inv.status === 'paid'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}>
                          {inv.status === 'paid' ? 'مدفوعة' : 'غير مدفوعة'}
                        </span>
                      </div>
                    </Row>
                  ))
                )}
              </Panel>
            )}
          </>
        )}
      </main>
    </div>
  )
}

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900 p-5">
    <p className="text-[11px] text-slate-600 dark:text-slate-400">{label}</p>
    <p className="mt-1 text-2xl font-black text-violet-700 dark:text-violet-400">{value}</p>
  </div>
)

const Panel: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900 overflow-hidden">
    <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-3">
      <h2 className="text-sm font-bold">{title}</h2>
    </div>
    <div>{children}</div>
  </div>
)

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-5 py-3 last:border-b-0">
    {children}
  </div>
)

const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="px-5 py-10 text-center text-xs text-slate-500">{children}</p>
)
