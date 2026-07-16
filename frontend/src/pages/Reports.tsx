import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Loader2,
  AlertCircle,
  BarChart3
} from 'lucide-react'

interface LedgerEntry {
  id: string
  type: string
  amount: string
  category: string
  description: string
  created_at: string
}

interface Teacher {
  id: string
  commission_percentage: string
  user: { name: string }
}

export const Reports: React.FC = () => {
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Simulation constants for demo visualization
  const [simStudents, setSimStudents] = useState('120') // Simulated center-wide total students for reports calculation
  const [simPrice, setSimPrice] = useState('400')

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resLedger, resTeachers] = await Promise.all([
        api.get('/ledger'),
        api.get('/teachers')
      ])
      setLedger(resLedger.data.data)
      setTeachers(resTeachers.data.data)
    } catch (err: any) {
      setError('فشل في تحميل التقارير المالية')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Calculate real ledger stats
  const totalRevenue = ledger
    .filter((l) => l.type === 'credit')
    .reduce((sum, l) => sum + parseFloat(l.amount), 0)

  const totalExpenses = ledger
    .filter((l) => l.type === 'debit')
    .reduce((sum, l) => sum + parseFloat(l.amount), 0)

  // Calculate teacher commissions based on active students
  const studCount = parseInt(simStudents) || 0
  const priceVal = parseFloat(simPrice) || 0
  const totalCommRevenue = studCount * priceVal

  const calculatedTeacherCommissions = teachers.reduce((sum, t) => {
    const rate = parseFloat(t.commission_percentage) || 0
    // Split the center revenue among teachers for demonstration
    return sum + (totalCommRevenue * rate) / 100 / (teachers.length || 1)
  }, 0)

  const netProfit = totalRevenue - totalExpenses - calculatedTeacherCommissions

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col p-8 overflow-y-auto relative" dir="rtl">
        <div className="absolute top-0 left-0 h-[250px] w-[250px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-900 pb-4">
          <div className="space-y-1 text-right">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">التقارير المالية والأرباح</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">تابع حركة الخزنة، المصاريف الإدارية، مستحقات المعلمين، وصافي الربح للمركز.</p>
          </div>
          <Link to="/dashboard" className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center">
            ← لوحة التحكم
          </Link>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-red-950/40 border border-red-500/30 p-4 text-sm text-red-200 mb-6 max-w-6xl text-right">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="space-y-8 max-w-6xl">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Total Revenue */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 blur-xl"></div>
                <div className="flex justify-between items-start">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <span className="text-[10px] text-slate-500 font-bold">المحصل الفعلي</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">إجمالي الإيرادات (الدخل)</p>
                  <p className="text-xl font-black text-emerald-400 mt-1">{totalRevenue.toLocaleString('ar-EG')} ج</p>
                </div>
              </div>

              {/* Total Expenses */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-16 w-16 bg-red-500/5 blur-xl"></div>
                <div className="flex justify-between items-start">
                  <TrendingDown className="h-5 w-5 text-red-400" />
                  <span className="text-[10px] text-slate-500 font-bold">مصاريف التشغيل</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">المصاريف الإدارية</p>
                  <p className="text-xl font-black text-red-400 mt-1">{totalExpenses.toLocaleString('ar-EG')} ج</p>
                </div>
              </div>

              {/* Teacher Commissions */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-16 w-16 bg-violet-500/5 blur-xl"></div>
                <div className="flex justify-between items-start">
                  <Award className="h-5 w-5 text-violet-400" />
                  <span className="text-[10px] text-slate-500 font-bold">عمولات الحصص</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">مستحقات المدرسين</p>
                  <p className="text-xl font-black text-violet-400 mt-1">{calculatedTeacherCommissions.toLocaleString('ar-EG')} ج</p>
                </div>
              </div>

              {/* Net Profit */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-5 space-y-3 relative overflow-hidden border-violet-500/20 bg-violet-950/5">
                <div className="absolute top-0 right-0 h-16 w-16 bg-sky-500/10 blur-xl"></div>
                <div className="flex justify-between items-start">
                  <DollarSign className="h-5 w-5 text-sky-400" />
                  <span className="text-[10px] text-violet-400 font-bold">صافي أرباح المركز</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">الأرباح الصافية المتبقية</p>
                  <p className="text-xl font-black text-sky-400 mt-1">{netProfit.toLocaleString('ar-EG')} ج</p>
                </div>
              </div>
            </div>

            {/* Calculations and Breakdown Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Accounting Ledger Stream */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 text-right">كشف الحساب ودفتر اليومية للأنشطة</h3>
                
                <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 overflow-hidden">
                  <table className="w-full text-right border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/30 text-xs font-bold uppercase text-slate-500">
                        <th className="px-6 py-4">بيان الحركة</th>
                        <th className="px-6 py-4">التصنيف</th>
                        <th className="px-6 py-4">المبلغ</th>
                        <th className="px-6 py-4">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs">
                      {ledger.map((entry) => (
                        <tr key={entry.id} className="hover:bg-white dark:bg-slate-900/10 transition-all">
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{entry.description}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{entry.category === 'revenue' ? 'إيراد / تحصيل' : 'مصاريف تشغيل'}</td>
                          <td className={`px-6 py-4 font-bold ${entry.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {entry.type === 'credit' ? '+' : '-'}{parseFloat(entry.amount).toLocaleString('ar-EG')} ج
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-mono">{new Date(entry.created_at).toLocaleDateString('ar-EG')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Teacher Deserved Commissions Summary Card */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-6 space-y-6">
                <div className="border-b border-slate-200 dark:border-slate-900 pb-3 text-right">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-violet-400" />
                    <span>مستحقات المدرسين المفصلة</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">حسابات قائمة المدرسين ونسب عمولاتهم الحالية.</p>
                </div>

                <div className="space-y-4">
                  {teachers.map((t) => {
                    const rate = parseFloat(t.commission_percentage) || 0
                    const deserved = (totalCommRevenue * rate) / 100 / (teachers.length || 1)
                    return (
                      <div key={t.id} className="flex justify-between items-center text-xs border-b border-slate-200 dark:border-slate-900 pb-3 last:border-b-0 last:pb-0 text-right">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{t.user.name}</p>
                          <p className="text-[10px] text-slate-500">نسبة العمولة المحددة: %{rate.toFixed(0)}</p>
                        </div>
                        <span className="text-xs font-black text-violet-400" dir="ltr">+{deserved.toLocaleString('ar-EG')} ج</span>
                      </div>
                    )
                  })}
                </div>

                {/* Parameter Config Panel for Simulations */}
                <div className="border-t border-slate-200 dark:border-slate-900 pt-4 space-y-3">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block text-right">تغيير معايير احتساب عمولات المعلمين</label>
                  <div className="grid grid-cols-2 gap-2 text-right">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500">إجمالي طلاب السنتر</label>
                      <input
                        type="number"
                        value={simStudents}
                        onChange={(e) => setSimStudents(e.target.value)}
                        className="w-full rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 text-xs text-slate-250 text-right font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500">سعر كورس/اشتراك</label>
                      <input
                        type="number"
                        value={simPrice}
                        onChange={(e) => setSimPrice(e.target.value)}
                        className="w-full rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 text-xs text-slate-250 text-right font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
