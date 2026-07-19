import React, { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import { Loader2, Link2, Link2Off, UserCheck } from 'lucide-react'

interface StudentLink {
  profile_id: string
  name: string
  email: string | null
  parent_id: string | null
  parent_name: string | null
}

interface ParentOption {
  id: string
  name: string
}

export const ParentLinks: React.FC = () => {
  const [students, setStudents] = useState<StudentLink[]>([])
  const [parents, setParents] = useState<ParentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [s, u] = await Promise.all([
        api.get('/student-links'),
        api.get('/users'),
      ])
      setStudents(s.data.data)
      setParents(
        (u.data.data || [])
          .filter((x: any) => x.roles?.includes('Parent'))
          .map((x: any) => ({ id: x.id, name: x.name }))
      )
    } catch {
      setNotice('تعذر تحميل بيانات الربط.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const link = async (profileId: string, parentId: string | null) => {
    setBusy(profileId)
    try {
      const res = await api.patch(`/student-links/${profileId}/parent`, { parent_id: parentId })
      await load()
      setNotice(res.data.message)
      setTimeout(() => setNotice(null), 3000)
    } catch (err: any) {
      setNotice(err.response?.data?.message || 'تعذر تحديث الربط.')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
        اربط كل طالب بولي أمره. ولي الأمر يرى أبناءه المرتبطين به فقط — لا أحد غيرهم.
      </p>

      {notice && (
        <div className="rounded-lg border border-violet-200 dark:border-violet-500/30 bg-violet-100 dark:bg-violet-600/10 p-3 text-xs text-violet-800 dark:text-violet-300">
          {notice}
        </div>
      )}

      {parents.length === 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-100 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300">
          لا يوجد أولياء أمور بعد. أضف ولي أمر من تبويب الدعوات أولاً.
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900 overflow-hidden">
        {students.length === 0 ? (
          <p className="p-12 text-center text-sm text-slate-500">لا يوجد طلاب بعد.</p>
        ) : (
          students.map((s) => (
            <div
              key={s.profile_id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 p-4 last:border-b-0"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{s.name}</p>
                {s.parent_name ? (
                  <p className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                    <UserCheck className="h-3 w-3" />
                    ولي الأمر: {s.parent_name}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">غير مرتبط بولي أمر</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={s.parent_id || ''}
                  disabled={busy === s.profile_id || parents.length === 0}
                  onChange={(e) => link(s.profile_id, e.target.value || null)}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 disabled:opacity-50"
                >
                  <option value="">— بدون ولي أمر —</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                {busy === s.profile_id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                ) : s.parent_id ? (
                  <button
                    onClick={() => link(s.profile_id, null)}
                    title="إلغاء الربط"
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40"
                  >
                    <Link2Off className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <Link2 className="h-4 w-4 text-slate-400" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
