import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
  Users,
  Plus,
  Loader2,
  AlertCircle,
  QrCode,
  Calendar,
  UserPlus,
  Clock,
  ArrowRight,
  CheckCircle,
  CreditCard
} from 'lucide-react'

interface Student {
  id: string
  user: { name: string; email: string }
  qr_code: string | null
  barcode: string | null
}

interface TimelineEvent {
  id: string
  event_type: string
  title: string
  description: string | null
  created_at: string
}

interface Group {
  id: string
  name: string
}

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Selection & Timeline
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loadingTimeline, setLoadingTimeline] = useState(false)

  // Registration Modal State
  const [showRegModal, setShowRegModal] = useState(false)
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regBarcode, setRegBarcode] = useState('')
  const [regQrCode, setRegQrCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Quick Group Assignment State
  const [selectedGroup, setSelectedGroup] = useState('')
  const [isEnrolling, setIsEnrolling] = useState(false)

  // Quick Renewal State
  const [isRenewing, setIsRenewing] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resStud, resGroups] = await Promise.all([
        api.get('/students'),
        api.get('/groups')
      ])
      setStudents(resStud.data.data)
      setGroups(resGroups.data.data)
    } catch (err: any) {
      setError('فشل في تحميل البيانات الأساسية')
    } finally {
      setLoading(false)
    }
  }

  const fetchTimeline = async (studentId: string) => {
    try {
      setLoadingTimeline(true)
      const res = await api.get(`/students/${studentId}/timeline`)
      setTimeline(res.data.data)
    } catch (err) {
      console.error('Failed to fetch student timeline', err)
    } finally {
      setLoadingTimeline(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student)
    setSuccess(null)
    setError(null)
    fetchTimeline(student.id)
  }

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.post('/students', {
        name: regName,
        email: regEmail,
        barcode: regBarcode || null,
        qr_code: regQrCode || null
      })
      setStudents((prev) => [res.data.data, ...prev])
      setRegName('')
      setRegEmail('')
      setRegBarcode('')
      setRegQrCode('')
      setShowRegModal(false)
      setSuccess('تم تسجيل الطالب الجديد ونشأ حسابه بنجاح!')
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تسجيل الطالب')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEnrollGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !selectedGroup) return
    setIsEnrolling(true)
    setError(null)
    setSuccess(null)
    try {
      await api.post(`/groups/${selectedGroup}/enroll`, {
        student_profile_ids: [selectedStudent.id]
      })
      setSuccess('تم تسجيل وإلحاق الطالب بالمجموعة المحددة بنجاح!')
      fetchTimeline(selectedStudent.id)
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل إلحاق الطالب بالمجموعة')
    } finally {
      setIsEnrolling(false)
      setSelectedGroup('')
    }
  }

  const handleQuickRenewal = async () => {
    if (!selectedStudent) return
    setIsRenewing(true)
    setError(null)
    setSuccess(null)
    try {
      // Fetch products to find the default subscription
      const prodRes = await api.get('/products')
      const subProduct = prodRes.data.data.find((p: any) => p.type === 'book' || p.selling_price)
      
      if (!subProduct) {
        throw new Error('لا توجد منتجات أو كورسات مضافة بالسيستم لتجديد الاشتراك بها.')
      }

      await api.post('/pos/checkout', {
        student_profile_id: selectedStudent.id,
        payment_method: 'cash',
        discount_amount: 0,
        items: [{ product_id: subProduct.id, quantity: 1 }]
      })

      // Add a manual timeline log for renewal
      await api.post('/students/timeline', {
        student_profile_id: selectedStudent.id,
        event_type: 'renewal',
        title: 'تجديد الاشتراك الشهري',
        description: `تم سداد اشتراك الحصص والكتب بقيمة ${subProduct.selling_price} ج بنجاح.`
      })

      setSuccess('تم تجديد اشتراك الطالب وتحصيل المبلغ بالخزينة فورا!')
      fetchTimeline(selectedStudent.id)
    } catch (err: any) {
      setError(err.message || err.response?.data?.message || 'فشل تجديد الاشتراك')
    } finally {
      setIsRenewing(false)
    }
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col p-8 overflow-y-auto relative" dir="rtl">
        <div className="absolute top-0 left-0 h-[250px] w-[250px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-900 pb-4">
          <div className="space-y-1 text-right">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">شؤون الطلاب والمشتركين</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">سجل الطلاب الجدد، تابع جداولهم الزمنية، وتجديد اشتراكاتهم بلمسة واحدة.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowRegModal(true)}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 cursor-pointer shadow-lg shadow-violet-600/10"
            >
              <Plus className="h-4 w-4" />
              <span>تسجيل طالب جديد</span>
            </button>
            <Link to="/dashboard" className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center">
              ← لوحة التحكم
            </Link>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-red-950/40 border border-red-500/30 p-4 text-sm text-red-200 mb-6 max-w-6xl text-right">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-4 text-sm text-emerald-200 mb-6 max-w-6xl text-right">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-7xl">
            {/* Student Registry Table */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 text-right">قائمة الطلاب الحالية</h2>
              
              {students.length === 0 ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-900 border-dashed p-12 text-center text-slate-500">
                  <Users className="h-10 w-10 mx-auto mb-4 text-slate-600 dark:text-slate-300" />
                  <p className="text-sm font-semibold">لا يوجد طلاب مسجلين بالسيستم حالياً.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 overflow-hidden">
                  <table className="w-full text-right border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/30 text-xs font-bold uppercase text-slate-500">
                        <th className="px-6 py-4">الاسم بالكامل</th>
                        <th className="px-6 py-4">البريد الإلكتروني</th>
                        <th className="px-6 py-4">الباركود</th>
                        <th className="px-6 py-4">كود QR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs">
                      {students.map((student) => (
                        <tr
                          key={student.id}
                          onClick={() => handleStudentSelect(student)}
                          className={`hover:bg-white dark:bg-slate-900/20 transition-all cursor-pointer ${
                            selectedStudent?.id === student.id ? 'bg-violet-600/10 border-r-2 border-violet-500' : ''
                          }`}
                        >
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{student.user.name}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{student.user.email}</td>
                          <td className="px-6 py-4 text-slate-500 font-mono">{student.barcode || 'لا يوجد'}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-violet-400 font-mono">
                              <QrCode className="h-3.5 w-3.5" />
                              {student.qr_code || 'بدون كود'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sidebar Details, Timeline, & Quick Actions */}
            <div className="space-y-6">
              {selectedStudent ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-6 space-y-6">
                  {/* Selected Profile Header */}
                  <div className="border-b border-slate-200 dark:border-slate-900 pb-4 text-right">
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{selectedStudent.user.name}</h3>
                    <p className="text-xs text-slate-500">{selectedStudent.user.email}</p>
                  </div>

                  {/* Quick Action: Assign Group */}
                  <form onSubmit={handleEnrollGroup} className="space-y-3">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block text-right">تسكين الطالب في مجموعة دراسية</label>
                    <div className="flex gap-2">
                      <select
                        required
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="flex-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-350 outline-none focus:border-violet-500 text-right"
                      >
                        <option value="">اختر المجموعة...</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                      <button
                        type="submit"
                        disabled={isEnrolling || !selectedGroup}
                        className="rounded-lg bg-violet-650 hover:bg-violet-500 text-xs font-semibold px-4 py-2 transition-all cursor-pointer text-white flex items-center justify-center gap-1.5"
                      >
                        {isEnrolling ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                        <span>تسكين</span>
                      </button>
                    </div>
                  </form>

                  {/* Quick Action: Renew Subscription */}
                  <div className="space-y-2 border-t border-slate-200 dark:border-slate-900 pt-4">
                    <button
                      onClick={handleQuickRenewal}
                      disabled={isRenewing}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-650 hover:bg-emerald-500 disabled:bg-emerald-950 text-white font-bold py-2.5 text-xs transition-all cursor-pointer shadow-lg shadow-emerald-600/10"
                    >
                      {isRenewing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CreditCard className="h-3.5 w-3.5" />
                      )}
                      <span>تجديد الاشتراك وتحصيل الحصص فوراً</span>
                    </button>
                  </div>

                  {/* Timeline Feed */}
                  <div className="border-t border-slate-200 dark:border-slate-900 pt-4 space-y-4">
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 text-right">الخط الزمني لحركات الطالب (Timeline)</h4>
                    
                    {loadingTimeline ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                      </div>
                    ) : timeline.length === 0 ? (
                      <p className="text-xs text-slate-600 dark:text-slate-300 text-center py-6">لا توجد حركات مسجلة للطالب بعد.</p>
                    ) : (
                      <div className="space-y-4 relative before:absolute before:inset-0 before:right-2 before:w-[1px] before:bg-white dark:bg-slate-900 pr-1">
                        {timeline.map((evt) => (
                          <div key={evt.id} className="relative pr-6 text-right">
                            {/* Timeline dot */}
                            <div className="absolute right-0.5 top-1.5 h-2 w-2 rounded-full border border-violet-500 bg-slate-50 dark:bg-slate-950"></div>
                            
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{evt.title}</p>
                              {evt.description && <p className="text-[10px] text-slate-500 leading-relaxed">{evt.description}</p>}
                              <p className="text-[9px] text-slate-600 dark:text-slate-300">{new Date(evt.created_at).toLocaleDateString('ar-EG')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-6 text-center text-slate-500">
                  <ArrowRight className="h-8 w-8 mx-auto mb-3 text-slate-650" />
                  <p className="text-xs font-semibold">اختر طالباً من الجدول لعرض خطه الزمني وإجراء المعاملات السريعة له.</p>
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
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">تسجيل طالب جديد بالاستقبال</h3>
              <p className="text-xs text-slate-500 mt-1">أدخل بيانات الطالب الأساسية لإنشاء ملف تعريفي وحساب خاص به.</p>
            </div>

            <form onSubmit={handleRegisterStudent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">الاسم بالكامل</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد محمد حسن"
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
                  placeholder="ahmed@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-violet-500 text-left font-mono"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">رقم الباركود (اختياري)</label>
                <input
                  type="text"
                  placeholder="اكتب أو امسح الباركود"
                  value={regBarcode}
                  onChange={(e) => setRegBarcode(e.target.value)}
                  className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-violet-500 text-right font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">كود QR الدخول (اختياري)</label>
                <input
                  type="text"
                  placeholder="اكتب كود الـ QR"
                  value={regQrCode}
                  onChange={(e) => setRegQrCode(e.target.value)}
                  className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm outline-none focus:border-violet-500 text-right font-mono"
                />
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
                  <span>حفظ الطالب</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
