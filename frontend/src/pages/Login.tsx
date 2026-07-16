import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { School, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'

export const Login: React.FC = () => {
  const { login, error, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Retrieve redirect path from router state or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard'

  const handleFillDemo = () => {
    setSubdomain('elite')
    setEmail('admin@elite.com')
    setPassword('password')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setIsSubmitting(true)

    try {
      await login(email, password, subdomain)
      navigate(from, { replace: true })
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
        <div className="absolute top-[-20%] left-[-20%] h-[70%] w-[70%] rounded-full bg-violet-100 dark:bg-violet-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] h-[60%] w-[60%] rounded-full bg-indigo-100 dark:bg-indigo-600/10 blur-[120px]"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-600/20 border border-violet-200 dark:border-violet-500/30">
            <School className="h-5 w-5 text-violet-700 dark:text-violet-400" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">منصة إديوسنتر</span>
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-slate-50">
            أقوى نظام سحابي متكامل لإدارة مركزك التعليمي.
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            دلوقتي تقدر تدير الفروع، والطلاب، والمدرسين، والجدول الدراسي، والحسابات، والمخزن في منصة واحدة آمنة بالكامل.
          </p>
          <div className="flex gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-2xl font-bold text-violet-700 dark:text-violet-400">99.9%</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">جاهزية تشغيل مستمرة</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">10k+</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">طالب نشط</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-violet-700 dark:text-violet-400">24/7</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">دعم فني متميز</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
          © 2026 إديوسنتر لإدارة المراكز التعليمية. جميع الحقوق محفوظة.
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="space-y-2">
            <div className="flex lg:hidden items-center gap-2 mb-6">
              <School className="h-6 w-6 text-violet-500" />
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">إديوسنتر</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">تسجيل الدخول</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              أهلاً بك من جديد، سجل دخولك لإدارة حساب مركزك التعليمي
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-lg bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 p-4 text-sm text-red-200">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-700 dark:text-red-400" />
              <span>حدث خطأ أثناء تسجيل الدخول، تأكد من البيانات وحاول مرة أخرى.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subdomain Input */}
            <div className="space-y-2">
              <label htmlFor="subdomain" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                اسم النطاق الفرعي للمركز (Subdomain)
              </label>
              <div className="flex rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-violet-200 dark:focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all">
                <input
                  id="subdomain"
                  type="text"
                  required
                  placeholder="مثال: elite"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                  className="w-full bg-transparent px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-600 outline-none"
                />
                <span className="flex items-center bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 px-4 text-sm font-semibold text-slate-500 rounded-l-lg" dir="ltr">
                  .educenter.com
                </span>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-600 outline-none"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  كلمة المرور
                </label>
                <a href="#forgot" className="text-xs text-violet-700 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium">
                  نسيت كلمة المرور؟
                </a>
              </div>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-600 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-500 disabled:bg-violet-800 disabled:text-slate-600 dark:text-slate-400 transition-all duration-200 cursor-pointer shadow-lg shadow-violet-600/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <ArrowLeft className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Box */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-4 border-violet-200 dark:border-violet-500/10 text-right space-y-3">
            <p className="text-xs font-bold text-violet-700 dark:text-violet-400">💡 الحساب التجريبي السريع (الديمو)</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              يمكنك استخدام بيانات الأكاديمية التجريبية الافتراضية بنقرة واحدة لتجربة لوحة تحكم صاحب المركز.
            </p>
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-2 rounded bg-violet-100 dark:bg-violet-600/10 hover:bg-violet-100 dark:hover:bg-violet-600/25 border border-violet-200 dark:border-violet-500/20 hover:border-violet-200 dark:hover:border-violet-500/40 text-xs font-bold text-violet-700 dark:text-violet-400 transition-all cursor-pointer"
            >
              تعبئة بيانات الحساب التجريبي تلقائياً
            </button>
          </div>

          <p className="text-center text-sm text-slate-500">
            ليس لديك نطاق خاص بك؟{' '}
            <Link to="/register" className="font-semibold text-violet-700 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300">
              سجل مركزك التعليمي الآن
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
