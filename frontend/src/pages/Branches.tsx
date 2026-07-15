import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { GitBranch, MapPin, Phone, Plus, Loader2, AlertCircle, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface Branch {
  id: string
  name: string
  address: string | null
  phone: string | null
}

export const Branches: React.FC = () => {
  const { tenant } = useAuth()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form states
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchBranches = async () => {
    try {
      setLoading(true)
      const res = await api.get('/branches')
      setBranches(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحميل الفروع')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await api.post('/branches', { name, address, phone })
      setName('')
      setAddress('')
      setPhone('')
      fetchBranches()
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في إنشاء الفرع')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الفرع نهائياً؟')) return
    try {
      await api.delete(`/branches/${id}`)
      fetchBranches()
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في حذف الفرع')
    }
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 h-[250px] w-[250px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none"></div>

        {/* Page Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-900 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">إدارة فروع الأكاديمية</h1>
            <p className="text-sm text-slate-400">اضبط الفروع والمقرات الفعلية التابعة لأكاديمية {tenant?.name}.</p>
          </div>
          <Link
            to="/dashboard"
            className="text-xs font-semibold text-violet-400 hover:text-violet-300"
          >
            ← العودة للوحة التحكم
          </Link>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-red-950/40 border border-red-500/30 p-4 text-sm text-red-200 mb-6 max-w-4xl">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-6xl">
          {/* List of Branches */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-300 mb-2">الفروع الحالية</h2>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            ) : branches.length === 0 ? (
              <div className="rounded-xl border border-slate-900 border-dashed p-12 text-center text-slate-500">
                <GitBranch className="h-10 w-10 mx-auto mb-4 text-slate-600" />
                <p className="text-sm font-semibold">لا توجد فروع مضافة حالياً.</p>
                <p className="text-xs text-slate-600 mt-1">استخدم النموذج الجانبي لإضافة أول فرع لمركزك.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="group relative rounded-xl border border-slate-900 bg-slate-950/40 p-5 hover:border-slate-800 transition-all hover:translate-y-[-2px] duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-200">{branch.name}</h3>
                        {branch.address && (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[200px]">{branch.address}</span>
                          </div>
                        )}
                        {branch.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span>{branch.phone}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDelete(branch.id)}
                        className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-red-950 hover:bg-red-950/10 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Branch Panel */}
          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-300">إضافة فرع جديد</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  اسم الفرع
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="مثال: فرع وسط البلد"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all text-right"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="address" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  العنوان بالتفصيل
                </label>
                <input
                  id="address"
                  type="text"
                  placeholder="مثال: شارع التحرير، الدقي"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all text-right"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  رقم تليفون الفرع
                </label>
                <input
                  id="phone"
                  type="text"
                  placeholder="مثال: 01023456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all text-right"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:bg-violet-800 disabled:text-slate-400 transition-all cursor-pointer shadow-lg shadow-violet-600/10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>جاري إضافة الفرع...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>إضافة الفرع</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
