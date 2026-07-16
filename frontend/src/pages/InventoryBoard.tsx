import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
  Package,
  Loader2,
  AlertCircle,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string | null
  type: string
  purchase_cost: string
  selling_price: string
  stock: number
  low_stock_threshold: number
}

export const InventoryBoard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Adjust Stock Form States
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState('')
  const [adjustType, setAdjustType] = useState('purchase')
  const [remarks, setRemarks] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await api.get('/products')
      setProducts(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحميل كتالوج المخزن')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await api.post(`/products/${selectedProduct}/adjust-stock`, {
        quantity: parseInt(quantity),
        type: adjustType,
        remarks
      })
      setQuantity('')
      setRemarks('')
      fetchProducts()
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تعديل كمية المخزن')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getProductTypeArabic = (type: string) => {
    switch (type) {
      case 'book': return 'كتاب / ملزمة'
      case 'material': return 'أدوات مكتبية'
      default: return 'أخرى'
    }
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col p-8 overflow-y-auto relative font-sans">
        <div className="absolute top-0 right-0 h-[250px] w-[250px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-900 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">المخزن وجرد الكتب والمستلزمات</h1>
            <p className="text-sm text-slate-400">تابع كميات الكتب، والمستلزمات الدراسية، وسجل حركات التسوية والجرد الدوري.</p>
          </div>
          <Link to="/dashboard" className="text-xs font-semibold text-violet-400 hover:text-violet-300">
            ← العودة للوحة التحكم
          </Link>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-red-950/40 border border-red-500/30 p-4 text-sm text-red-200 mb-6 max-w-5xl">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-5xl">
          {/* Stock Table */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-300">حالة المخزون الحالي</h2>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-xl border border-slate-900 border-dashed p-12 text-center text-slate-500">
                <Package className="h-10 w-10 mx-auto mb-4 text-slate-600" />
                <p className="text-sm font-semibold">لا توجد مستلزمات مسجلة بالمخزن حالياً.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-900 bg-slate-950/40 overflow-hidden">
                <table className="w-full text-right border-collapse text-sm" dir="rtl">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-900/30 text-xs font-bold uppercase text-slate-500 text-right">
                      <th className="px-5 py-3">بيانات الصنف</th>
                      <th className="px-5 py-3">سعر الشراء / البيع</th>
                      <th className="px-5 py-3 text-left">الكمية المتاحة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-xs text-right">
                    {products.map((p) => {
                      const isLowStock = p.stock <= p.low_stock_threshold
                      return (
                        <tr key={p.id} className="hover:bg-slate-900/10 transition-all">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-slate-300">{p.name}</p>
                            <p className="text-[10px] text-slate-500">كود: {p.sku || 'لا يوجد'} • النوع: <span>{getProductTypeArabic(p.type)}</span></p>
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-400" dir="ltr">
                            {parseFloat(p.purchase_cost).toLocaleString('ar-EG')} / <span className="text-violet-400">{parseFloat(p.selling_price).toLocaleString('ar-EG')} ج</span>
                          </td>
                          <td className="px-5 py-3 text-left">
                            <div className="flex items-center justify-end gap-2">
                              {isLowStock && (
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              )}
                              <span className={`font-bold ${p.stock === 0 ? 'text-red-400 font-extrabold' : isLowStock ? 'text-amber-400' : 'text-slate-200'}`}>
                                {p.stock.toLocaleString('ar-EG')} نسخة
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Adjust Stock Form */}
          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-300">تسجيل تسوية للمخزون</h2>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="adjProduct" className="text-xs font-semibold uppercase tracking-wider text-slate-400">اختر الصنف</label>
                <select
                  id="adjProduct"
                  required
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-violet-500/50 transition-all text-right"
                >
                  <option value="">اختر الصنف من القائمة</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock} متوفر)</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="adjQty" className="text-xs font-semibold uppercase tracking-wider text-slate-400">كمية التعديل</label>
                <input
                  id="adjQty"
                  type="number"
                  required
                  placeholder="مثال: +10 أو -3"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-violet-500/50 transition-all text-right"
                />
                <span className="text-[10px] text-slate-500 block leading-tight">اكتب رقماً موجباً للإضافة، ورقماً سالباً للسحب من المخزن.</span>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="adjType" className="text-xs font-semibold uppercase tracking-wider text-slate-400">سبب التسوية</label>
                <select
                  id="adjType"
                  required
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-violet-500/50 transition-all text-right"
                >
                  <option value="purchase">شراء وتوريد كميات (+)</option>
                  <option value="adjustment">جرد دوري وتعديل (+/-)</option>
                  <option value="damage">تالف / هالك (-)</option>
                  <option value="sale">بيع مباشر (-)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="adjRemarks" className="text-xs font-semibold uppercase tracking-wider text-slate-400">ملاحظات وتفاصيل</label>
                <input
                  id="adjRemarks"
                  type="text"
                  placeholder="مثال: فاتورة توريد رقم 8820"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500/50 transition-all text-right"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !selectedProduct}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:bg-violet-800 transition-all cursor-pointer shadow-lg shadow-violet-600/10"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUpDown className="h-4 w-4" />
                )}
                <span>تسجيل حركة التسوية</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
