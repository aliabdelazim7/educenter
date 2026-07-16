import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
  ShoppingCart,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  Printer,
  Coins,
  Barcode
} from 'lucide-react'

interface Student {
  id: string
  user: { name: string }
  barcode: string | null
}

interface Product {
  id: string
  name: string
  selling_price: string
  stock: number
}

export const POSRegister: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cashier form state
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash')
  const [discount, setDiscount] = useState('0')

  // Scanner state
  const [barcodeQuery, setBarcodeQuery] = useState('')

  // Submit / Receipt states
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [receiptData, setReceiptData] = useState<any | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resStud, resProd] = await Promise.all([
        api.get('/students'),
        api.get('/products')
      ])
      setStudents(resStud.data.data)
      setProducts(resProd.data.data)
    } catch (err: any) {
      setError('فشل في تحميل البيانات اللازمة للكاشير')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-fill price on product selection
  const handleProductChange = (prodId: string) => {
    setSelectedProduct(prodId)
    const prod = products.find(p => p.id === prodId)
    if (prod) {
      setPayAmount(parseFloat(prod.selling_price).toString())
    } else {
      setPayAmount('')
    }
  }

  // Handle barcode scanner input
  const handleBarcodeSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcodeQuery) return
    setError(null)
    
    // Find student by barcode
    const foundStud = students.find(s => s.barcode === barcodeQuery)
    if (foundStud) {
      setSelectedStudent(foundStud.id)
      setBarcodeQuery('')
    } else {
      // Maybe find product by barcode (or SKU)
      setError('لم يتم العثور على طالب بهذا الباركود.')
    }
  }

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !selectedProduct) {
      setError('يرجى تحديد الطالب والصنف المراد سداده.')
      return
    }
    setCheckoutLoading(true)
    setError(null)
    setReceiptData(null)
    
    try {
      const discountVal = parseFloat(discount) || 0
      const res = await api.post('/pos/checkout', {
        student_profile_id: selectedStudent,
        payment_method: paymentMethod,
        discount_amount: discountVal,
        items: [{ product_id: selectedProduct, quantity: 1 }]
      })

      const checkoutRes = res.data.data
      const studObj = students.find(s => s.id === selectedStudent)
      const prodObj = products.find(p => p.id === selectedProduct)

      setReceiptData({
        invoiceNumber: checkoutRes.invoice.invoice_number,
        studentName: studObj?.user.name || 'طالب عام',
        productName: prodObj?.name || 'صنف مباع',
        originalPrice: payAmount,
        discount: discountVal,
        finalPrice: checkoutRes.invoice.grand_total,
        date: new Date(checkoutRes.payment.payment_date).toLocaleString('ar-EG'),
        paymentMethod: paymentMethod === 'cash' ? 'نقدي (كاش)' : paymentMethod === 'card' ? 'فيزا' : 'تحويل محفظة'
      })

      // Reset form
      setSelectedStudent('')
      setSelectedProduct('')
      setPayAmount('')
      setDiscount('0')
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشلت عملية التحصيل والبيع')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex h-screen w-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col p-8 overflow-y-auto relative" dir="rtl">
        <div className="absolute top-0 left-0 h-[250px] w-[250px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-900 pb-4">
          <div className="space-y-1 text-right">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">كاشير التحصيل السريع</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">سدد اشتراكات الطلاب الشهرية وقم ببيع الكتب والمذكرات في خطوتين فقط.</p>
          </div>
          <Link to="/dashboard" className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center">
            ← لوحة التحكم
          </Link>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-red-950/40 border border-red-500/30 p-4 text-sm text-red-200 mb-6 max-w-5xl text-right">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-6xl">
            {/* Form Column */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/40 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-3">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-violet-400" />
                  <span>تسجيل عملية تحصيل</span>
                </h2>
                
                {/* Barcode scan input */}
                <form onSubmit={handleBarcodeSearch} className="flex gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="امسح باركود الطالب..."
                      value={barcodeQuery}
                      onChange={(e) => setBarcodeQuery(e.target.value)}
                      className="rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1 text-xs text-slate-700 dark:text-slate-300 focus:border-violet-500 outline-none w-40 text-right pr-7"
                    />
                    <Barcode className="absolute right-2 top-2 h-3.5 w-3.5 text-slate-500" />
                  </div>
                </form>
              </div>

              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                {/* Select Student */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">اسم الطالب</label>
                  <select
                    required
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-violet-500 text-right"
                  >
                    <option value="">اختر الطالب...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.user.name}</option>)}
                  </select>
                </div>

                {/* Select Product/Subscription */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">البند المراد تحصيله (اشتراك شهري / كتاب / مذكرة)</label>
                  <select
                    required
                    value={selectedProduct}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-violet-500 text-right"
                  >
                    <option value="">اختر البند...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({parseFloat(p.selling_price).toFixed(0)} جنيه)</option>)}
                  </select>
                </div>

                {/* Price Display and custom edits */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">المبلغ المدفوع (جنيه)</label>
                    <input
                      type="number"
                      required
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-violet-500 text-right font-mono"
                    />
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">الخصم (إن وجد)</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-violet-500 text-right font-mono"
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">طريقة التحصيل</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cash', 'card', 'bank_transfer'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 rounded text-xs font-semibold border transition-all cursor-pointer ${
                          paymentMethod === method
                            ? 'bg-violet-600/10 border-violet-500 text-violet-400'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {method === 'cash' ? 'نقدي (كاش)' : method === 'card' ? 'فيزا' : 'محفظة / تحويل'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={checkoutLoading || !selectedStudent || !selectedProduct}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-violet-850 py-3 font-semibold text-white transition-all cursor-pointer shadow-lg shadow-violet-600/10 text-sm mt-4"
                >
                  {checkoutLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  <span>إتمام التحصيل وتوليد الإيصال</span>
                </button>
              </form>
            </div>

            {/* Receipt Preview Column */}
            <div className="space-y-6">
              {receiptData ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 p-6 space-y-6 shadow-2xl relative print:border-0 print:shadow-none print:p-0">
                  <div className="absolute top-0 right-0 h-[200px] w-[200px] rounded-full bg-emerald-600/5 blur-[80px] pointer-events-none"></div>

                  {/* Receipt Header */}
                  <div className="text-center space-y-1 border-b border-slate-200 dark:border-slate-900 pb-4">
                    <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2 print:hidden" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">إيصال سداد إلكتروني</h3>
                    <p className="text-xs text-slate-500">رقم الفاتورة: {receiptData.invoiceNumber}</p>
                  </div>

                  {/* Receipt Meta */}
                  <div className="space-y-3 text-xs text-right">
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-900/60 pb-2">
                      <span className="text-slate-600 dark:text-slate-400">اسم الطالب</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{receiptData.studentName}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-900/60 pb-2">
                      <span className="text-slate-600 dark:text-slate-400">الصنف / البند</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{receiptData.productName}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-900/60 pb-2">
                      <span className="text-slate-600 dark:text-slate-400">طريقة التحصيل</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{receiptData.paymentMethod}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-900/60 pb-2">
                      <span className="text-slate-600 dark:text-slate-400">تاريخ المعاملة</span>
                      <span className="font-mono text-slate-350" dir="ltr">{receiptData.date}</span>
                    </div>

                    {receiptData.discount > 0 && (
                      <div className="flex justify-between border-b border-slate-200 dark:border-slate-900/60 pb-2">
                        <span className="text-slate-600 dark:text-slate-400">الخصم الممنوح</span>
                        <span className="font-bold text-red-400">-{receiptData.discount} ج</span>
                      </div>
                    )}

                    <div className="flex justify-between pt-2 text-sm font-black text-slate-900 dark:text-slate-100">
                      <span>إجمالي المدفوع</span>
                      <span className="text-emerald-400">{receiptData.finalPrice.toLocaleString('ar-EG')} جنيه مصري</span>
                    </div>
                  </div>

                  {/* Footer Terms */}
                  <p className="text-[10px] text-slate-500 text-center border-t border-slate-200 dark:border-slate-900 pt-3">
                    شكراً لتعاملكم مع مركزنا التعليمي. يرجى الاحتفاظ بالإيصال.
                  </p>

                  {/* Print Button */}
                  <button
                    onClick={handlePrint}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-650 hover:bg-emerald-500 text-white font-semibold py-2.5 text-xs transition-all cursor-pointer shadow-lg shadow-emerald-600/10 print:hidden"
                  >
                    <Printer className="h-4 w-4" />
                    <span>طباعة الفاتورة الفورية</span>
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-900 border-dashed p-16 text-center text-slate-500">
                  <Printer className="h-10 w-10 mx-auto mb-4 text-slate-650" />
                  <p className="text-xs font-semibold">بمجرد إتمام عملية التحصيل، سيظهر إيصال السداد الفوري القابل للطباعة هنا.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
