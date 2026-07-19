import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { GlobalSearch } from '../components/GlobalSearch'
import { NotificationBell } from '../components/NotificationBell'
import {
  School,
  LayoutDashboard,
  GitBranch,
  BookOpen,
  Users,
  Award,
  Calendar,
  DollarSign,
  ShoppingCart,
  Layers,
  Settings,
  LogOut,
  UserCheck,
  TrendingUp,
  Clock,
  Activity,
  Plus,
  CheckSquare,
  UserPlus
} from 'lucide-react'

export const Dashboard: React.FC = () => {
  const { user, tenant, logout, hasPermission } = useAuth()

  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [sessions, setSessions] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [teacherCount, setTeacherCount] = useState<number | null>(null)
  const [dueInvoices, setDueInvoices] = useState<any[]>([])

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.get('/branches')
        setBranches(res.data.data)
      } catch (err) {
        console.error('Failed to fetch branches:', err)
      }
    }
    fetchBranches()
  }, [])

  // Panels below the KPIs, each from its own endpoint. Failures degrade to an
  // empty panel rather than blocking the dashboard.
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)

    api.get(`/academic-sessions?date=${today}`)
      .then((r) => setSessions(r.data.data))
      .catch(() => setSessions([]))

    api.get('/ledger')
      .then((r) => setPayments((r.data.data || []).filter((e: any) => e.type === 'credit').slice(0, 5)))
      .catch(() => setPayments([]))

    api.get('/teachers')
      .then((r) => setTeacherCount(r.data.data.length))
      .catch(() => setTeacherCount(null))

    api.get('/invoices')
      .then((r) => setDueInvoices(
        (r.data.data || [])
          .filter((i: any) => i.status !== 'paid' && i.due_date)
          .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
          .slice(0, 5)
      ))
      .catch(() => setDueInvoices([]))
  }, [])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const url = selectedBranch ? `/analytics/summary?branch_id=${selectedBranch}` : '/analytics/summary'
        const res = await api.get(url)
        setStats(res.data.data)
      } catch (err) {
        console.error('Failed to fetch analytics summary:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [selectedBranch])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  // Define sidebar navigation items based on permissions
  const menuItems = [
    { name: 'لوحة التحكم', icon: LayoutDashboard, path: '/dashboard', show: true },
    { name: 'الطلاب والمشتركين', icon: Users, path: '/students', show: hasPermission('view students') },
    { name: 'المدرسين والرواتب', icon: Award, path: '/teachers', show: hasPermission('view teachers') },
    { name: 'الكاشير والتحصيل', icon: ShoppingCart, path: '/pos', show: hasPermission('view pos') },
    { name: 'سجل الحضور والغياب', icon: Calendar, path: '/academic', show: hasPermission('view academic') },
    { name: 'المحتوى التعليمي', icon: BookOpen, path: '/content', show: true },
    { name: 'الامتحانات والدرجات', icon: CheckSquare, path: '/exams', show: true },
    { name: 'الحسابات والخزنة', icon: Activity, path: '/financials', show: hasPermission('view financial') },
    { name: 'التقارير المالية', icon: DollarSign, path: '/reports', show: hasPermission('view financial') },
    { name: 'المخزون والأصناف', icon: Layers, path: '/inventory', show: hasPermission('view inventory') },
    { name: 'الفروع والقاعات', icon: GitBranch, path: '/branches', show: hasPermission('view branches') },
    { name: 'المستخدمون والصلاحيات', icon: UserPlus, path: '/users', show: hasPermission('manage settings') },
    { name: 'إعدادات الأكاديمية', icon: Settings, path: '/settings', show: hasPermission('manage settings') },
  ]

  // Live KPI metrics from analytics backend
  const kpis = [
    { title: 'إيراد اليوم', value: stats ? `${Math.round(stats.kpis.weekly_revenue / 7).toLocaleString('ar-EG')} جنيه` : '...', change: 'تحصيل اليوم الفعلي', color: 'from-emerald-500 to-teal-500', icon: DollarSign },
    { title: 'الطلاب المشتركين', value: stats ? stats.kpis.active_students.toString() : '...', change: 'إجمالي المشتركين', color: 'from-violet-500 to-indigo-500', icon: Users },
    { title: 'المدرسون بالمركز', value: teacherCount !== null ? `${teacherCount} مدرس` : '...', change: 'أعضاء هيئة التدريس', color: 'from-blue-500 to-sky-500', icon: Award },
    { title: 'نسبة حضور اليوم', value: stats ? `%${stats.kpis.attendance_rate}` : '...', change: 'نسبة حضور فصول اليوم', color: 'from-amber-500 to-orange-500', icon: UserCheck },
  ]

  // Scaler helper: maps revenue amount to Y coordinate (height 240, scale range [40, 220])
  const getScaledY = (amount: number) => {
    const dailyValues = (stats?.daily_revenue || []).map((d: any) => d.revenue)
    const maxVal = Math.max(100, ...dailyValues)
    const percentage = Math.min(amount / maxVal, 1)
    return 220 - percentage * 180
  }

  const chartPoints = stats?.daily_revenue.map((dayData: any, i: number) => ({
    x: 50 + i * 83,
    y: getScaledY(dayData.revenue)
  })) || []

  // Create SVG path string
  let pathD = ''
  if (chartPoints.length > 0) {
    pathD = `M ${chartPoints[0].x} ${chartPoints[0].y}`
    for (let i = 1; i < chartPoints.length; i++) {
      pathD += ` L ${chartPoints[i].x} ${chartPoints[i].y}`
    }
  }

  // Create Area fill string
  const areaD = pathD ? `${pathD} L ${chartPoints[chartPoints.length - 1].x} 220 L ${chartPoints[0].x} 220 Z` : ''

  // Format "16:00:00" as Arabic 12-hour time.
  const formatTime = (t?: string) => {
    if (!t) return ''
    const [h, m] = t.split(':').map(Number)
    const period = h >= 12 ? 'م' : 'ص'
    const hour12 = h % 12 === 0 ? 12 : h % 12
    return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
  }

  // Mock audit logs
  const auditLogs = [
    { id: 1, action: 'Student enrolled', detail: 'David Miller joined Grade 10', time: '10 mins ago', user: 'Receptionist Amanda' },
    { id: 2, action: 'Invoice generated', detail: 'Invoice #INV-9280 generated ($350)', time: '45 mins ago', user: 'Accountant Mark' },
    { id: 3, action: 'Attendance marked', detail: 'Grade 12 Physics marked (98%)', time: '2 hours ago', user: 'Teacher Albert' },
  ]

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Panel */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md flex flex-col justify-between p-6 shrink-0">
        <div className="space-y-8">
          {/* Tenant Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-600/20 border border-violet-200 dark:border-violet-500/30">
              <School className="h-5 w-5 text-violet-700 dark:text-violet-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate leading-tight">{tenant?.name || 'Academy Hub'}</h2>
              <p className="text-xs text-slate-500 truncate">{tenant?.subdomain}.educenter.com</p>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="space-y-1">
            {menuItems.filter(item => item.show).map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                  item.path === '/dashboard'
                    ? 'bg-violet-100 dark:bg-violet-600/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-white dark:bg-slate-900'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer Profile and Logout */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-bold text-violet-700 dark:text-violet-400">
              {user?.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">{user?.name}</p>
              <p className="text-[10px] text-violet-700 dark:text-violet-400 font-semibold uppercase tracking-wider">
                {user?.roles[0] === 'owner' ? 'مالك الأكاديمية' : user?.roles[0] === 'admin' ? 'مدير النظام' : 'عضو'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-300 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950 relative">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 h-[300px] w-[300px] rounded-full bg-violet-100 dark:bg-violet-600/5 blur-[80px] pointer-events-none"></div>
        
        {/* Top Navbar */}
        <header className="relative h-16 border-b border-slate-200 dark:border-slate-900 flex items-center justify-between px-8 z-30 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">لوحة تحكم الأكاديمية</h1>
              <span className="h-4 w-[1px] bg-slate-100 dark:bg-slate-800"></span>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
                النظام شغال ومؤمن
              </span>
            </div>
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            {branches.length > 0 && (
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="rounded-lg bg-white dark:bg-slate-900 border border-slate-850 text-xs font-semibold text-slate-350 px-3 py-1.5 outline-none focus:border-violet-200 dark:focus:border-violet-500/50 transition-all cursor-pointer"
              >
                <option value="">كل الفروع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Workspace Dashboard Content */}
        <div className="flex-1 p-8 space-y-8 z-10">
          {/* Welcome Message */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">أهلاً بيك يا {user?.name.split(' ')[0]} 👋</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">دي نظرة سريعة على اللي بيحصل في فروع مركزك التعليمي النهاردة.</p>
          </div>

          {/* Quick Operations Panel */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/academic"
              className="flex items-center gap-3 rounded-xl border border-violet-200 dark:border-violet-500/10 bg-violet-100 dark:bg-violet-600/5 p-4 hover:bg-violet-100 dark:hover:bg-violet-600/10 transition-all group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-violet-400 group-hover:scale-110 transition-transform">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">الجدول الدراسي والحصص</p>
                <p className="text-[10px] text-slate-500 truncate">تسجيل الحضور والغياب اليومي</p>
              </div>
            </Link>

            <Link
              to="/pos"
              className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-500/10 bg-emerald-100 dark:bg-emerald-600/5 p-4 hover:bg-emerald-100 dark:hover:bg-emerald-600/10 transition-all group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">كاشير البيع السريع (POS)</p>
                <p className="text-[10px] text-slate-500 truncate">بيع الكتب والمستلزمات فورياً</p>
              </div>
            </Link>

            <Link
              to="/financials"
              className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-500/10 bg-amber-100 dark:bg-amber-600/5 p-4 hover:bg-amber-100 dark:hover:bg-amber-600/10 transition-all group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-600/20 text-amber-700 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">الحسابات وحركة الخزنة</p>
                <p className="text-[10px] text-slate-500 truncate">متابعة الإيرادات والمصاريف الإدارية</p>
              </div>
            </Link>

            <Link
              to="/settings"
              className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 hover:bg-white dark:bg-slate-900 transition-all group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform">
                <Settings className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">إعدادات النظام</p>
                <p className="text-[10px] text-slate-500 truncate">سجل حركات الإداريين والرقابة</p>
              </div>
            </Link>
          </section>

          {/* KPIs Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="group relative rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-5 hover:border-slate-200 dark:border-slate-800 transition-all hover:translate-y-[-2px] duration-300"
              >
                {/* Subtle gradient glow on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-600/0 to-indigo-600/0 group-hover:from-violet-600/2 group-hover:to-indigo-600/2 transition-all"></div>
                
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.title}</span>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800`}>
                    <kpi.icon className="h-4 w-4 text-violet-700 dark:text-violet-400" />
                  </div>
                </div>
                
                <div className="mt-4 flex items-baseline gap-2 relative z-10">
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-50">{kpi.value}</span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{kpi.change}</span>
                </div>
              </div>
            ))}
          </section>

          {/* Visual Charts & Today's Schedule Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Custom SVG Line Chart */}
            <div className="xl:col-span-2 rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">أرباح ومبيعات المركز</h3>
                  <p className="text-xs text-slate-500">معدل نمو الإيرادات الأسبوعية</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                  <TrendingUp className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  <span>زيادة بنسبة 8.2% عن الأسبوع اللي فات</span>
                </div>
              </div>
 
              {/* Responsive SVG Chart */}
              <div className="h-64 w-full relative">
                <svg className="w-full h-full" viewBox="0 0 600 240" fill="none">
                  {/* Grid Lines */}
                  <line x1="50" y1="40" x2="550" y2="40" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="50" y1="100" x2="550" y2="100" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="50" y1="160" x2="550" y2="160" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="50" y1="220" x2="550" y2="220" stroke="#334155" />
 
                  {/* Y Axis Labels */}
                  <text x="40" y="44" fill="#64748b" className="text-[10px]" textAnchor="end">2000 ج</text>
                  <text x="40" y="104" fill="#64748b" className="text-[10px]" textAnchor="end">1000 ج</text>
                  <text x="40" y="164" fill="#64748b" className="text-[10px]" textAnchor="end">500 ج</text>
                  <text x="40" y="224" fill="#64748b" className="text-[10px]" textAnchor="end">0 ج</text>
 
                  {/* X Axis Labels */}
                  {stats?.daily_revenue.map((dayData: any, i: number) => {
                    const x = 50 + i * 83
                    return (
                      <text key={i} x={x} y="238" fill="#64748b" className="text-[10px]" textAnchor="middle">
                        {dayData.day}
                      </text>
                    )
                  })}
 
                  {/* Area fill under curve */}
                  {areaD && (
                    <path
                      d={areaD}
                      fill="url(#chartGrad)"
                    />
                  )}
 
                  {/* Line Curve */}
                  {pathD && (
                    <path
                      d={pathD}
                      stroke="#8b5cf6"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  )}
 
                  {/* Data Point Circles */}
                  {chartPoints.map((pt: any, i: number) => (
                    <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#8b5cf6" stroke="#fff" strokeWidth="1.5" />
                  ))}
 
                  {/* Gradients */}
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
 
            {/* Upcoming Sessions Widget */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">محاضرات وحصص اليوم</h3>
                  <p className="text-xs text-slate-500">جدول الحصص والمواعيد</p>
                </div>
                <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer">
                  <Clock className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {sessions.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500">لا توجد حصص مجدولة اليوم.</p>
                ) : (
                  sessions.map((session) => {
                    const time = formatTime(session.start_time)
                    return (
                      <div key={session.id} className="flex gap-4 p-3 rounded-lg bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 transition-all">
                        <div className="text-center font-bold text-violet-700 dark:text-violet-400 border-r border-slate-200 dark:border-slate-800 pr-3 shrink-0 flex flex-col justify-center">
                          <span className="text-xs tracking-tight">{time.split(' ')[0]}</span>
                          <span className="text-[10px] text-slate-500 uppercase">{time.split(' ')[1]}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{session.group?.name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {session.group?.subject?.name}
                            {session.teacher_profile?.user?.name ? ` • ${session.teacher_profile.user.name}` : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Recent Payments and Subscriptions Expiring Soon Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Recent Payments Widget */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-6 space-y-6">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex-1 text-right">آخر عمليات التحصيل (المدفوعات)</h3>
              </div>

              <div className="space-y-4">
                {payments.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500">لا توجد عمليات تحصيل بعد.</p>
                ) : (
                  payments.map((pay: any) => (
                    <div key={pay.id} className="flex justify-between items-center text-xs border-b border-slate-200 dark:border-slate-900 pb-3 last:border-b-0 last:pb-0 text-right">
                      <div className="min-w-0 space-y-1">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{pay.description}</p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(pay.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                        </p>
                      </div>
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 shrink-0" dir="ltr">
                        +{Number(pay.amount).toLocaleString('ar-EG')} ج
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Subscriptions Expiring Soon Widget */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 p-6 space-y-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex-1 text-right">مستحقات لم تُحصّل</h3>
              </div>

              <div className="space-y-4">
                {dueInvoices.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500">لا توجد مستحقات معلقة 🎉</p>
                ) : (
                  dueInvoices.map((inv: any) => {
                    const days = Math.ceil(
                      (new Date(inv.due_date).getTime() - Date.now()) / 86400000
                    )
                    const overdue = days < 0
                    return (
                      <div key={inv.id} className="flex justify-between items-center gap-3 text-xs border-b border-slate-200 dark:border-slate-900 pb-3 last:border-b-0 last:pb-0 text-right">
                        <div className="min-w-0 space-y-1">
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {inv.student_profile?.user?.name || inv.invoice_number}
                          </p>
                          <p className="text-[10px] text-slate-500" dir="ltr">
                            {Number(inv.grand_total).toLocaleString('ar-EG')} ج
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          overdue
                            ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/30 border-red-200 dark:border-red-900/40'
                            : 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40'
                        }`}>
                          {overdue ? `متأخر ${Math.abs(days)} يوم` : `باقي ${days} يوم`}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
