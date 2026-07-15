import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Loader2,
  AlertCircle,
  Package
} from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string | null
  type: string
  selling_price: string
  stock: number
}

interface CartItem {
  product: Product
  quantity: number
}

export const POSRegister: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await api.get('/products')
      setProducts(res.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل في تحميل كتالوج المنتجات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const addToCart = (product: Product) => {
    setSuccessMsg(null)
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          setError(`لا يمكن إضافة كمية أكبر من المتاح بالمخزن (${product.stock})`)
          return prev
        }
        setError(null)
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta
            if (nextQty > item.product.stock) {
              setError(`تم الوصول للحد الأقصى للكمية المتاحة بالمخزن (${item.product.stock})`)
              return item
            }
            setError(null)
            return { ...item, quantity: nextQty }
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  // Cost calculation
  const totalAmount = cart.reduce(
    (sum, item) => sum + parseFloat(item.product.selling_price) * item.quantity,
    0
  )
  const discountVal = parseFloat(discount) || 0
  const grandTotal = Math.max(0, totalAmount - discountVal)

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const items = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }))

      await api.post('/pos/checkout', {
        items,
        discount_amount: discountVal,
        payment_method: paymentMethod,
      })

      setCart([])
      setDiscount('')
      setSuccessMsg('تمت عملية البيع بنجاح وتحديث كميات المخزن!')
      fetchProducts() // refresh stock count
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشلت عملية إتمام البيع')
    } finally {
      setCheckoutLoading(false)
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
      <div className="flex-1 flex flex-col p-8 overflow-y-auto relative">
        <div className="absolute top-0 right-0 h-[250px] w-[250px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-900 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">كاشير البيع السريع (POS)</h1>
            <p className="text-sm text-slate-400">سجل عمليات بيع المستلزمات، والكتب، والكورسات التعليمية للطلاب فورياً.</p>
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

        {successMsg && (
          <div className="flex items-center gap-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-4 text-sm text-emerald-200 mb-6 max-w-5xl">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-6xl">
          {/* Products Grid */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-300">كتالوج المنتجات والمستلزمات</h2>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-xl border border-slate-900 border-dashed p-12 text-center text-slate-500">
                <Package className="h-10 w-10 mx-auto mb-4 text-slate-600" />
                <p className="text-sm font-semibold">لا توجد منتجات للبيع حالياً بالمخزن.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="group relative rounded-xl border border-slate-900 bg-slate-950/40 p-5 hover:border-slate-800 transition-all hover:translate-y-[-2px] duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-200">{p.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">الرمز: {p.sku || 'غير متوفر'} • النوع: <span>{getProductTypeArabic(p.type)}</span></p>
                        
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-sm font-black text-violet-400">{parseFloat(p.selling_price).toLocaleString('ar-EG')} جنيه</span>
                          <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded-full ${
                            p.stock === 0
                              ? 'bg-red-950/20 border-red-900/30 text-red-400'
                              : p.stock <= 5
                              ? 'bg-amber-950/20 border-amber-900/30 text-amber-400'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}>
                            {p.stock === 0 ? 'نفد من المخزن' : `${p.stock} نسخة متوفرة`}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => addToCart(p)}
                        disabled={p.stock === 0}
                        className="h-8 w-8 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-slate-900 disabled:text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-violet-600/10"
                      >
                        <Plus className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Cart Drawer */}
          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
              <ShoppingCart className="h-5 w-5 text-violet-400" />
              <h2 className="text-lg font-bold text-slate-300">سلة المشتريات</h2>
            </div>

            {cart.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-12">أضف بعض المنتجات من الكتالوج للبدء في عملية البيع.</p>
            ) : (
              <div className="space-y-6">
                {/* Cart Items List */}
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center text-xs bg-slate-900/40 p-3 rounded-lg border border-slate-900" dir="rtl">
                      <div className="min-w-0 flex-1 pr-2 text-right">
                        <p className="font-bold text-slate-200 truncate">{item.product.name}</p>
                        <p className="text-[10px] text-slate-500">{parseFloat(item.product.selling_price).toLocaleString('ar-EG')} ج للوحدة</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="h-6 w-6 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="h-6 w-6 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="h-6 w-6 rounded hover:bg-red-950/20 text-slate-500 hover:text-red-400 flex items-center justify-center mr-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotals, Discount, and Payments */}
                <div className="space-y-4 pt-4 border-t border-slate-900 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>المجموع الفرعي</span>
                    <span>{totalAmount.toLocaleString('ar-EG')} جنيه</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">قيمة الخصم (جنيه)</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-20 rounded bg-slate-900 border border-slate-800 px-2 py-1 text-right text-xs outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="flex justify-between text-sm font-bold text-slate-200 pt-2 border-t border-slate-900">
                    <span>إجمالي الفاتورة النهائي</span>
                    <span className="text-violet-400">{grandTotal.toLocaleString('ar-EG')} جنيه</span>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-semibold uppercase text-slate-400">طريقة الدفع</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['cash', 'card', 'bank_transfer'] as const).map((method) => (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={`py-1.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                            paymentMethod === method
                              ? 'bg-violet-600/10 border-violet-500 text-violet-400'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {method === 'cash' ? 'كاش' : method === 'card' ? 'فيزا' : 'حوالة'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 py-3 font-semibold text-white transition-all cursor-pointer shadow-lg shadow-violet-600/10"
                  >
                    {checkoutLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4" />
                    )}
                    <span>إتمام البيع وطباعة الفاتورة</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
