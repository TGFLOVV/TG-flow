
import { useState, useCallback, useEffect } from "react";

type ToastType = "default" | "destructive";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastType;
  action?: any;
}

const toasts: Toast[] = [];
const listeners: ((toasts: Toast[]) => void)[] = [];

let toastIdCounter = 0;

function genId() {
  toastIdCounter = (toastIdCounter + 1) % Number.MAX_SAFE_INTEGER;
  return toastIdCounter.toString();
}

function addToast(toast: Omit<Toast, "id">) {
  const id = genId();
  const newToast = { ...toast, id };
  toasts.push(newToast);
  listeners.forEach((listener) => listener([...toasts]));
  
  setTimeout(() => removeToast(id), 4000);
  
  return id;
}

function removeToast(id: string) {
  const index = toasts.findIndex((toast) => toast.id === id);
  if (index > -1) {
    toasts.splice(index, 1);
    listeners.forEach((listener) => listener([...toasts]));
  }
}

export function useToast() {
  const [toastsList, setToastsList] = useState<Toast[]>(() => [...toasts]);

  const toast = useCallback(({ ...props }: Omit<Toast, "id">) => {
    return addToast(props);
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      removeToast(toastId);
    }
  }, []);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setToastsList(newToasts);
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    toast,
    dismiss,
    toasts: toastsList,
  };
}
