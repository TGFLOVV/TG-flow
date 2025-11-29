import { useToast } from "@/hooks/use-toast";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Add class to body when toasts are present
    if (toasts.length > 0) {
      document.body.classList.add('has-toasts');
    } else {
      document.body.classList.remove('has-toasts');
    }
    
    return () => {
      document.body.classList.remove('has-toasts');
    };
  }, [toasts.length]);

  if (!mounted || toasts.length === 0) return null;

  const toastContent = (
    <div 
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 999999999,
        width: 'auto',
        maxWidth: 'calc(100vw - 40px)',
        pointerEvents: 'none',
        isolation: 'isolate',
      }}
    >
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`
            toast-item relative p-4 border pointer-events-auto
            ${toast.variant === "destructive" 
              ? "bg-red-600 border-red-700 text-white" 
              : "bg-white border-gray-200 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50"
            }
          `}
          style={{
            zIndex: 999999999 + index,
            pointerEvents: 'auto',
            marginBottom: '12px',
            minWidth: '320px',
            maxWidth: '400px',
          }}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-2">
              {toast.title && (
                <h4 className="font-semibold text-sm mb-1">{toast.title}</h4>
              )}
              {toast.description && (
                <p className="text-sm opacity-90">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className={`
                flex-shrink-0 ml-2 transition-colors rounded-md p-1 hover:bg-opacity-20
                ${toast.variant === "destructive" 
                  ? "text-red-200 hover:text-red-100 hover:bg-red-500" 
                  : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }
              `}
              aria-label="Закрыть уведомление"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {toast.action && (
            <div className="mt-3">
              {toast.action}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return createPortal(toastContent, document.body);
}