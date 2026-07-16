import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { School, Loader2, AlertCircle, CheckCircle2, Lock, Phone, User, Mail } from 'lucide-react'

interface InvitationDetails {
  name: string
  email: string | null
  phone: string | null
  role: string
  role_label: string
  center_name: string
  subdomain: string
  expires_at: string
}

export const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [invite, setInvite] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/invitations/${token}`)
        setInvite(res.data.data)
        setPhone(res.data.data.phone || '')
      } catch (err: any) {
        setLoadError(err.response?.data?.message || 'تعذر تحميل بيانات الدعوة.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (password !== passwordConfirmation) {
      setFormError('تأكيد كلمة المرور غير متطابق.')
      return
    }

    setSubmitting(true)
    try {
      await api.post(`/invitations/${token}/accept`, {
        password,
        password_confirmation: passwordConfirmation,
        phone,
      })
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: any) {
      const res = err.response?.data
      setFormError(res?.errors?.password?.[0] || res?.message || 'تعذر إنشاء الحساب.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
          <p className="text-sm text-slate-600 dark:text-slate-400">جاري التحقق من الدعوة...</p>
        </div>
      </div>
    )
  }

  // Invalid / expired / already-used links all land here.
  if (loadError) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
            <AlertCircle className="h-7 w-7 text-red-700 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">رابط الدعوة غير صالح</h1>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{loadError}</p>
          <p className="text-xs text-slate-500">
            تواصل مع إدارة المركز لطلب دعوة جديدة.
          </p>
          <Link
            to="/login"
            className="inline-block rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            الذهاب لتسجيل الدخول
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
            <CheckCircle2 className="h-7 w-7 text-emerald-700 dark:text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">تم إنشاء حسابك بنجاح 🎉</h1>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            جاري تحويلك لصفحة تسجيل الدخول...
          </p>
          <p className="text-xs text-slate-500">
            كود المركز الخاص بك: <span className="font-bold text-violet-700 dark:text-violet-400">{invite?.subdomain}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 font-sans">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600">
            <School className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            أهلاً {invite?.name} 👋
          </h1>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            تمت دعوتك للانضمام إلى <strong className="text-slate-900 dark:text-slate-200">{invite?.center_name}</strong>
            {' '}بصفة <strong className="text-violet-700 dark:text-violet-400">{invite?.role_label}</strong>
          </p>
          <p className="text-xs text-slate-500">
            كل اللي محتاجه هو تعيين كلمة مرور — أقل من دقيقتين.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5"
        >
          {formError && (
            <div className="flex items-center gap-3 rounded-lg bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 p-3 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Identity is fixed by the invitation and cannot be edited here. */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">الاسم</label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={invite?.name || ''}
                readOnly
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 py-2.5 pr-9 pl-3 text-sm text-slate-600 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          {invite?.email && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={invite.email}
                  readOnly
                  dir="ltr"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 py-2.5 pr-9 pl-3 text-sm text-slate-600 dark:text-slate-400 cursor-not-allowed text-right"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              رقم الهاتف
            </label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2.5 pr-9 pl-3 text-sm text-slate-900 dark:text-slate-100 text-right focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="لا تقل عن 8 أحرف"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2.5 pr-9 pl-3 text-sm text-slate-900 dark:text-slate-100 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password_confirmation" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              تأكيد كلمة المرور
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="password_confirmation"
                type="password"
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="أعد كتابة كلمة المرور"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2.5 pr-9 pl-3 text-sm text-slate-900 dark:text-slate-100 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-60 px-4 py-3 text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>جاري إنشاء الحساب...</span>
              </>
            ) : (
              <span>إنشاء الحساب</span>
            )}
          </button>

          <p className="text-center text-[11px] text-slate-500">
            هذا الرابط صالح لمرة واحدة فقط وينتهي خلال 48 ساعة.
          </p>
        </form>
      </div>
    </div>
  )
}
