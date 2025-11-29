
import { useEffect, useRef, useCallback } from 'react';

export const useRenderOptimization = () => {
  const rafIdRef = useRef<number>();
  
  const throttledCallback = useCallback((callback: () => void) => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    rafIdRef.current = requestAnimationFrame(callback);
  }, []);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return { throttledCallback };
};

export const useMemoryOptimization = () => {
  useEffect(() => {
    // Очистка неиспользуемых изображений из кеша
    const cleanupImages = () => {
      const images = document.querySelectorAll('img[data-loaded="true"]');
      images.forEach((img) => {
        const rect = img.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight + 1000 && 
                         rect.bottom > -1000;
        
        if (!isVisible) {
          img.removeAttribute('src');
          img.removeAttribute('data-loaded');
        }
      });
    };

    const interval = setInterval(cleanupImages, 30000); // Каждые 30 секунд
    
    return () => clearInterval(interval);
  }, []);
};
