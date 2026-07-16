import React, { useState, useEffect } from 'react'
import api from '../services/api'
import {
  Settings as SettingsIcon,
  Shield,
  Activity,
  Loader2,
  AlertCircle,
  Clock
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface AuditLog {
  id: string
  action: string
  model_type: string | null
  payload: any
  ip_address: string | null
  created_at: string
  user: { name: string }
}

export const Settings: React.FC = () => {
  const { tenant } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'audits'>('profile')
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tenant Config Form
  const [tenantName, setTenantName] = useState(tenant?.name || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchAuditLogs = async () => {
    setLoadingLogs(true)
    setError(null)
    try {
      const res = await api.get('/audit-logs')
      setLogs(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحميل سجل الرقابة')
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'audits') {
      fetchAuditLogs()
    }
  }, [activeTab])

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccess(null)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      setSuccess('تم حفظ إعدادات الأكاديمية بنجاح.')
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في حفظ الإعدادات')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getActionArabic = (act: string) => {
    switch (act) {
      case 'create': return 'إضافة جديد'
      case 'update': return 'تعديل بيانات'
      case 'delete': return 'حذف سجل'
      case 'login': return 'تسجيل دخول'
      case 'logout': return 'تسجيل خروج'
      default: return act
    }
  }

  return (
    <div className="flex h-screen w-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 h-[250px] w-[250px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-900 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">إعدادات النظام والأكاديمية</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">اضبط البيانات العامة للمركز، والخيارات الأمنية، وراجع سجل الرقابة والإدارة.</p>
          </div>
          <a href="/dashboard" className="text-xs font-semibold text-violet-400 hover:text-violet-300">
            ← العودة للوحة التحكم
          </a>
        </div>

        {/* Tabs Bar */}
        <div className="flex gap-4 border-b border-slate-200 dark:border-slate-900 mb-6 shrink-0 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-300'
            }`}
          >
            الملف التعريفي العام
          </button>
          <button
            onClick={() => setActiveTab('audits')}
            className={`px-4 py-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'audits'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-300'
            }`}
          >
            سجل الرقابة والأمان
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-red-950/40 border border-red-500/30 p-4 text-sm text-red-200 mb-6 max-w-4xl">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-4 text-sm text-emerald-200 mb-6 max-w-4xl">
            <Shield className="h-5 w-5 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <div className="max-w-4xl w-full">
          {activeTab === 'profile' ? (
            /* General Settings Tab */
            <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/40 p-6 max-w-lg space-y-6">
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-violet-400" /> بيانات الأكاديمية والمركز
              </h2>
              
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="acadName" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">اسم الأكاديمية أو المركز</label>
                  <input
                    id="acadName"
                    type="text"
                    required
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-violet-500/50 transition-all text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">رابط المركز الفرعي (Subdomain)</label>
                  <input
                    type="text"
                    disabled
                    value={tenant?.subdomain || ''}
                    className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 px-4 py-2.5 text-sm text-slate-500 outline-none cursor-not-allowed text-right font-mono"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-slate-600 dark:text-slate-300 block leading-tight">روابط الفروع مقفلة لأسباب أمنية ولا يمكن تعديلها بعد إتمام التسجيل.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:bg-violet-800 transition-all cursor-pointer shadow-lg shadow-violet-600/10"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>حفظ الإعدادات</span>
                </button>
              </form>
            </div>
          ) : (
            /* Audit Log Timeline Tab */
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Activity className="h-5 w-5 text-violet-400" /> سجل العمليات الإدارية والرقابة
              </h2>

              {loadingLogs ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                </div>
              ) : logs.length === 0 ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-900 border-dashed p-12 text-center text-slate-500">
                  <Clock className="h-10 w-10 mx-auto mb-4 text-slate-600 dark:text-slate-300" />
                  <p className="text-sm font-semibold">لا توجد سجلات رقابة مسجلة حالياً.</p>
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:inset-0 before:right-3.5 before:w-[1px] before:bg-slate-50 dark:bg-slate-900">
                  {logs.map((log) => (
                    <div key={log.id} className="relative pr-10 flex gap-4 text-xs">
                      {/* Timeline dot */}
                      <div className="absolute right-2 top-1.5 h-3 w-3 rounded-full border border-violet-500 bg-white dark:bg-slate-950 shrink-0"></div>
                      
                      <div className="flex-1 rounded-lg border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/40 p-4 hover:border-slate-200 dark:border-slate-800 transition-all text-right">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              <span className="text-violet-400">{getActionArabic(log.action)}</span> - {log.model_type ? log.model_type.split('\\').pop() : 'النظام'}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                              بواسطة: {log.user?.name || 'النظام'} • عنوان IP: {log.ip_address || 'غير متوفر'}
                            </p>
                          </div>
                          <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-300 shrink-0" dir="ltr">
                            {new Date(log.created_at).toLocaleString('ar-EG')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
