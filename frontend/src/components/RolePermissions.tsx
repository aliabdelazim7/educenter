import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { Loader2, Lock, Save, ShieldCheck, Users as UsersIcon } from 'lucide-react'

interface Role {
  id: string
  name: string
  label: string
  locked: boolean
  users_count: number
  permissions: string[]
}

interface CatalogGroup {
  group: string
  permissions: { key: string; label: string }[]
}

export const RolePermissions: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [catalog, setCatalog] = useState<CatalogGroup[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [draft, setDraft] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const load = async () => {
    try {
      const res = await api.get('/roles')
      const list: Role[] = res.data.data.roles
      setRoles(list)
      setCatalog(res.data.data.catalog)
      setSelected((cur) => cur ?? list.find((r) => !r.locked)?.id ?? list[0]?.id ?? null)
    } catch {
      setNotice('تعذر تحميل الأدوار.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const role = roles.find((r) => r.id === selected)

  // Reset the draft whenever a different role is opened.
  useEffect(() => {
    if (role) setDraft(new Set(role.permissions))
  }, [selected, roles])

  const toggle = (key: string) => {
    setDraft((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const dirty = role
    ? role.permissions.length !== draft.size ||
      role.permissions.some((p) => !draft.has(p))
    : false

  const save = async () => {
    if (!role) return
    setSaving(true)
    setNotice(null)
    try {
      const res = await api.patch(`/roles/${role.id}/permissions`, {
        permissions: Array.from(draft),
      })
      setNotice(res.data.message)
      await load()
      setTimeout(() => setNotice(null), 3000)
    } catch (err: any) {
      setNotice(err.response?.data?.message || 'تعذر حفظ الصلاحيات.')
    } finally {
      setSaving(false)
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
        اختر دوراً لتحديد ما يستطيع الوصول إليه. التغييرات تسري فوراً على كل من يحمل هذا الدور.
      </p>

      {notice && (
        <div className="rounded-lg border border-violet-200 dark:border-violet-500/30 bg-violet-100 dark:bg-violet-600/10 p-3 text-xs text-violet-800 dark:text-violet-300">
          {notice}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        {/* Role picker */}
        <div className="space-y-2">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r.id)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-right transition-colors ${
                selected === r.id
                  ? 'border-violet-500 bg-violet-100 dark:bg-violet-600/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="min-w-0">
                <p className={`text-xs font-bold ${
                  selected === r.id ? 'text-violet-800 dark:text-violet-200' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {r.label}
                </p>
                <p className="flex items-center gap-1 text-[10px] text-slate-500">
                  <UsersIcon className="h-2.5 w-2.5" />
                  {r.users_count} مستخدم • {r.permissions.length} صلاحية
                </p>
              </div>
              {r.locked && <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
            </button>
          ))}
        </div>

        {/* Permission matrix */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {!role ? (
            <p className="p-10 text-center text-xs text-slate-500">اختر دوراً.</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <h3 className="text-sm font-bold">صلاحيات {role.label}</h3>
                </div>
                {!role.locked && (
                  <button
                    onClick={save}
                    disabled={!dirty || saving}
                    className="flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-4 py-2 text-xs font-semibold text-white transition-colors"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    حفظ
                  </button>
                )}
              </div>

              {role.locked ? (
                <div className="flex items-start gap-3 p-5 text-xs text-slate-600 dark:text-slate-400">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <p className="leading-relaxed">
                    مالك المركز يملك كل الصلاحيات دائماً ولا يمكن تعديلها — هذا يمنع فقدان
                    الوصول لإدارة المركز.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {catalog.map((g) => (
                    <div key={g.group} className="p-4 space-y-2">
                      <p className="text-[11px] font-bold text-slate-500">{g.group}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {g.permissions.map((p) => (
                          <label
                            key={p.key}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <input
                              type="checkbox"
                              checked={draft.has(p.key)}
                              onChange={() => toggle(p.key)}
                              className="h-3.5 w-3.5 accent-violet-600"
                            />
                            <span className="text-xs text-slate-700 dark:text-slate-300">{p.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
