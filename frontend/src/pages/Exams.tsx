import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
  CheckSquare,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Save,
  Users,
  Edit3
} from 'lucide-react'

interface Group {
  id: string
  name: string
}

interface Exam {
  id: string
  title: string
  exam_date: string
  max_score: number
  group_id: string
  group?: { name: string }
}

interface Student {
  id: string
  user: { name: string }
}

export const Exams: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Selection & Roster
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [roster, setRoster] = useState<{ studentId: string; name: string; score: string }[]>([])
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [isSavingRoster, setIsSavingRoster] = useState(false)

  // Add Exam Form State
  const [selectedGroup, setSelectedGroup] = useState('')
  const [title, setTitle] = useState('')
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0])
  const [maxScore, setMaxScore] = useState('100')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resGroups, resExams] = await Promise.all([
        api.get('/groups'),
        api.get('/exams')
      ])
      
      const groupData = resGroups.data.data
      setGroups(groupData)
      
      const mappedExams = resExams.data.data.map((exam: any) => {
        const found = groupData.find((g: any) => g.id === exam.group_id)
        return {
          ...exam,
          group: found ? { name: found.name } : { name: 'مجموعة غير محددة' }
        }
      })
      setExams(mappedExams)
    } catch (err: any) {
      setError('فشل في تحميل الامتحانات والمجموعات الدراسية')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleExamSelect = async (exam: Exam) => {
    setSelectedExam(exam)
    setSuccess(null)
    setError(null)
    setLoadingRoster(true)
    
    try {
      // 1. Fetch group students
      const studRes = await api.get(`/groups/${exam.group_id}/students`)
      const students: Student[] = studRes.data.data

      // 2. Fetch existing exam grades
      const gradeRes = await api.get(`/exams/${exam.id}/grades`)
      const grades: any[] = gradeRes.data.data

      // 3. Map students to roster list
      const rosterList = students.map((s) => {
        const foundGrade = grades.find((g) => g.student_profile_id === s.id)
        return {
          studentId: s.id,
          name: s.user.name,
          score: foundGrade ? parseFloat(foundGrade.score).toString() : ''
        }
      })

      setRoster(rosterList)
    } catch (err) {
      setError('فشل في تحميل كشف طلاب المجموعة ورصد درجاتهم.')
    } finally {
      setLoadingRoster(false)
    }
  }

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroup || !title || !examDate) {
      setError('يرجى ملء كافة بيانات الامتحان.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.post('/exams', {
        group_id: selectedGroup,
        title,
        exam_date: examDate,
        max_score: parseInt(maxScore)
      })

      const newExam = res.data.data
      const foundG = groups.find(g => g.id === selectedGroup)
      newExam.group = foundG ? { name: foundG.name } : { name: 'مجموعة غير محددة' }

      setExams((prev) => [newExam, ...prev])
      setTitle('')
      setMaxScore('100')
      setSuccess('تم إنشاء نموذج الامتحان بنجاح! يمكنك الآن رصد الدرجات.')
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في إنشاء الامتحان')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleScoreChange = (studentId: string, value: string) => {
    setRoster((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, score: value } : r))
    )
  }

  const handleSaveGrades = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExam) return
    setIsSavingRoster(true)
    setError(null)
    setSuccess(null)

    // Filter grades that are not empty
    const gradesPayload = roster
      .filter((r) => r.score !== '')
      .map((r) => ({
        student_profile_id: r.studentId,
        score: parseFloat(r.score)
      }))

    try {
      await api.post(`/exams/${selectedExam.id}/grade`, {
        grades: gradesPayload
      })
      setSuccess('تم رصد وحفظ درجات الطلاب وتحديث خطهم الزمني بنجاح!')
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في حفظ درجات الطلاب')
    } finally {
      setIsSavingRoster(false)
    }
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col p-8 overflow-y-auto relative" dir="rtl">
        <div className="absolute top-0 left-0 h-[250px] w-[250px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-900 pb-4">
          <div className="space-y-1 text-right">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">رصد درجات امتحانات الطلاب</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">سجل اختبارات الطلاب الدورية وارصد درجاتهم لمتابعة مستوياتهم التعليمية.</p>
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
            {/* Create Exam Panel */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-6 space-y-6">
              <h2 className="text-lg font-bold text-slate-350 flex items-center gap-2 text-right">
                <CheckSquare className="h-5 w-5 text-violet-400" />
                <span>إنشاء امتحان جديد</span>
              </h2>

              <form onSubmit={handleCreateExam} className="space-y-4">
                {/* Select Group */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">المجموعة المستهدفة</label>
                  <select
                    required
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-violet-500 text-right"
                  >
                    <option value="">اختر المجموعة...</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>

                {/* Exam Title */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">عنوان الامتحان / الاختبار</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: اختبار الجبر شهر أكتوبر"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-violet-500 text-right"
                  />
                </div>

                {/* Exam Date */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">تاريخ الامتحان</label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-violet-500 text-right"
                  />
                </div>

                {/* Max Score */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">الدرجة النهائية الكبرى</label>
                  <input
                    type="number"
                    required
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-violet-500 text-right font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedGroup || !title || !examDate}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-violet-850 py-2.5 font-semibold text-white transition-all cursor-pointer shadow-lg shadow-violet-600/10 text-xs mt-4"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>حفظ وإنشاء نموذج الامتحان</span>
                </button>
              </form>
            </div>

            {/* List and Roster Table */}
            <div className="lg:col-span-2 space-y-6">
              {/* Exams Listing */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-350 text-right">نماذج الاختبارات المسجلة</h3>
                
                {exams.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-900 border-dashed p-12 text-center text-slate-500">
                    <CheckSquare className="h-10 w-10 mx-auto mb-4 text-slate-650" />
                    <p className="text-sm font-semibold">لم يتم إنشاء أي اختبارات بعد.</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 overflow-hidden">
                    <table className="w-full text-right border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/30 text-xs font-bold uppercase text-slate-500">
                          <th className="px-6 py-4">اسم الامتحان</th>
                          <th className="px-6 py-4">المجموعة المستهدفة</th>
                          <th className="px-6 py-4">الدرجة الكبرى</th>
                          <th className="px-6 py-4">تاريخ الامتحان</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-xs">
                        {exams.map((exam) => (
                          <tr
                            key={exam.id}
                            onClick={() => handleExamSelect(exam)}
                            className={`hover:bg-white dark:bg-slate-900/20 transition-all cursor-pointer ${
                              selectedExam?.id === exam.id ? 'bg-violet-600/10 border-r-2 border-violet-500' : ''
                            }`}
                          >
                            <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{exam.title}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{exam.group?.name || 'عام'}</td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-bold">{exam.max_score} درجة</td>
                            <td className="px-6 py-4 text-slate-500 font-mono">{exam.exam_date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Roster Grading List */}
              {selectedExam && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-900 pb-3">
                    <div className="text-right">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">رصد الدرجات: {selectedExam.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">درجة النهاية الكبرى: {selectedExam.max_score}</p>
                    </div>
                    <Users className="h-5 w-5 text-violet-400" />
                  </div>

                  {loadingRoster ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                    </div>
                  ) : roster.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">لا يوجد طلاب مسكنين بهذه المجموعة الدراسية لرصد درجاتهم.</p>
                  ) : (
                    <form onSubmit={handleSaveGrades} className="space-y-6">
                      <div className="divide-y divide-slate-900 max-h-72 overflow-y-auto pr-1">
                        {roster.map((row) => (
                          <div key={row.studentId} className="flex justify-between items-center py-3 text-xs" dir="rtl">
                            <span className="font-bold text-slate-700 dark:text-slate-300 flex-1 text-right">{row.name}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max={selectedExam.max_score}
                                placeholder="رصد الدرجة..."
                                value={row.score}
                                onChange={(e) => handleScoreChange(row.studentId, e.target.value)}
                                className="w-24 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-right text-xs outline-none focus:border-violet-500 font-mono text-slate-800 dark:text-slate-200"
                              />
                              <span className="text-slate-500 text-[10px]">من {selectedExam.max_score}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingRoster}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-650 hover:bg-violet-500 disabled:bg-violet-850 py-2.5 font-semibold text-white transition-all cursor-pointer shadow-lg shadow-violet-600/10 text-xs"
                      >
                        {isSavingRoster ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        <span>حفظ ورصد درجات الطلاب فورا</span>
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
