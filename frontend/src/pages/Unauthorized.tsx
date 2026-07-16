import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

export const Unauthorized: React.FC = () => {
  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-6 font-sans">
      <div className="relative flex flex-col items-center max-w-md text-center space-y-6">
        <div className="absolute top-[-50%] left-[-50%] h-[200%] w-[200%] rounded-full bg-red-100 dark:bg-red-600/5 blur-[120px]"></div>

        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">غير مسموح بالدخول</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            حسابك لا يمتلك الصلاحيات الأمنية المطلوبة للوصول إلى هذه الصفحة. يرجى التواصل مع المدير العام إذا كنت تعتقد أن هذا خطأ.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-200 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>العودة للوحة التحكم</span>
        </Link>
      </div>
    </div>
  )
}
