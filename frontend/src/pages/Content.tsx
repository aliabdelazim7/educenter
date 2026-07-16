import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
  BookOpen,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Trash2,
  FileText,
  Video,
  ClipboardList
} from 'lucide-react'

interface Group {
  id: string
  name: string
}

interface ContentItem {
  id: string
  group_id: string
  title: string
  content_type: string
  drive_link: string
  group?: { name: string }
}

export const Content: React.FC = () => {
  const [contents, setContents] = useState<ContentItem[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Add Content Form State
  const [selectedGroup, setSelectedGroup] = useState('')
  const [title, setTitle] = useState('')
  const [contentType, setContentType] = useState('homework')
  const [driveLink, setDriveLink] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resGroups, resContents] = await Promise.all([
        api.get('/groups'),
        api.get('/educational-contents')
      ])
      
      const groupData = resGroups.data.data
      setGroups(groupData)
      
      // Map group names manually if relations are not fully loaded
      const mappedContents = resContents.data.data.map((item: any) => {
        const found = groupData.find((g: any) => g.id === item.group_id)
        return {
          ...item,
          group: found ? { name: found.name } : { name: 'مجموعة غير محددة' }
        }
      })
      
      setContents(mappedContents)
    } catch (err: any) {
      setError('فشل في تحميل المحتوى التعليمي والمجموعات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroup || !title || !driveLink) {
      setError('يرجى ملء جميع الحقول المطلوبة.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.post('/educational-contents', {
        group_id: selectedGroup,
        title,
        content_type: contentType,
        drive_link: driveLink
      })
      
      const newObj = res.data.data
      const foundG = groups.find(g => g.id === selectedGroup)
      newObj.group = foundG ? { name: foundG.name } : { name: 'مجموعة غير محددة' }

      setContents((prev) => [newObj, ...prev])
      setTitle('')
      setDriveLink('')
      setSuccess('تم إضافة ونشر المحتوى التعليمي للطلاب بنجاح!')
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في نشر المحتوى التعليمي')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المحتوى التعليمي؟')) return
    try {
      await api.delete(`/educational-contents/${id}`)
      setContents((prev) => prev.filter(c => c.id !== id))
      setSuccess('تم حذف المحتوى التعليمي بنجاح.')
    } catch (err) {
      setError('فشل في حذف المحتوى التعليمي')
    }
  }

  const getContentTypeArabic = (type: string) => {
    switch (type) {
      case 'homework': return 'واجب منزلي'
      case 'book': return 'كتاب / ملزمة'
      case 'pdf': return 'ملف PDF'
      case 'video': return 'فيديو شرح'
      case 'exam': return 'نموذج امتحان'
      default: return type
    }
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4 text-sky-400" />
      case 'exam': return <ClipboardList className="h-4 w-4 text-amber-400" />
      default: return <FileText className="h-4 w-4 text-violet-400" />
    }
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col p-8 overflow-y-auto relative" dir="rtl">
        <div className="absolute top-0 left-0 h-[250px] w-[250px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-900 pb-4">
          <div className="space-y-1 text-right">
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">إدارة المحتوى التعليمي والمذكرات</h1>
            <p className="text-sm text-slate-400">انشر الواجبات، المذكرات، الشروحات، والاختبارات عبر روابط جوجل درايف مباشرة.</p>
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
            {/* Add Content Form */}
            <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-6 space-y-6">
              <h2 className="text-lg font-bold text-slate-350 flex items-center gap-2 text-right">
                <BookOpen className="h-5 w-5 text-violet-400" />
                <span>إضافة رابط محتوى جديد</span>
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Select Group */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-400">المجموعة المستهدفة</label>
                  <select
                    required
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500 text-right"
                  >
                    <option value="">اختر المجموعة...</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>

                {/* Content Title */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-400">عنوان المحتوى التعليمي</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مذكرة الجبر والتحليل - الباب الأول"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-sm text-slate-200 outline-none focus:border-violet-500 text-right"
                  />
                </div>

                {/* Content Type */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-400">تصنيف ونوع الملف</label>
                  <select
                    required
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-500 text-right"
                  >
                    <option value="homework">واجب منزلي</option>
                    <option value="book">كتاب / ملزمة</option>
                    <option value="pdf">ملف PDF</option>
                    <option value="video">فيديو شرح</option>
                    <option value="exam">نموذج امتحان</option>
                  </select>
                </div>

                {/* Google Drive Link */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-400">رابط Google Drive للملف</label>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/..."
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-sm text-slate-100 outline-none focus:border-violet-500 text-left font-mono"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-slate-600 block text-right leading-tight">انسخ رابط المشاركة المباشر من جوجل درايف والصقه هنا.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedGroup || !title || !driveLink}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-violet-850 py-2.5 font-semibold text-white transition-all cursor-pointer shadow-lg shadow-violet-600/10 text-xs mt-4"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>حفظ ونشر المحتوى للطلاب</span>
                </button>
              </form>
            </div>

            {/* List Table */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-300 text-right">المحتوى المنشور حالياً</h2>

              {contents.length === 0 ? (
                <div className="rounded-xl border border-slate-900 border-dashed p-12 text-center text-slate-500">
                  <BookOpen className="h-10 w-10 mx-auto mb-4 text-slate-650" />
                  <p className="text-sm font-semibold">لم يتم نشر أي محتوى دراسي بعد.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-900 bg-slate-950/40 overflow-hidden">
                  <table className="w-full text-right border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-900/30 text-xs font-bold uppercase text-slate-500">
                        <th className="px-6 py-4">عنوان المادة الدراسية / الملف</th>
                        <th className="px-6 py-4">المجموعة</th>
                        <th className="px-6 py-4">النوع</th>
                        <th className="px-6 py-4 text-left">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs">
                      {contents.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-900/10 transition-all">
                          <td className="px-6 py-4 font-bold text-slate-200">{item.title}</td>
                          <td className="px-6 py-4 text-slate-400">{item.group?.name || 'عام'}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 text-violet-400">
                              {getContentIcon(item.content_type)}
                              <span>{getContentTypeArabic(item.content_type)}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 text-left">
                            <div className="flex items-center justify-end gap-3">
                              <a
                                href={item.drive_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>فتح الرابط</span>
                              </a>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                                title="حذف"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
