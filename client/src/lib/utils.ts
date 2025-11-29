import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Universal error notification function
export function showErrorToast(title: string, description?: string) {
  // This will be called by components that import this utility
  if (typeof window !== 'undefined' && (window as any).showToast) {
    (window as any).showToast({
      title,
      description,
      variant: "destructive",
      duration: 5000,
    })
  }
}