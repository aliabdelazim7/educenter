import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  CheckSquare,
  Loader2,
  AlertCircle,
  Save,
  ArrowLeft,
  Info,
  Search,
  Check,
  X,
  Sparkles
} from 'lucide-react'

interface Student {
  id: string
  user: { name: string; email: string }
  barcode: string | null
  qr_code: string | null
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
    status: 'present' | 'absent'
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
  
  // Search query to filter student checklist
  const [studentFilter, setStudentFilter] = useState('')
  const [scanQuery, setScanQuery] = useState('')
  const [scanSuccessMsg, setScanSuccessMsg] = useState<string | null>(null)

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

        // Initialize state map (default all to 'present' so it's pre-filled, or 'absent' as they prefer. Let's default all to present and let them uncheck absents, or default all to absent and they check presents. Let's default to present as it's the most common case)
        const initialAttendance: AttendanceState = {}
        studentsData.forEach((student: Student) => {
          const matchedRecord = existingData.find(
            (r: any) => r.student_profile_id === student.id
          )

          initialAttendance[student.id] = {
            status: matchedRecord ? (matchedRecord.status === 'present' ? 'present' : 'absent') : 'present',
            remarks: matchedRecord ? (matchedRecord.remarks || '') : '',
          }
        })
        
        setAttendance(initialAttendance)
      } catch (err: any) {
        setError(err.response?.data?.message || 'فشل في تحميل كشف الحضور والغياب')
      } finally {
        setLoading(false)
      }
    }

    loadBoardData()
  }, [sessionId])

  const toggleStudentAttendance = (studentId: string) => {
    setAttendance((prev) => {
      const current = prev[studentId] || { status: 'absent', remarks: '' }
      const newStatus = current.status === 'present' ? 'absent' : 'present'
      return {
        ...prev,
        [studentId]: {
          ...current,
          status: newStatus
        }
      }
    })
  }

  const markAllPresent = () => {
    setAttendance((prev) => {
      const updated = { ...prev }
      students.forEach(s => {
        updated[s.id] = { ...updated[s.id], status: 'present' }
      })
      return updated
    })
  }

  const markAllAbsent = () => {
    setAttendance((prev) => {
      const updated = { ...prev }
      students.forEach(s => {
        updated[s.id] = { ...updated[s.id], status: 'absent' }
      })
      return updated
    })
  }

  const handleScanAttendance = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanQuery) return
    setError(null)
    setScanSuccessMsg(null)

    // Find student in our students list by barcode or qr_code
    const matched = students.find(s => s.barcode === scanQuery || s.qr_code === scanQuery)
    if (matched) {
      setAttendance(prev => ({
        ...prev,
        [matched.id]: {
          ...prev[matched.id],
          status: 'present'
        }
      }))
      setScanSuccessMsg(`تم تحضير الطالب: ${matched.user.name} بنجاح!`)
      setTimeout(() => setScanSuccessMsg(null), 3000)
    } else {
      setError('لم يتم العثور على طالب بهذا الكود في هذه المجموعة.')
      setTimeout(() => setError(null), 4000)
    }
    setScanQuery('')
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
      navigate('/dashboard') // Redirect to dashboard after saving attendance
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في حفظ سجل الحضور والغياب')
    } finally {
      setSaving(false)
    }
  }

  // Filter students based on search input
  const filteredStudents = students.filter(s =>
    s.user.name.toLowerCase().includes(studentFilter.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
          <p className="text-sm text-slate-600 dark:text-slate-400 font-bold">جاري تحميل قائمة حضور الفصل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col p-8 overflow-y-auto relative" dir="rtl text-right">
        <div className="absolute top-0 left-0 h-[250px] w-[250px] rounded-full bg-violet-100 dark:bg-violet-600/5 blur-[80px] pointer-events-none"></div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-6 mb-8 text-right" dir="rtl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="h-9 w-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
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
            className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-450 dark:disabled:text-slate-600 px-6 py-2.5 font-semibold text-white transition-all cursor-pointer shadow-lg shadow-violet-600/10 shrink-0 text-sm"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>حفظ كشف الغياب والحضور</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 p-4 text-sm text-red-700 dark:text-red-200 mb-6 max-w-5xl text-right" dir="rtl">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-700 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {scanSuccessMsg && (
          <div className="flex items-center gap-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 p-4 text-sm text-emerald-700 dark:text-emerald-355 mb-6 max-w-5xl text-right animate-pulse" dir="rtl">
            <Check className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <span>{scanSuccessMsg}</span>
          </div>
        )}

        {/* Quick Toolbar for taking attendance */}
        {students.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 max-w-5xl" dir="rtl">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="ابحث باسم الطالب..."
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 pr-9 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-violet-500 text-right"
                />
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>

              {/* Barcode/QR Scanner Input */}
              <form onSubmit={handleScanAttendance} className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="امسح كود الكارنيه (QR) للتحضير..."
                  value={scanQuery}
                  onChange={(e) => setScanQuery(e.target.value)}
                  className="w-full rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/40 px-4 py-2 pr-9 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-violet-500 text-right font-mono"
                />
                <Sparkles className="absolute right-3 top-2.5 h-4 w-4 text-violet-500 animate-pulse" />
              </form>
            </div>

            {/* Quick Toggle Selectors */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={markAllPresent}
                className="px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 hover:bg-emerald-500/20 text-xs font-semibold cursor-pointer transition-all"
              >
                تحديد الكل كحاضر ✓
              </button>
              <button
                type="button"
                onClick={markAllAbsent}
                className="px-3 py-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 hover:bg-red-500/20 text-xs font-semibold cursor-pointer transition-all"
              >
                تحديد الكل كغائب ✕
              </button>
            </div>
          </div>
        )}d-650 dark:text-red-400 hover:bg-red-500/20 text-xs font-semibold cursor-pointer transition-all"
              >
                تحديد الكل كغائب ✕
              </button>
            </div>
          </div>
        )}

        {/* Attendance Checklist Grid */}
        <div className="max-w-5xl w-full text-right" dir="rtl">
          {students.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-900 border-dashed p-12 text-center text-slate-500">
              <Info className="h-10 w-10 mx-auto mb-4 text-slate-450 dark:text-slate-650" />
              <p className="text-sm font-semibold">لا يوجد طلاب مسجلين في هذه المجموعة حالياً.</p>
              <p className="text-xs text-slate-500 mt-1">يرجى تسكين الطلاب في المجموعة الدراسية لتتمكن من أخذ الحضور والغياب.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => {
                const record = attendance[student.id] || { status: 'absent', remarks: '' }
                const isPresent = record.status === 'present'

                return (
                  <div
                    key={student.id}
                    onClick={() => toggleStudentAttendance(student.id)}
                    className={`rounded-xl border p-4 transition-all duration-300 cursor-pointer flex flex-col justify-between relative select-none ${
                      isPresent
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                        : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Checkbox indicator */}
                    <div className="flex justify-between items-center mb-3">
                      <div className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${
                        isPresent
                          ? 'bg-emerald-550 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-transparent'
                      }`}>
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        isPresent ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-650 dark:text-red-400'
                      }`}>
                        {isPresent ? 'حاضر ✓' : 'غائب ✕'}
                      </span>
                    </div>

                    {/* Student Name */}
                    <div className="space-y-0.5 text-right">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{student.user.name}</p>
                      <p className="text-[10px] text-slate-500">{student.user.email}</p>
                    </div>

                    {/* Optional Remarks (Clicking input shouldn't toggle card state) */}
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-900/60" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        placeholder="أضف ملاحظة (مثال: متأخر 15 د)..."
                        value={record.remarks}
                        onChange={(e) => {
                          setAttendance(prev => ({
                            ...prev,
                            [student.id]: {
                              ...prev[student.id],
                              remarks: e.target.value
                            }
                          }))
                        }}
                        className="w-full rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 px-2.5 py-1 text-[10px] text-slate-800 dark:text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500 text-right"
                      />
                    </div>
                  </div>
                )
              })}

              {filteredStudents.length === 0 && (
                <div className="col-span-full py-8 text-center text-xs text-slate-500">
                  لا يوجد طلاب يطابقون اسم البحث.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
