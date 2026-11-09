import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed top-24 right-4 z-[110] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const bgClasses = isSuccess
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-500/10'
            : isError
            ? 'bg-red-50 text-red-700 border-red-200 shadow-red-500/10'
            : 'bg-blue-50 text-blue-700 border-blue-200 shadow-blue-500/10';
          
          const icon = isSuccess
            ? 'fa-solid fa-circle-check text-emerald-600'
            : isError
            ? 'fa-solid fa-circle-exclamation text-red-600'
            : 'fa-solid fa-circle-info text-blue-600';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl border shadow-lg transition-all duration-300 fade-in ${bgClasses}`}
            >
              <i className={`${icon} text-lg shrink-0`}></i>
              <span className="font-bold text-sm leading-snug flex-1">{toast.message}</span>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Cerrar notificación"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
