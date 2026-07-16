import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { X, Loader2, AlertCircle, Send, Copy, CheckCircle2 } from 'lucide-react'

const ROLES = [
  { value: 'Teacher', label: 'مدرس' },
  { value: 'Student', label: 'طالب' },
  { value: 'Parent', label: 'ولي أمر' },
  { value: 'Reception', label: 'موظف استقبال' },
  { value: 'Accountant', label: 'محاسب' },
  { value: 'Admin', label: 'مدير' },
  { value: 'Teacher Assistant', label: 'مساعد مدرس' },
]

interface Props {
  onClose: () => void
  onInvited: () => void
}

export const InviteUserModal: React.FC<Props> = ({ onClose, onInvited }) => {
  const [role, setRole] = useState('')
  const [form, setForm] = useState<Record<string, string>>({})
  const [branches, setBranches] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [parents, setParents] = useState<any[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Only fetch the lookups a given role actually needs.
  useEffect(() => {
    if (!role) return

    if (['Teacher', 'Student'].includes(role) && branches.length === 0) {
      api.get('/branches').then((r) => setBranches(r.data.data)).catch(() => {})
    }
    if (role === 'Teacher' && subjects.length === 0) {
      api.get('/subjects').then((r) => setSubjects(r.data.data)).catch(() => {})
    }
    if (role === 'Student' && parents.length === 0) {
      api.get('/users').then((r) => {
        setParents((r.data.data || []).filter((u: any) => u.roles?.includes('Parent')))
      }).catch(() => {})
    }
  }, [role, branches.length, subjects.length, parents.length])

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setGeneralError(null)
    setSubmitting(true)

    const profile: Record<string, string> = {}
    Object.entries(form).forEach(([k, v]) => {
      if (k.startsWith('profile.')) profile[k.replace('profile.', '')] = v
    })

    try {
      const res = await api.post('/invitations', {
        name: form.name,
        email: form.email || null,
        phone: form.phone,
        role,
        profile: Object.keys(profile).length ? profile : undefined,
      })
      onInvited()

      // No address means nobody received a mail — show the link to share manually.
      if (!form.email) {
        setInviteUrl(res.data.invite_url)
      } else {
        onClose()
      }
    } catch (err: any) {
      const res = err.response?.data
      if (res?.errors) setErrors(res.errors)
      else setGeneralError(res?.message || 'تعذر إرسال الدعوة.')
    } finally {
      setSubmitting(false)
    }
  }

  const err = (field: string) => errors[field]?.[0]

  const inputClass =
    'w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-violet-500 focus:outline-none'

  const Field: React.FC<{ label: string; name: string; children: React.ReactNode }> = ({ label, name, children }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</label>
      {children}
      {err(name) && <p className="text-[11px] text-red-600 dark:text-red-400">{err(name)}</p>}
    </div>
  )

  // Post-invite state for students enrolled without an email.
  if (inviteUrl) {
    return (
      <Overlay onClose={onClose}>
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
            <CheckCircle2 className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">تم إنشاء الدعوة</h3>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            لا يوجد بريد إلكتروني لهذا المستخدم، فلم تُرسل رسالة.
            انسخ الرابط وأرسله له عبر واتساب أو أي وسيلة أخرى.
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-2">
            <input
              readOnly
              value={inviteUrl}
              dir="ltr"
              className="flex-1 bg-transparent text-[11px] text-slate-700 dark:text-slate-300 outline-none"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteUrl)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="flex items-center gap-1 rounded-md bg-violet-600 hover:bg-violet-500 px-2.5 py-1.5 text-[11px] font-semibold text-white shrink-0"
            >
              <Copy className="h-3 w-3" />
              {copied ? 'تم النسخ' : 'نسخ'}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">الرابط صالح 48 ساعة ويُستخدم مرة واحدة.</p>
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-slate-200 dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200"
          >
            تم
          </button>
        </div>
      </Overlay>
    )
  }

  return (
    <Overlay onClose={onClose}>
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">إضافة مستخدم جديد</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 p-3 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        <Field label="نوع المستخدم" name="role">
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                  role === r.value
                    ? 'border-violet-500 bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-violet-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </Field>

        {role && (
          <>
            <Field label="الاسم" name="name">
              <input className={inputClass} value={form.name || ''} onChange={(e) => set('name', e.target.value)} required />
            </Field>

            <Field label={role === 'Student' ? 'البريد الإلكتروني (اختياري)' : 'البريد الإلكتروني'} name="email">
              <input
                type="email"
                dir="ltr"
                className={`${inputClass} text-right`}
                value={form.email || ''}
                onChange={(e) => set('email', e.target.value)}
                required={role !== 'Student'}
              />
            </Field>

            <Field label="رقم الهاتف" name="phone">
              <input dir="ltr" className={`${inputClass} text-right`} value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} required />
            </Field>

            {role === 'Teacher' && (
              <>
                <Field label="المادة" name="profile.subject_id">
                  <select className={inputClass} value={form['profile.subject_id'] || ''} onChange={(e) => set('profile.subject_id', e.target.value)} required>
                    <option value="">اختر المادة</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
                <Field label="الفرع" name="profile.branch_id">
                  <select className={inputClass} value={form['profile.branch_id'] || ''} onChange={(e) => set('profile.branch_id', e.target.value)} required>
                    <option value="">اختر الفرع</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </Field>
                <Field label="نوع التعاقد" name="profile.contract_type">
                  <select className={inputClass} value={form['profile.contract_type'] || ''} onChange={(e) => set('profile.contract_type', e.target.value)} required>
                    <option value="">اختر النوع</option>
                    <option value="salary">مرتب ثابت</option>
                    <option value="percentage">نسبة</option>
                  </select>
                </Field>
                <Field
                  label={form['profile.contract_type'] === 'percentage' ? 'النسبة (%)' : 'المرتب'}
                  name="profile.compensation"
                >
                  <input type="number" min="0" step="any" dir="ltr" className={`${inputClass} text-right`} value={form['profile.compensation'] || ''} onChange={(e) => set('profile.compensation', e.target.value)} required />
                </Field>
              </>
            )}

            {role === 'Student' && (
              <>
                <Field label="الصف الدراسي" name="profile.grade">
                  <input className={inputClass} value={form['profile.grade'] || ''} onChange={(e) => set('profile.grade', e.target.value)} required />
                </Field>
                <Field label="المدرسة" name="profile.school">
                  <input className={inputClass} value={form['profile.school'] || ''} onChange={(e) => set('profile.school', e.target.value)} />
                </Field>
                <Field label="الفرع" name="profile.branch_id">
                  <select className={inputClass} value={form['profile.branch_id'] || ''} onChange={(e) => set('profile.branch_id', e.target.value)} required>
                    <option value="">اختر الفرع</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </Field>
                <Field label="ولي الأمر" name="profile.parent_id">
                  <select className={inputClass} value={form['profile.parent_id'] || ''} onChange={(e) => set('profile.parent_id', e.target.value)}>
                    <option value="">بدون / يُضاف لاحقاً</option>
                    {parents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </Field>
              </>
            )}

            {['Admin', 'Reception', 'Accountant', 'Teacher Assistant'].includes(role) && (
              <Field label="الوظيفة" name="profile.job_title">
                <input className={inputClass} value={form['profile.job_title'] || ''} onChange={(e) => set('profile.job_title', e.target.value)} />
              </Field>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-60 px-4 py-3 text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span>{submitting ? 'جاري الإرسال...' : 'إرسال الدعوة'}</span>
            </button>
          </>
        )}
      </form>
    </Overlay>
  )
}

const Overlay: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
    <div
      className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
)
