import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { Award, Loader2, AlertCircle, Calendar } from 'lucide-react'

interface Teacher {
  id: string
  user: { name: string; email: string }
}

export const Teachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/teachers')
      setTeachers(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحميل قائمة المدرسين')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 h-[250px] w-[250px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none"></div>

        {/* Page Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-900 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">إدارة المدرسين والرواتب</h1>
            <p className="text-sm text-slate-400">تابع ملفات المدرسين وأعضاء هيئة التدريس المسجلين في فروع المركز.</p>
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
          <h2 className="text-lg font-bold text-slate-300">هيئة التدريس الحالية</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
          ) : teachers.length === 0 ? (
            <div className="rounded-xl border border-slate-900 border-dashed p-12 text-center text-slate-500">
              <Award className="h-10 w-10 mx-auto mb-4 text-slate-600" />
              <p className="text-sm font-semibold">لا يوجد مدرسين مسجلين حالياً.</p>
              <p className="text-xs text-slate-600 mt-1">يرجى تسجيل المدرسين كأعضاء جدد بالمركز لتتمكن من إسناد الفصول والمجموعات إليهم.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-900 bg-slate-950/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm" dir="rtl">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-900/30 text-xs font-bold uppercase text-slate-500 text-right">
                      <th className="px-6 py-4">اسم المدرس</th>
                      <th className="px-6 py-4">البريد الإلكتروني</th>
                      <th className="px-6 py-4">الصفة الوظيفية</th>
                      <th className="px-6 py-4">حالة الحساب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-xs text-right">
                    {teachers.map((teacher) => (
                      <tr key={teacher.id} className="hover:bg-slate-900/10 transition-all">
                        <td className="px-6 py-4 font-bold text-slate-200">{teacher.user.name}</td>
                        <td className="px-6 py-4 text-slate-400">{teacher.user.email}</td>
                        <td className="px-6 py-4 text-slate-500">مدرس معتمد</td>
                        <td className="px-6 py-4">
                          <span className="inline-block text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-2 py-0.5 rounded-full">
                            نشط
                          </span>
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
