import React, { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { Search, Loader2, User, Layers, FileText, X } from 'lucide-react'

interface SearchResults {
  students: any[]
  groups: any[]
  invoices: any[]
  teachers: any[]
}

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null)
      return
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await api.get(`/search?query=${encodeURIComponent(query)}`)
        setResults(res.data.data)
        setOpen(true)
      } catch (err) {
        console.error('Search query failed:', err)
      } finally {
        setLoading(false)
      }
    }, 400) // 400ms debounce delay

    return () => clearTimeout(delayDebounce)
  }, [query])

  const totalResults = results
    ? results.students.length + results.groups.length + results.invoices.length + results.teachers.length
    : 0

  return (
    <div className="relative w-80" ref={dropdownRef} dir="rtl">
      {/* Search Input field */}
      <div className="flex items-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-violet-200 dark:focus-within:border-violet-500/50 px-3 py-1.5 transition-all">
        <Search className="h-4 w-4 text-slate-500 shrink-0 ml-2" />
        <input
          type="text"
          placeholder="ابحث عن طلاب، مجموعات، فواتير..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results) setOpen(true); }}
          className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-650 outline-none text-right"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mr-1">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Floating Results Box */}
      {open && results && (
        <div className="absolute top-11 right-0 w-96 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/95 backdrop-blur-md shadow-2xl p-4 z-50 space-y-4 max-h-[400px] overflow-y-auto text-right">
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
            </div>
          )}

          {!loading && totalResults === 0 && (
            <p className="text-xs text-slate-500 text-center py-4">لا توجد سجلات مطابقة للبحث.</p>
          )}

          {!loading && results.students.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <User className="h-3 w-3 ml-1" /> الطلاب
              </p>
              <div className="space-y-1">
                {results.students.map((student) => (
                  <div key={student.id} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900 text-xs transition-all cursor-pointer">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{student.user.name}</p>
                    <p className="text-[10px] text-slate-500">{student.user.email} • كود: {student.barcode || student.qr_code || 'لا يوجد'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && results.groups.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Layers className="h-3 w-3 ml-1" /> المجموعات الدراسية
              </p>
              <div className="space-y-1">
                {results.groups.map((group) => (
                  <div key={group.id} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900 text-xs transition-all cursor-pointer">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{group.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && results.invoices.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <FileText className="h-3 w-3 ml-1" /> الفواتير والتحصيل
              </p>
              <div className="space-y-1">
                {results.invoices.map((inv) => (
                  <div key={inv.id} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900 text-xs transition-all cursor-pointer">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{inv.invoice_number}</p>
                    <p className="text-[10px] text-slate-500">القيمة: {parseFloat(inv.grand_total).toFixed(2)} ج • الحالة: <span>{inv.status === 'paid' ? 'مدفوعة' : 'غير مدفوعة'}</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
