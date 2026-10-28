"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

type ToastTone = "success" | "error";
type Toast = { id: number; tone: ToastTone; message: string };

type ToastContextValue = {
  push: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast moet binnen ToastProvider gebruikt worden.");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((message: string, tone: ToastTone = "success") => {
    const id = ++idRef.current;
    // Huisstijl v1.1: max. 3 tegelijk; een fout blijft 8s staan, de rest 5s.
    setToasts((current) => [...current, { id, tone, message }].slice(-3));
    setTimeout(
      () => {
        setToasts((current) => current.filter((t) => t.id !== id));
      },
      tone === "error" ? 8000 : 5000
    );
  }, []);

  const dismiss = (id: number) => setToasts((current) => current.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:w-full sm:max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="toast-enter pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-surface-raised p-4 shadow-lg dark:border-border-dark dark:bg-surface-dark"
          >
            {toast.tone === "success" ? (
              <CheckCircle2 size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-status-done dark:text-status-done-dark" />
            ) : (
              <XCircle size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-status-danger dark:text-status-danger-dark" />
            )}
            <p className="flex-1 text-sm">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Melding sluiten"
              className="shrink-0 text-ink-muted transition-colors hover:text-ink dark:text-ink-dark-muted dark:hover:text-ink-dark"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
