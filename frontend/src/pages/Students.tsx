import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { Users, Loader2, AlertCircle, QrCode } from 'lucide-react'

interface Student {
  id: string
  user: { name: string; email: string }
  qr_code: string | null
  barcode: string | null
}

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const res = await api.get('/students')
      setStudents(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحميل قائمة الطلاب')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 h-[250px] w-[250px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none"></div>

        {/* Page Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-900 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">إدارة الطلاب والمشتركين</h1>
            <p className="text-sm text-slate-400">تابع ملفات الطلاب المسجلين، وأكواد التحقق الخاصة بهم داخل المركز.</p>
          </div>
          <Link to="/dashboard" className="text-xs font-semibold text-violet-400 hover:text-violet-300">
            ← العودة للوحة التحكم
          </Link>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-red-950/40 border border-red-500/30 p-4 text-sm text-red-200 mb-6 max-w-4xl">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="max-w-4xl w-full space-y-4">
          <h2 className="text-lg font-bold text-slate-300">قائمة الطلاب الحالية</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
          ) : students.length === 0 ? (
            <div className="rounded-xl border border-slate-900 border-dashed p-12 text-center text-slate-500">
              <Users className="h-10 w-10 mx-auto mb-4 text-slate-600" />
              <p className="text-sm font-semibold">لا يوجد طلاب مسجلين حالياً في هذا الفرع.</p>
              <p className="text-xs text-slate-600 mt-1">يمكنك تسجيل طالب جديد من المجموعات الدراسية أو كاشير البيع.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-900 bg-slate-950/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm" dir="rtl">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-900/30 text-xs font-bold uppercase text-slate-500 text-right">
                      <th className="px-6 py-4">اسم الطالب</th>
                      <th className="px-6 py-4">البريد الإلكتروني</th>
                      <th className="px-6 py-4">كود الباركود (Barcode)</th>
                      <th className="px-6 py-4">كود QR الدخول</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-xs text-right">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-900/10 transition-all">
                        <td className="px-6 py-4 font-bold text-slate-200">{student.user.name}</td>
                        <td className="px-6 py-4 text-slate-400">{student.user.email}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono" dir="ltr">{student.barcode || 'غير متوفر'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-violet-400 font-mono">
                            <QrCode className="h-4 w-4 text-violet-500" />
                            <span>{student.qr_code || 'بدون كود'}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
