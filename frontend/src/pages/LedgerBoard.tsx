import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Plus,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface LedgerEntry {
  id: string
  type: 'debit' | 'credit'
  amount: string
  category: string
  description: string
  created_at: string
}

interface Summary {
  total_revenue: number
  total_expenses: number
  net_profit: number
}

export const LedgerBoard: React.FC = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [summary, setSummary] = useState<Summary>({ total_revenue: 0, total_expenses: 0, net_profit: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Expense form states
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('utility')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/ledger')
      setEntries(res.data.data)
      setSummary(res.data.summary)
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحميل حركة الحسابات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await api.post('/expenses', {
        amount: parseFloat(amount),
        category,
        description,
        expense_date: new Date().toISOString().split('T')[0]
      })
      setAmount('')
      setDescription('')
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تسجيل حركة الصرف')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCategoryArabicName = (cat: string) => {
    switch (cat) {
      case 'rent': return 'إيجار المقر'
      case 'salaries': return 'مرتبات المدرسين'
      case 'utility': return 'فواتير وخدمات (كهرباء/مياه/نت)'
      case 'marketing': return 'تسويق وإعلانات'
      case 'books': return 'شراء كتب ومستلزمات'
      default: return 'مصاريف تشغيلية أخرى'
    }
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 h-[250px] w-[250px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none"></div>

        {/* Page Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-900 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">دفتر الحسابات وحركة الخزنة</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">راقب التدفقات النقدية والأرباح، وسجل المصاريف التشغيلية للمركز اليومية.</p>
          </div>
          <Link to="/dashboard" className="text-xs font-semibold text-violet-400 hover:text-violet-300">
            ← العودة للوحة التحكم
          </Link>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-red-950/40 border border-red-500/30 p-4 text-sm text-red-200 mb-6 max-w-5xl">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl">
          <div className="relative rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-5 hover:border-slate-200 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">إجمالي الإيرادات</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-2">{summary.total_revenue.toLocaleString('ar-EG')} جنيه</p>
          </div>

          <div className="relative rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-5 hover:border-slate-200 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">إجمالي المصاريف</span>
              <TrendingDown className="h-4 w-4 text-red-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-2">{summary.total_expenses.toLocaleString('ar-EG')} جنيه</p>
          </div>

          <div className="relative rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-5 hover:border-slate-200 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">صافي الأرباح / الخزنة</span>
              <DollarSign className="h-4 w-4 text-violet-400" />
            </div>
            <p className={`text-2xl font-black mt-2 ${summary.net_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {summary.net_profit.toLocaleString('ar-EG')} جنيه
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-5xl">
          {/* Ledger Table */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">حركات الخزينة الأخيرة</h2>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            ) : entries.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-900 border-dashed p-12 text-center text-slate-500">
                <Activity className="h-10 w-10 mx-auto mb-4 text-slate-600 dark:text-slate-300" />
                <p className="text-sm font-semibold">لا توجد أي حركات في الخزينة بعد.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 overflow-hidden">
                <table className="w-full text-right border-collapse text-sm" dir="rtl">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/30 text-xs font-bold uppercase text-slate-500 text-right">
                      <th className="px-5 py-3">البيان / الوصف</th>
                      <th className="px-5 py-3">التصنيف</th>
                      <th className="px-5 py-3 text-left">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-xs text-right">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-white dark:bg-slate-900/10 transition-all">
                        <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">{entry.description}</td>
                        <td className="px-5 py-3 text-slate-500">{getCategoryArabicName(entry.category)}</td>
                        <td className={`px-5 py-3 text-left font-bold ${entry.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`} dir="ltr">
                          {entry.type === 'credit' ? '+' : '-'}{parseFloat(entry.amount).toLocaleString('ar-EG')} ج
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Record Expense Form */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">سجل مصاريف جديدة</h2>

            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="expAmount" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">قيمة المبلغ المصروف</label>
                <div className="relative flex items-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-violet-500/50 transition-all">
                  <span className="absolute right-3 text-sm font-semibold text-slate-500">جنيه</span>
                  <input
                    id="expAmount"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent pr-16 pl-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none text-right"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="expCategory" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">التصنيف</label>
                <select
                  id="expCategory"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-violet-500/50 transition-all text-right"
                >
                  <option value="rent">إيجار المقر / الفرع</option>
                  <option value="salaries">مرتبات المدرسين والمساعدين</option>
                  <option value="utility">فواتير الخدمات (كهرباء/مياه/نت)</option>
                  <option value="marketing">التسويق والإعلانات</option>
                  <option value="other">مصاريف تشغيلية أخرى</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="expDesc" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">البيان / الوصف</label>
                <textarea
                  id="expDesc"
                  required
                  placeholder="مثال: دفع فاتورة كهرباء فرع وسط البلد"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 transition-all resize-none text-right"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:bg-violet-800 transition-all cursor-pointer shadow-lg shadow-violet-600/10"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>تسجيل حركة الصرف</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
