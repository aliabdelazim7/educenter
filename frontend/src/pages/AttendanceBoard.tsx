import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { CheckSquare, Loader2, AlertCircle, Save, ArrowLeft, Info } from 'lucide-react'

interface Student {
  id: string
  user: { name: string; email: string }
}

interface Session {
  id: string
  date: string
  start_time: string
  end_time: string
  group_id: string
  group: { name: string; subject: { name: string } }
}

interface AttendanceState {
  [studentId: string]: {
    status: 'present' | 'absent' | 'late' | 'excused'
    remarks: string
  }
}

export const AttendanceBoard: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [session, setSession] = useState<Session | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<AttendanceState>({})

  useEffect(() => {
    const loadBoardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Fetch Session details
        const sessionRes = await api.get(`/academic-sessions/${sessionId}`)
        const sessionData = sessionRes.data.data
        setSession(sessionData)

        // 2. Fetch Group Students
        const studentsRes = await api.get(`/groups/${sessionData.group_id}/students`)
        const studentsData = studentsRes.data.data
        setStudents(studentsData)

        // 3. Fetch Existing Attendance
        const existingRes = await api.get(`/academic-sessions/${sessionId}/attendance`)
        const existingData = existingRes.data.data

        // Initialize state map
        const initialAttendance: AttendanceState = {}
        
        // Seed from existing database records if they exist
        studentsData.forEach((student: Student) => {
          const matchedRecord = existingData.find(
            (r: any) => r.student_profile_id === student.id
          )

          initialAttendance[student.id] = {
            status: matchedRecord ? matchedRecord.status : 'present', // default to 'present'
            remarks: matchedRecord ? (matchedRecord.remarks || '') : '',
          }
        })
        
        setAttendance(initialAttendance)
      } catch (err: any) {
        setError(err.response?.data?.message || 'فشل في تحميل لوحة الحضور')
      } finally {
        setLoading(false)
      }
    }

    loadBoardData()
  }, [sessionId])

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }))
  }

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const records = Object.entries(attendance).map(([studentId, data]) => ({
        student_profile_id: studentId,
        status: data.status,
        remarks: data.remarks || null,
      }))

      await api.post(`/academic-sessions/${sessionId}/attendance`, { records })
      navigate('/academic')
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في حفظ سجل الحضور والغياب')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
          <p className="text-sm text-slate-600 dark:text-slate-400">جاري تحميل سجل حضور الفصل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col p-8 overflow-y-auto relative">
        <div className="absolute top-0 right-0 h-[250px] w-[250px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none"></div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/academic')}
              className="h-9 w-9 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">حضور وغياب مجموعة: {session?.group.name}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                المادة: {session?.group.subject.name} • تاريخ الحصة: {session?.date} (من {session?.start_time} إلى {session?.end_time})
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:text-slate-600 dark:text-slate-400 px-4 py-2.5 font-semibold text-white transition-all cursor-pointer shadow-lg shadow-violet-600/10 shrink-0"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>حفظ كشف الحضور</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-red-950/40 border border-red-500/30 p-4 text-sm text-red-200 mb-6 max-w-4xl">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Student List Grid */}
        <div className="max-w-5xl w-full">
          {students.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-900 border-dashed p-12 text-center text-slate-500">
              <Info className="h-10 w-10 mx-auto mb-4 text-slate-600 dark:text-slate-300" />
              <p className="text-sm font-semibold">لا يوجد طلاب مسجلين في هذه المجموعة حالياً.</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">يرجى تسجيل الطلاب في المجموعة الدراسية أولاً لتتمكن من أخذ الحضور.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" dir="rtl">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/30 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">
                      <th className="px-6 py-4">اسم الطالب</th>
                      <th className="px-6 py-4">حالة الحضور</th>
                      <th className="px-6 py-4">ملاحظات إضافية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-sm text-right">
                    {students.map((student) => {
                      const record = attendance[student.id] || { status: 'present', remarks: '' }
                      return (
                        <tr key={student.id} className="hover:bg-slate-50 dark:bg-slate-900/20 transition-all">
                          {/* Student Details */}
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{student.user.name}</p>
                            <p className="text-xs text-slate-500">{student.user.email}</p>
                          </td>

                          {/* Status Options */}
                          <td className="px-6 py-4">
                            <div className="inline-flex rounded-lg bg-slate-50 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800/80">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'present')}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                  record.status === 'present'
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                حاضر
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'absent')}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                  record.status === 'absent'
                                    ? 'bg-red-500 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                غائب
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'late')}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                  record.status === 'late'
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                متأخر
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'excused')}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                  record.status === 'excused'
                                    ? 'bg-slate-200 dark:bg-slate-700 text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                غياب بإذن
                              </button>
                            </div>
                          </td>

                          {/* Remarks */}
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              placeholder="أضف ملاحظة..."
                              value={record.remarks}
                              onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                              className="w-full max-w-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 transition-all text-right"
                            />
                          </td>
                        </tr>
                      )
                    })}
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
