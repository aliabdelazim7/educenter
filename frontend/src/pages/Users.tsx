import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { InviteUserModal } from '../components/InviteUserModal'
import { RolePermissions } from '../components/RolePermissions'
import {
  UserPlus, Loader2, RefreshCw, XCircle, Mail, ArrowLeft,
  ShieldCheck, ShieldOff, Clock, CheckCircle2, Ban,
} from 'lucide-react'

interface Invitation {
  id: string
  name: string
  email: string | null
  role: string
  role_label: string
  status: 'sent' | 'expired' | 'accepted' | 'cancelled'
  user_status: string
  invited_by: string | null
  expires_at: string
  created_at: string
}

interface AppUser {
  id: string
  name: string
  email: string | null
  phone: string | null
  status: string
  roles: string[]
  role_labels: string[]
}

const INVITE_STATUS: Record<string, { label: string; className: string; Icon: any }> = {
  sent: { label: 'دعوة مُرسلة', className: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30', Icon: Mail },
  expired: { label: 'انتهت الصلاحية', className: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30', Icon: Clock },
  accepted: { label: 'مفعّل', className: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', Icon: CheckCircle2 },
  cancelled: { label: 'ملغاة', className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700', Icon: Ban },
}

const USER_STATUS: Record<string, { label: string; className: string }> = {
  pending_invitation: { label: 'بانتظار قبول الدعوة', className: 'text-amber-700 dark:text-amber-400' },
  active: { label: 'نشط', className: 'text-emerald-700 dark:text-emerald-400' },
  inactive: { label: 'غير نشط', className: 'text-slate-600 dark:text-slate-400' },
  suspended: { label: 'موقوف', className: 'text-red-700 dark:text-red-400' },
}

export const Users: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [tab, setTab] = useState<'invitations' | 'users' | 'roles'>('invitations')

  const load = useCallback(async () => {
    try {
      const [inv, usr] = await Promise.all([api.get('/invitations'), api.get('/users')])
      setInvitations(inv.data.data)
      setUsers(usr.data.data)
    } catch {
      setNotice('تعذر تحميل البيانات.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const flash = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3000)
  }

  const act = async (id: string, fn: () => Promise<any>, okMsg: string) => {
    setBusyId(id)
    try {
      await fn()
      await load()
      flash(okMsg)
    } catch (err: any) {
      flash(err.response?.data?.message || 'فشلت العملية.')
    } finally {
      setBusyId(null)
    }
  }

  const resend = (i: Invitation) =>
    act(i.id, () => api.post(`/invitations/${i.id}/resend`), 'تم إرسال الدعوة مرة أخرى.')

  const cancel = (i: Invitation) => {
    if (!confirm(`إلغاء دعوة ${i.name}؟ الرابط المُرسل لن يعمل بعد ذلك.`)) return
    act(i.id, () => api.delete(`/invitations/${i.id}`), 'تم إلغاء الدعوة.')
  }

  const changeEmail = (i: Invitation) => {
    const email = prompt('البريد الإلكتروني الجديد:', i.email || '')
    if (!email) return
    act(i.id, () => api.patch(`/invitations/${i.id}/email`, { email }), 'تم تحديث البريد وإرسال دعوة جديدة.')
  }

  const setStatus = (u: AppUser, status: string) =>
    act(u.id, () => api.patch(`/users/${u.id}/status`, { status }), 'تم تحديث حالة المستخدم.')

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <div className="mx-auto max-w-5xl p-8 space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-5">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">المستخدمون والدعوات</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                لا يمكن لأحد إنشاء حساب بنفسه — كل حساب يبدأ بدعوة منك.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            إضافة مستخدم
          </button>
        </div>

        {notice && (
          <div className="rounded-lg border border-violet-200 dark:border-violet-500/30 bg-violet-100 dark:bg-violet-600/10 p-3 text-xs text-violet-800 dark:text-violet-300">
            {notice}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto">
          {(['invitations', 'users', 'roles'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === t
                  ? 'bg-violet-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {t === 'invitations'
                ? `الدعوات (${invitations.length})`
                : t === 'users'
                  ? `المستخدمون (${users.length})`
                  : 'الصلاحيات'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : tab === 'roles' ? (
          <RolePermissions />
        ) : tab === 'invitations' ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900 overflow-hidden">
            {invitations.length === 0 ? (
              <p className="p-12 text-center text-sm text-slate-500">لا توجد دعوات بعد. ابدأ بإضافة مستخدم.</p>
            ) : (
              invitations.map((i) => {
                const s = INVITE_STATUS[i.status] ?? INVITE_STATUS.cancelled
                return (
                  <div
                    key={i.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 p-4 last:border-b-0"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{i.name}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400" dir="ltr">
                        {i.email || 'بدون بريد — رابط يدوي'}
                      </p>
                      <p className="text-[11px] text-slate-500">{i.role_label}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${s.className}`}>
                        <s.Icon className="h-3 w-3" />
                        {s.label}
                      </span>

                      {i.status !== 'accepted' && i.status !== 'cancelled' && (
                        <>
                          <IconBtn title="إعادة إرسال" onClick={() => resend(i)} busy={busyId === i.id}>
                            <RefreshCw className="h-3.5 w-3.5" />
                          </IconBtn>
                          <IconBtn title="تغيير البريد" onClick={() => changeEmail(i)} busy={busyId === i.id}>
                            <Mail className="h-3.5 w-3.5" />
                          </IconBtn>
                          <IconBtn title="إلغاء الدعوة" onClick={() => cancel(i)} busy={busyId === i.id} danger>
                            <XCircle className="h-3.5 w-3.5" />
                          </IconBtn>
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900 overflow-hidden">
            {users.map((u) => {
              const st = USER_STATUS[u.status] ?? USER_STATUS.inactive
              const isOwner = u.roles.includes('Owner')
              return (
                <div
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 p-4 last:border-b-0"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400" dir="ltr">{u.email || u.phone}</p>
                    <p className="text-[11px] text-slate-500">{u.role_labels.join('، ')}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-bold ${st.className}`}>{st.label}</span>

                    {!isOwner && u.status !== 'pending_invitation' && (
                      u.status === 'active' ? (
                        <IconBtn title="تعطيل" onClick={() => setStatus(u, 'inactive')} busy={busyId === u.id} danger>
                          <ShieldOff className="h-3.5 w-3.5" />
                        </IconBtn>
                      ) : (
                        <IconBtn title="تفعيل" onClick={() => setStatus(u, 'active')} busy={busyId === u.id}>
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </IconBtn>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showInvite && (
        <InviteUserModal onClose={() => setShowInvite(false)} onInvited={load} />
      )}
    </div>
  )
}

const IconBtn: React.FC<{
  children: React.ReactNode
  onClick: () => void
  title: string
  busy?: boolean
  danger?: boolean
}> = ({ children, onClick, title, busy, danger }) => (
  <button
    onClick={onClick}
    disabled={busy}
    title={title}
    className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-50 ${
      danger
        ? 'border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40'
        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : children}
  </button>
)
