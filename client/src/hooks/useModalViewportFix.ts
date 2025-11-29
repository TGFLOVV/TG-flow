import { useEffect } from 'react';

export const useModalViewportFix = () => {
  useEffect(() => {
    // Блокируем скролл body при открытии модального окна
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);
};