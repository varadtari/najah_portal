import { useCallback, useEffect, useState, type ReactNode } from 'react'

import { ToastContext, type ToastKind } from './toast-context'

type ToastState = { id: number; text: string; kind: ToastKind } | null

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null)

  const show = useCallback((text: string, kind: ToastKind = 'success') => {
    setToast({ id: Date.now(), text, kind })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), toast.kind === 'error' ? 4000 : 2300)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" role="status">
        {toast && (
          <div key={toast.id} className={toast.kind === 'error' ? 'toast error' : 'toast'}>
            {toast.text}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
