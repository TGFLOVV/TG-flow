import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Глобальная функция для показа ошибок
let globalToastFunction: any = null;

export const showErrorNotification = (title: string, message: string) => {
  console.log('showErrorNotification вызвана:', { title, message, hasGlobalToast: !!globalToastFunction });
  
  if (globalToastFunction) {
    globalToastFunction({
      title,
      description: message,
      variant: "destructive",
    });
  } else {
    console.error('Toast функция не инициализирована, используем alert:', title, message);
    alert(`${title}: ${message}`);
  }
};

export const showSuccessNotification = (title: string, message: string) => {
  if (globalToastFunction) {
    globalToastFunction({
      title,
      description: message,
      variant: "default",
    });
  }
};

export const useErrorNotifications = () => {
  const { toast } = useToast();

  useEffect(() => {
    console.log('Инициализация глобальной toast функции');
    globalToastFunction = toast;
    
    // Тестовое уведомление для проверки
    setTimeout(() => {
      console.log('Тест системы уведомлений');
      showErrorNotification('Тест', 'Система уведомлений инициализирована');
    }, 1000);

    return () => {
      globalToastFunction = null;
    };
  }, [toast]);

  return { showErrorNotification, showSuccessNotification };
};