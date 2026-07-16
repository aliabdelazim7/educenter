import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
  Award,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Coins,
  Percent,
  TrendingUp,
  UserPlus
} from 'lucide-react'

interface Teacher {
  id: string
  commission_percentage: string
  user: { name: string; email: string }
}

export const Teachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Selection & Calculator State
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [calcStudents, setCalcStudents] = useState('50')
  const [calcPrice, setCalcPrice] = useState('400')

  // Registration Modal State
  const [showRegModal, setShowRegModal] = useState(false)
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regComm, setRegComm] = useState('40')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/teachers')
      setTeachers(res.data.data)
    } catch (err: any) {
      setError('فشل في تحميل قائمة المدرسين')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  const handleRegisterTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.post('/teachers', {
        name: regName,
        email: regEmail,
        commission_percentage: parseFloat(regComm)
      })
      setTeachers((prev) => [res.data.data, ...prev])
      setRegName('')
      setRegEmail('')
      setRegComm('40')
      setShowRegModal(false)
      setSuccess('تم تسجيل المدرس الجديد بنجاح ونشأ حسابه بالسيستم!')
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تسجيل المدرس')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTeacherSelect = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setSuccess(null)
    setError(null)
  }

  // Calculator computations
  const studCount = parseInt(calcStudents) || 0
  const priceVal = parseFloat(calcPrice) || 0
  const totalRevenue = studCount * priceVal
  const commPercentage = selectedTeacher ? parseFloat(selectedTeacher.commission_percentage) : 0
  const teacherShare = (totalRevenue * commPercentage) / 100
  const centerShare = totalRevenue - teacherShare

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col p-8 overflow-y-auto relative" dir="rtl">
        <div className="absolute top-0 left-0 h-[250px] w-[250px] rounded-full bg-violet-100 dark:bg-violet-600/5 blur-[80px] pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-900 pb-4">
          <div className="space-y-1 text-right">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">إدارة المدرسين والرواتب والعمولات</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">سجل المدرسين الجدد، اضبط نسب العمولات لكل مدرس، وراجع الإيرادات والأرباح تلقائياً.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowRegModal(true)}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 cursor-pointer shadow-lg shadow-violet-600/10"
            >
              <Plus className="h-4 w-4" />
              <span>تسجيل مدرس جديد</span>
            </button>
            <Link to="/dashboard" className="text-xs font-semibold text-violet-700 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center">
              ← لوحة التحكم
            </Link>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 p-4 text-sm text-red-200 mb-6 max-w-6xl text-right">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-700 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 p-4 text-sm text-emerald-200 mb-6 max-w-6xl text-right">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-7xl">
            {/* Teachers Registry Table */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 text-right">قائمة المدرسين الحالية</h2>
              
              {teachers.length === 0 ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-900 border-dashed p-12 text-center text-slate-500">
                  <Award className="h-10 w-10 mx-auto mb-4 text-slate-600 dark:text-slate-300" />
                  <p className="text-sm font-semibold">لا يوجد مدرسين مسجلين بالسيستم حالياً.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 overflow-hidden">
                  <table className="w-full text-right border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/30 text-xs font-bold uppercase text-slate-500">
                        <th className="px-6 py-4">اسم المدرس</th>
                        <th className="px-6 py-4">البريد الإلكتروني</th>
                        <th className="px-6 py-4">حالة الحساب</th>
                        <th className="px-6 py-4">نسبة العمولة (المركز / المدرس)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs">
                      {teachers.map((teacher) => (
                        <tr
                          key={teacher.id}
                          onClick={() => handleTeacherSelect(teacher)}
                          className={`hover:bg-white dark:bg-slate-900/20 transition-all cursor-pointer ${
                            selectedTeacher?.id === teacher.id ? 'bg-violet-100 dark:bg-violet-600/10 border-r-2 border-violet-500' : ''
                          }`}
                        >
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{teacher.user.name}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{teacher.user.email}</td>
                          <td className="px-6 py-4">
                            <span className="inline-block text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 px-2 py-0.5 rounded-full">
                              نشط
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-700 dark:text-slate-300">%{parseFloat(teacher.commission_percentage).toFixed(0)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Visual Calculator Sidebar */}
            <div className="space-y-6">
              {selectedTeacher ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-6 space-y-6">
                  {/* Selected Profile Header */}
                  <div className="border-b border-slate-200 dark:border-slate-900 pb-4 text-right">
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{selectedTeacher.user.name}</h3>
                    <p className="text-xs text-slate-500">نسبة العمولة المحددة: %{parseFloat(selectedTeacher.commission_percentage).toFixed(0)}</p>
                  </div>

                  {/* Calculator Input Fields */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-right">
                      <Coins className="h-4 w-4 text-violet-700 dark:text-violet-400" />
                      <span>محاسبة مستحقات المدرس التلقائية</span>
                    </h4>

                    <div className="space-y-3">
                      <div className="space-y-1 text-right">
                        <label className="text-[11px] text-slate-600 dark:text-slate-400">عدد الطلاب في المجموعة</label>
                        <input
                          type="number"
                          value={calcStudents}
                          onChange={(e) => setCalcStudents(e.target.value)}
                          className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-violet-500 text-right"
                        />
                      </div>

                      <div className="space-y-1 text-right">
                        <label className="text-[11px] text-slate-600 dark:text-slate-400">سعر الاشتراك الشهري (جنيه)</label>
                        <input
                          type="number"
                          value={calcPrice}
                          onChange={(e) => setCalcPrice(e.target.value)}
                          className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-violet-500 text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Visual Split Outputs */}
                  <div className="border-t border-slate-200 dark:border-slate-900 pt-4 space-y-4">
                    <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                      <span>إجمالي الإيرادات المتوقعة</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{totalRevenue.toLocaleString('ar-EG')} جنيه</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-violet-700 dark:text-violet-400">نصيب المدرس ({commPercentage}%)</span>
                        <span className="text-emerald-700 dark:text-emerald-400">نصيب المركز ({100 - commPercentage}%)</span>
                      </div>

                      {/* Stacked Progress Bar */}
                      <div className="h-3 w-full rounded-full bg-white dark:bg-slate-900 overflow-hidden flex">
                        <div
                          style={{ width: `${commPercentage}%` }}
                          className="h-full bg-violet-600 transition-all duration-300"
                          title={`مستحقات المدرس: ${teacherShare} ج`}
                        ></div>
                        <div
                          style={{ width: `${100 - commPercentage}%` }}
                          className="h-full bg-emerald-600 transition-all duration-300"
                          title={`نصيب المركز: ${centerShare} ج`}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center pt-2">
                      <div className="bg-violet-100 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/40 rounded-lg p-3">
                        <p className="text-[10px] text-slate-500">مستحقات المدرس</p>
                        <p className="text-sm font-black text-violet-700 dark:text-violet-400 mt-1">{teacherShare.toLocaleString('ar-EG')} ج</p>
                      </div>
                      <div className="bg-emerald-100 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg p-3">
                        <p className="text-[10px] text-slate-500">صافي للمركز</p>
                        <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 mt-1">{centerShare.toLocaleString('ar-EG')} ج</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-6 text-center text-slate-500">
                  <TrendingUp className="h-8 w-8 mx-auto mb-3 text-slate-650" />
                  <p className="text-xs font-semibold">اختر مدرساً من الجدول لعرض وتصفح حاسبة الرواتب والعمولات الخاصة به.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal Dialog */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 p-6 max-w-md w-full space-y-6 text-right" dir="rtl">
            <div className="border-b border-slate-200 dark:border-slate-900 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">تسجيل مدرس جديد بالمركز</h3>
              <p className="text-xs text-slate-500 mt-1">أدخل بيانات المدرس لإنشاء حسابه وضبط عمولته التلقائية.</p>
            </div>

            <form onSubmit={handleRegisterTeacher} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">اسم المدرس بالكامل</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مستر أحمد محمد"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-violet-500 text-right"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  placeholder="teacher@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-violet-500 text-left font-mono"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">نسبة عمولة المدرس (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    placeholder="مثال: 40"
                    value={regComm}
                    onChange={(e) => setRegComm(e.target.value)}
                    className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-violet-500 text-right pr-8"
                  />
                  <Percent className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 text-xs font-semibold px-4 py-2 transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold px-6 py-2 transition-all cursor-pointer text-white flex items-center justify-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>حفظ المدرس</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
