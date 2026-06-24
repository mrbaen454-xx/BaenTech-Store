import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";

const ToastContext = createContext(null);

const toastStyles = {
  success: {
    icon: CheckCircle2,
    className:
      "border-green-200 bg-green-50 text-green-800 dark:border-green-900/60 dark:bg-green-950/70 dark:text-green-200",
  },
  error: {
    icon: XCircle,
    className:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/70 dark:text-red-200",
  },
  warning: {
    icon: AlertTriangle,
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/70 dark:text-amber-200",
  },
  info: {
    icon: Info,
    className:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/70 dark:text-blue-200",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) =>
      current.map((toast) =>
        toast.id === id ? { ...toast, leaving: true } : toast,
      ),
    );

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 220);
  }, []);

  const showToast = useCallback(
    ({ type = "info", message, title, duration = 4000 }) => {
      if (!message) return null;

      const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

      setToasts((current) => [
        ...current,
        {
          id,
          type: toastStyles[type] ? type : "info",
          title,
          message,
          leaving: false,
        },
      ]);

      if (duration > 0) {
        window.setTimeout(() => dismissToast(id), duration);
      }

      return id;
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({ showToast, dismissToast }),
    [dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[90] flex flex-col items-center gap-3 px-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-[380px] sm:items-stretch sm:px-0">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type] || toastStyles.info;
          const Icon = style.icon;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto w-full max-w-[calc(100vw-1.5rem)] rounded-2xl border p-3 shadow-xl shadow-slate-900/10 backdrop-blur transition-all duration-200 ease-out sm:max-w-none sm:p-4 ${
                style.className
              } ${
                toast.leaving
                  ? "-translate-y-2 scale-95 opacity-0 sm:translate-x-4 sm:translate-y-0"
                  : "translate-y-0 scale-100 opacity-100 sm:translate-x-0"
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon size={20} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  {toast.title && (
                    <p className="text-sm font-black">{toast.title}</p>
                  )}
                  <p className="break-words text-sm font-bold leading-5">
                    {toast.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="shrink-0 rounded-full p-1 opacity-70 transition hover:bg-white/50 hover:opacity-100 active:scale-95 dark:hover:bg-white/10"
                  aria-label="Tutup notifikasi"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
