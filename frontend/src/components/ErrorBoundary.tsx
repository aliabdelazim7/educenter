import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by boundary:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-screen items-center justify-center bg-slate-950 p-6 text-slate-100 font-sans" dir="rtl">
          <div className="absolute top-0 left-0 h-[300px] w-[300px] rounded-full bg-red-600/5 blur-[100px] pointer-events-none"></div>
          
          <div className="w-full max-w-md rounded-xl border border-red-500/20 bg-slate-950/60 p-8 text-center space-y-6 shadow-2xl relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-50">عذراً، حدث خطأ غير متوقع</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                واجه النظام مشكلة مؤقتة في تحميل بعض العناصر الحالية. يرجى محاولة إعادة تحميل الصفحة للمتابعة.
              </p>
            </div>

            {this.state.error && (
              <div className="rounded-lg bg-red-950/20 border border-red-500/10 p-3 text-left font-mono text-[9px] text-red-300 max-h-32 overflow-y-auto" dir="ltr">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-650 hover:bg-red-600 text-white font-semibold py-3 text-xs transition-all cursor-pointer shadow-lg shadow-red-650/15"
            >
              <RefreshCw className="h-4 w-4" />
              <span>إعادة تحميل الصفحة الآن</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
