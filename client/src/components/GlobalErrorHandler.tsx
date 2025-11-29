import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { errorHandler } from '@/lib/errorHandler';

export default function GlobalErrorHandler() {
  const { toast } = useToast();

  useEffect(() => {
    console.log('Инициализация GlobalErrorHandler с toast функцией');
    
    // Инициализируем error handler с toast функцией
    errorHandler.setToastFunction(toast);
    
    // Делаем toast функцию доступной глобально для резервного использования
    (window as any).showToast = toast;

    // Глобальный обработчик JavaScript ошибок
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Global JavaScript Error:', event.error);
      errorHandler.handleJavaScriptError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    // Глобальный обработчик отклоненных промисов
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      errorHandler.handlePromiseRejection(event.reason);
    };

    // Обработчик ошибок ресурсов (изображения, скрипты и т.д.)
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target?.tagName === 'IMG') {
        console.warn('Image failed to load:', (target as HTMLImageElement).src);
        // Не показываем toast для ошибок загрузки изображений, только логируем
      } else if (target?.tagName === 'SCRIPT') {
        console.error('Script failed to load:', (target as HTMLScriptElement).src);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить необходимые компоненты",
          variant: "destructive"
        });
      }
    };

    // Добавляем слушатели событий
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleResourceError, true); // true для capture phase

    // Перехват console.error для логирования
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      originalConsoleError.apply(console, args);
      
      // Логируем в наш error handler, но не показываем toast
      // чтобы избежать дублирования уведомлений
      if (args[0] && typeof args[0] === 'string' && !args[0].includes('🚨')) {
        try {
          errorHandler.logError(
            new Error(args.join(' ')),
            'Console Error'
          );
        } catch (e) {
          // Ignore logging errors to prevent recursion
        }
      }
    };

    // Очистка при размонтировании
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleResourceError, true);
      console.error = originalConsoleError;
      // Очищаем глобальную ссылку
      delete (window as any).showToast;
    };
  }, [toast]);

  return null; // Этот компонент ничего не рендерит
}