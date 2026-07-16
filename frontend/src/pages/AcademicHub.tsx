import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import {
  Calendar,
  Layers,
  Plus,
  Loader2,
  AlertCircle,
  Clock,
  User,
  BookOpen,
  MapPin,
  CheckSquare
} from 'lucide-react'

interface AcademicYear {
  id: string
  name: string
  status: string
}

interface Group {
  id: string
  name: string
  branch: { name: string }
  academic_year: { name: string }
  subject: { name: string }
  grade: { name: string }
  teacher_profile?: { user: { name: string } }
}

interface AcademicSession {
  id: string
  date: string
  start_time: string
  end_time: string
  status: string
  group: { name: string; subject: { name: string }; grade: { name: string } }
  classroom?: { name: string }
  teacher_profile?: { user: { name: string } }
}

export const AcademicHub: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'years' | 'groups' | 'sessions'>('years')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data states
  const [years, setYears] = useState<AcademicYear[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [sessions, setSessions] = useState<AcademicSession[]>([])

  // Lookup dependencies
  const [branches, setBranches] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])

  // Modal / Form States
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newYearName, setNewYearName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // New Group States
  const [newGroupName, setNewGroupName] = useState('')
  const [selBranch, setSelBranch] = useState('')
  const [selYear, setSelYear] = useState('')
  const [selSubject, setSelSubject] = useState('')
  const [selGrade, setSelGrade] = useState('')
  const [selTeacher, setSelTeacher] = useState('')

  // New Session States
  const [selGroup, setSelGroup] = useState('')
  const [selClassroom, setSelClassroom] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const fetchDependencies = async () => {
    try {
      const [b, s, g, t] = await Promise.all([
        api.get('/branches').catch(() => ({ data: { data: [] } })),
        api.get('/subjects').catch(() => ({ data: { data: [] } })),
        api.get('/grades').catch(() => ({ data: { data: [] } })),
        api.get('/teachers').catch(() => ({ data: { data: [] } })),
      ])
      setBranches(b.data.data)
      setSubjects(s.data.data.length ? s.data.data : [{ id: 'mock-s1', name: 'الرياضيات' }, { id: 'mock-s2', name: 'العلوم العامة' }])
      setGrades(g.data.data.length ? g.data.data : [{ id: 'mock-g1', name: 'الصف الأول الثانوي' }, { id: 'mock-g2', name: 'الصف الثاني الثانوي' }])
      setTeachers(t.data.data.length ? t.data.data : [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (activeTab === 'years') {
        const res = await api.get('/academic-years')
        setYears(res.data.data)
      } else if (activeTab === 'groups') {
        const res = await api.get('/groups')
        setGroups(res.data.data)
      } else if (activeTab === 'sessions') {
        const res = await api.get('/academic-sessions')
        setSessions(res.data.data)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDependencies()
  }, [])

  useEffect(() => {
    fetchData()
  }, [activeTab])

  // Handle Academic Year Submit
  const handleYearSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await api.post('/academic-years', {
        name: newYearName,
        start_date: startDate,
        end_date: endDate,
        status: 'نشط'
      })
      setNewYearName('')
      setStartDate('')
      setEndDate('')
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في إضافة السنة الدراسية')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Group Submit
  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await api.post('/groups', {
        name: newGroupName,
        branch_id: selBranch,
        academic_year_id: selYear,
        subject_id: selSubject,
        grade_id: selGrade,
        teacher_profile_id: selTeacher || null
      })
      setNewGroupName('')
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في إنشاء المجموعة')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Session Schedule
  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await api.post('/academic-sessions', {
        group_id: selGroup,
        classroom_id: selClassroom || null,
        teacher_profile_id: selTeacher || null,
        date: sessionDate,
        start_time: startTime + ':00',
        end_time: endTime + ':00',
        status: 'مجدولة'
      })
      setSessionDate('')
      setStartTime('')
      setEndTime('')
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في جدولة الحصة')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen w-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 h-[250px] w-[250px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none"></div>

        {/* Page Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-900 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">القسم الأكاديمي وإدارة الحصص</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">اضبط السنوات الدراسية، ومجموعات الطلاب، وجداول المواعيد اليومية.</p>
          </div>
          <Link to="/dashboard" className="text-xs font-semibold text-violet-400 hover:text-violet-300">
            ← العودة للوحة التحكم
          </Link>
        </div>

        {/* Tabs Bar */}
        <div className="flex gap-4 border-b border-slate-200 dark:border-slate-900 mb-6 shrink-0">
          <button
            onClick={() => setActiveTab('years')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'years'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-300'
            }`}
          >
            السنوات الدراسية
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'groups'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-300'
            }`}
          >
            المجموعات الدراسية
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'sessions'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-300'
            }`}
          >
            جدول المحاضرات اليومي
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-red-950/40 border border-red-500/30 p-4 text-sm text-red-200 mb-6 max-w-4xl">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-6xl">
          {/* Main List Area */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            ) : activeTab === 'years' ? (
              // Academic Years Tab Content
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">السنوات الدراسية المسجلة</h2>
                {years.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-900 border-dashed p-12 text-center text-slate-500">
                    <Calendar className="h-10 w-10 mx-auto mb-4 text-slate-600 dark:text-slate-300" />
                    <p className="text-sm font-semibold">لا توجد سنوات دراسية مضافة حالياً.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {years.map((y) => (
                      <div key={y.id} className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/40 p-5 hover:border-slate-200 dark:border-slate-800 transition-all">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">{y.name}</h3>
                        <span className="inline-block mt-2 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-2 py-0.5 rounded-full">
                          {y.status === 'active' ? 'نشط' : y.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'groups' ? (
              // Groups Tab Content
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">المجموعات الدراسية الحالية</h2>
                {groups.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-900 border-dashed p-12 text-center text-slate-500">
                    <Layers className="h-10 w-10 mx-auto mb-4 text-slate-600 dark:text-slate-300" />
                    <p className="text-sm font-semibold">لا توجد مجموعات دراسية مضافة حالياً.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groups.map((g) => (
                      <div key={g.id} className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/40 p-5 hover:border-slate-200 dark:border-slate-800 transition-all space-y-3">
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-slate-200">{g.name}</h3>
                          <p className="text-xs text-slate-500">{g.subject.name} • {g.grade.name}</p>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-slate-500" /> <span>{g.branch.name}</span></div>
                          <div className="flex items-center gap-2"><User className="h-3 w-3 text-slate-500" /> <span>المدرس: {g.teacher_profile?.user.name || 'غير محدد'}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Sessions Tab Content
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">جدول الحصص المجدولة</h2>
                {sessions.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-900 border-dashed p-12 text-center text-slate-500">
                    <Clock className="h-10 w-10 mx-auto mb-4 text-slate-600 dark:text-slate-300" />
                    <p className="text-sm font-semibold">لا توجد حصص مجدولة في جدول اليوم.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((s) => (
                      <div key={s.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/40 p-5 hover:border-slate-200 dark:border-slate-800 transition-all">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-violet-400">{s.date} • {s.start_time} - {s.end_time}</span>
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">{s.group.name}</h3>
                          <p className="text-xs text-slate-500">القاعة: {s.classroom?.name || 'غير محدد'} • المدرس: {s.teacher_profile?.user.name || 'غير محدد'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${
                            s.status === 'completed'
                              ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400'
                              : 'bg-blue-950/30 border-blue-900/40 text-blue-400'
                          }`}>
                            {s.status === 'completed' ? 'تمت' : 'مجدولة'}
                          </span>
                          
                          {s.status === 'scheduled' && (
                            <button
                              onClick={() => navigate(`/attendance/${s.id}`)}
                              className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer"
                            >
                              <CheckSquare className="h-3.5 w-3.5" />
                              <span>تسجيل الحضور</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Building Sidebar */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/40 p-6 space-y-6">
            {activeTab === 'years' && (
              // Add Year Form
              <>
                <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">إضافة سنة دراسية جديدة</h2>
                <form onSubmit={handleYearSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="yearName" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">اسم السنة الدراسية</label>
                    <input
                      id="yearName"
                      type="text"
                      required
                      placeholder="مثال: 2026/2027"
                      value={newYearName}
                      onChange={(e) => setNewYearName(e.target.value)}
                      className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 transition-all text-right"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="startDate" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">تاريخ البدء</label>
                    <input
                      id="startDate"
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500/50 transition-all text-right"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="endDate" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">تاريخ الانتهاء</label>
                    <input
                      id="endDate"
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500/50 transition-all text-right"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:bg-violet-800 transition-all cursor-pointer shadow-lg shadow-violet-600/10"
                  >
                    <Plus className="h-4 w-4" />
                    <span>إضافة السنة الدراسية</span>
                  </button>
                </form>
              </>
            )}

            {activeTab === 'groups' && (
              // Add Group Form
              <>
                <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">إنشاء مجموعة جديدة</h2>
                <form onSubmit={handleGroupSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="groupName" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">اسم المجموعة</label>
                    <input
                      id="groupName"
                      type="text"
                      required
                      placeholder="مثال: مجموعة الرياضيات - الصف الأول"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 transition-all text-right"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="groupBranch" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">الفرع</label>
                    <select
                      id="groupBranch"
                      required
                      value={selBranch}
                      onChange={(e) => setSelBranch(e.target.value)}
                      className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-violet-500/50 transition-all text-right"
                    >
                      <option value="">اختر الفرع</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="groupYear" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">السنة الدراسية</label>
                    <select
                      id="groupYear"
                      required
                      value={selYear}
                      onChange={(e) => setSelYear(e.target.value)}
                      className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-violet-500/50 transition-all text-right"
                    >
                      <option value="">اختر السنة الدراسية</option>
                      {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="groupSubject" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">المادة</label>
                    <select
                      id="groupSubject"
                      required
                      value={selSubject}
                      onChange={(e) => setSelSubject(e.target.value)}
                      className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-violet-500/50 transition-all text-right"
                    >
                      <option value="">اختر المادة</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="groupGrade" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">الصف الدراسي</label>
                    <select
                      id="groupGrade"
                      required
                      value={selGrade}
                      onChange={(e) => setSelGrade(e.target.value)}
                      className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-violet-500/50 transition-all text-right"
                    >
                      <option value="">اختر الصف الدراسي</option>
                      {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:bg-violet-800 transition-all cursor-pointer shadow-lg shadow-violet-600/10"
                  >
                    <Plus className="h-4 w-4" />
                    <span>إنشاء المجموعة</span>
                  </button>
                </form>
              </>
            )}

            {activeTab === 'sessions' && (
              // Add Session Form
              <>
                <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">جدولة حصة جديدة</h2>
                <form onSubmit={handleSessionSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="sessionGroup" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">المجموعة الدراسية</label>
                    <select
                      id="sessionGroup"
                      required
                      value={selGroup}
                      onChange={(e) => setSelGroup(e.target.value)}
                      className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-violet-500/50 transition-all text-right"
                    >
                      <option value="">اختر المجموعة</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="sessionDate" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">تاريخ الحصة</label>
                    <input
                      id="sessionDate"
                      type="date"
                      required
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500/50 transition-all text-right"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="sessionStart" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">وقت البدء</label>
                      <input
                        id="sessionStart"
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500/50 transition-all text-right"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="sessionEnd" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">وقت الانتهاء</label>
                      <input
                        id="sessionEnd"
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500/50 transition-all text-right"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:bg-violet-800 transition-all cursor-pointer shadow-lg shadow-violet-600/10"
                  >
                    <Plus className="h-4 w-4" />
                    <span>جدولة الحصة</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
