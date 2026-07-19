import React, { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import { Loader2, Wallet, TrendingUp, HandCoins, Building2 } from 'lucide-react'

interface TeacherRow {
  teacher_profile_id: string
  teacher: string | null
  pending_amount: number
  settled_amount: number
  total_amount: number
  units_sold: number
  gross_sales: number
}

interface Summary {
  gross_sales: number
  teacher_share: number
  centre_share: number
  pending_payout: number
}

const money = (n: number) => `${Number(n).toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج`

export const TeacherEarnings: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/teacher-earnings')
      setTeachers(res.data.data.teachers)
      setSummary(res.data.data.summary)
    } catch {
      setNotice('تعذر تحميل مستحقات المدرسين.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const settle = async (row: TeacherRow) => {
    if (!confirm(`تصفية ${money(row.pending_amount)} للمدرس ${row.teacher}؟ سيُسجَّل كمصروف في الدفتر.`)) return
    setBusy(row.teacher_profile_id)
    try {
      const res = await api.post(`/teacher-earnings/${row.teacher_profile_id}/settle`)
      await load()
      setNotice(res.data.message)
      setTimeout(() => setNotice(null), 3000)
    } catch (err: any) {
      setNotice(err.response?.data?.message || 'تعذرت التصفية.')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
        عند بيع ملزمة أو مادة تخص مدرساً، تُحسب نسبته تلقائياً وتتراكم هنا كمستحق.
        التصفية تُسجَّل كمصروف في دفتر الحسابات.
      </p>

      {notice && (
        <div className="rounded-lg border border-violet-200 dark:border-violet-500/30 bg-violet-100 dark:bg-violet-600/10 p-3 text-xs text-violet-800 dark:text-violet-300">
          {notice}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="إجمالي المبيعات" value={money(summary.gross_sales)} Icon={TrendingUp} tone="text-slate-800 dark:text-slate-200" />
          <Stat label="نصيب المدرسين" value={money(summary.teacher_share)} Icon={HandCoins} tone="text-amber-700 dark:text-amber-400" />
          <Stat label="نصيب المركز" value={money(summary.centre_share)} Icon={Building2} tone="text-emerald-700 dark:text-emerald-400" />
          <Stat label="مستحقات لم تُصرف" value={money(summary.pending_payout)} Icon={Wallet} tone="text-violet-700 dark:text-violet-400" />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900">
        {teachers.length === 0 ? (
          <p className="p-12 text-center text-sm text-slate-500">
            لا توجد مبيعات لمواد المدرسين بعد. اربط صنفاً بمدرس من شاشة المخزون.
          </p>
        ) : (
          teachers.map((t) => (
            <div
              key={t.teacher_profile_id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 p-4 last:border-b-0"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.teacher}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  {t.units_sold} نسخة مباعة • إجمالي {money(t.gross_sales)}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-left">
                  <p className="text-sm font-black text-violet-700 dark:text-violet-400" dir="ltr">
                    {money(t.pending_amount)}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    مستحق {t.settled_amount > 0 ? `• صُرف ${money(t.settled_amount)}` : ''}
                  </p>
                </div>

                <button
                  onClick={() => settle(t)}
                  disabled={t.pending_amount <= 0 || busy === t.teacher_profile_id}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-3 py-2 text-xs font-semibold text-white transition-colors shrink-0"
                >
                  {busy === t.teacher_profile_id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Wallet className="h-3.5 w-3.5" />}
                  تصفية
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const Stat: React.FC<{ label: string; value: string; Icon: any; tone: string }> = ({ label, value, Icon, tone }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900 p-4">
    <div className="flex items-center gap-2">
      <Icon className={`h-3.5 w-3.5 ${tone}`} />
      <p className="text-[11px] text-slate-600 dark:text-slate-400">{label}</p>
    </div>
    <p className={`mt-1 text-lg font-black ${tone}`} dir="ltr">{value}</p>
  </div>
)
