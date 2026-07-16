import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { School, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'

export const Register: React.FC = () => {
  const { register, error, clearError } = useAuth()
  const navigate = useNavigate()

  const [tenantName, setTenantName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubdomainChange = (val: string) => {
    // Format: replace spaces with hyphens, remove special characters, and lowercase
    const formatted = val
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
    setSubdomain(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setIsSubmitting(true)

    try {
      await register(tenantName, subdomain, name, email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Left panel - Decorative marketing panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-tr from-violet-950 via-slate-100 dark:via-slate-950 to-indigo-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Glow circles */}
        <div className="absolute top-[-20%] left-[-20%] h-[70%] w-[70%] rounded-full bg-violet-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] h-[60%] w-[60%] rounded-full bg-indigo-600/10 blur-[120px]"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 border border-violet-500/30">
            <School className="h-5 w-5 text-violet-400" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">منصة إديوسنتر</span>
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-slate-50">
            أنشئ بيئة العمل الرقمية لأكاديميتك في ثوانٍ.
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            احصل على وصول فوري لبيئة عمل مستقلة مخصصة لمركزك مع رابط فرعي خاص بك. ابدأ بفرع واحد وتوسع لمئات الفروع.
          </p>
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-violet-400"></div>
              <p className="text-sm text-slate-700 dark:text-slate-300">عزل كامل وآمن لقاعدة بيانات مركزك</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-400"></div>
              <p className="text-sm text-slate-700 dark:text-slate-300">صلاحيات وأدوار جاهزة (مدير، مدرس، طالب، موظف)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-violet-400"></div>
              <p className="text-sm text-slate-700 dark:text-slate-300">واجهات مخصصة وإعدادات محلية بالكامل</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
          © 2026 إديوسنتر لإدارة المراكز التعليمية. جميع الحقوق محفوظة.
        </div>
      </div>

      {/* Right panel - Registration Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="space-y-2">
            <div className="flex lg:hidden items-center gap-2 mb-6">
              <School className="h-6 w-6 text-violet-500" />
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">إديوسنتر</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">سجل مركزك التعليمي</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              سجل حساب جديد للمركز وأنشئ ملف المدير العام لإدارة الأكاديمية
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-lg bg-red-950/40 border border-red-500/30 p-4 text-sm text-red-200">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <span>حدث خطأ أثناء التسجيل، تأكد من التفاصيل وحاول مرة أخرى.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Center Name */}
            <div className="space-y-1">
              <label htmlFor="tenantName" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                اسم الأكاديمية أو المركز
              </label>
              <input
                id="tenantName"
                type="text"
                required
                placeholder="مثال: أكاديمية النخبة للغات"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all text-right"
              />
            </div>

            {/* Subdomain */}
            <div className="space-y-1">
              <label htmlFor="subdomain" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                رابط المركز المطلوب (Subdomain)
              </label>
              <div className="flex rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all">
                <input
                  id="subdomain"
                  type="text"
                  required
                  placeholder="مثال: elite"
                  value={subdomain}
                  onChange={(e) => handleSubdomainChange(e.target.value)}
                  className="w-full bg-transparent px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-600 outline-none text-right"
                />
                <span className="flex items-center bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 px-4 text-sm font-semibold text-slate-500 rounded-l-lg" dir="ltr">
                  .educenter.com
                </span>
              </div>
            </div>

            {/* Administrator Name */}
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                اسم المدير العام بالكامل
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="مثال: أحمد محمد"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all text-right"
              />
            </div>

            {/* Administrator Email */}
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                البريد الإلكتروني للمدير
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all text-right"
              />
            </div>

            {/* Administrator Password */}
            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                كلمة المرور للمدير
              </label>
              <input
                id="password"
                type="password"
                required
                placeholder="لا تقل عن 8 أحرف أو أرقام"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all text-right"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-500 disabled:bg-violet-800 disabled:text-slate-600 dark:text-slate-400 transition-all duration-200 cursor-pointer shadow-lg shadow-violet-600/20 mt-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>جاري إنشاء الأكاديمية...</span>
                </>
              ) : (
                <>
                  <span>إنشاء الحساب وتفعيل الأكاديمية</span>
                  <ArrowLeft className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="font-semibold text-violet-400 hover:text-violet-300">
              تسجيل الدخول من هنا
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
