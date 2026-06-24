import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

const ConfirmContext = createContext(null);

const variantStyles = {
  danger: {
    icon: AlertTriangle,
    iconClass: "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300",
    buttonClass:
      "bg-red-600 text-white shadow-lg shadow-red-500/25 hover:bg-red-700",
  },
  success: {
    icon: CheckCircle2,
    iconClass:
      "bg-green-100 text-green-600 dark:bg-green-950/60 dark:text-green-300",
    buttonClass:
      "bg-green-600 text-white shadow-lg shadow-green-500/25 hover:bg-green-700",
  },
  warning: {
    icon: AlertTriangle,
    iconClass:
      "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
    buttonClass:
      "bg-amber-500 text-white shadow-lg shadow-amber-500/25 hover:bg-amber-600",
  },
  info: {
    icon: Info,
    iconClass:
      "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
    buttonClass:
      "bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700",
  },
};

export function ConfirmProvider({ children }) {
  const [confirmState, setConfirmState] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const closeConfirm = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => {
      setConfirmState(null);
      setLeaving(false);
      setLoading(false);
    }, 180);
  }, []);

  const openConfirm = useCallback((options) => {
    setConfirmState({
      title: options.title || "Konfirmasi",
      message: options.message || "Lanjutkan aksi ini?",
      confirmText: options.confirmText || "Ya, Lanjutkan",
      cancelText: options.cancelText || "Batal",
      variant: options.variant || "info",
      onConfirm: options.onConfirm,
    });
  }, []);

  const handleConfirm = async () => {
    if (!confirmState?.onConfirm) {
      closeConfirm();
      return;
    }

    try {
      setLoading(true);
      await confirmState.onConfirm();
      closeConfirm();
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({ openConfirm, closeConfirm }), [
    closeConfirm,
    openConfirm,
  ]);

  const style = variantStyles[confirmState?.variant] || variantStyles.info;
  const Icon = style.icon;

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {confirmState && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/65 px-3 pb-3 backdrop-blur-sm sm:items-center sm:p-6">
          <div
            className={`w-full max-w-md rounded-t-3xl border border-slate-200 bg-white p-4 shadow-2xl transition-all duration-200 ease-out dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl sm:p-6 ${
              leaving
                ? "translate-y-4 scale-95 opacity-0"
                : "translate-y-0 scale-100 opacity-100"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${style.iconClass}`}
              >
                <Icon size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-lg font-black text-slate-950 dark:text-white sm:text-xl">
                  {confirmState.title}
                </h2>
                <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
                  {confirmState.message}
                </p>
              </div>
              <button
                type="button"
                onClick={closeConfirm}
                disabled={loading}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Tutup modal konfirmasi"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {confirmState.cancelText}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className={`inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${style.buttonClass}`}
              >
                {loading ? "Memproses..." : confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error("useConfirm must be used inside ConfirmProvider");
  }

  return context;
}
