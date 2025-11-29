// Import will be handled via dependency injection

export interface ErrorDetails {
  message: string;
  code?: string;
  field?: string;
  status?: number;
}

export interface FormattedError {
  title: string;
  description: string;
  variant: "default" | "destructive";
  priority: "high" | "normal";
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private toastFunction: any = null;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  setToastFunction(toastFn: any) {
    this.toastFunction = toastFn;
  }

  private showToast(error: FormattedError) {
    if (this.toastFunction) {
      this.toastFunction(error);
    } else {
      console.error("Toast function not initialized:", error);
    }
  }

  // Обработка ошибок API
  handleApiError(error: any, context: string = ""): FormattedError {
    let title = "Ошибка";
    let description = "Произошла неожиданная ошибка";
    let priority: "high" | "normal" = "normal";

    if (error?.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          title = "Неверные данные";
          description = data?.message || "Проверьте правильность введенных данных";
          break;
        case 401:
          title = "Требуется авторизация";
          description = "Войдите в систему для продолжения";
          priority = "high";
          break;
        case 403:
          title = "Доступ запрещен";
          description = data?.message || "У вас нет прав для выполнения этого действия";
          priority = "high";
          break;
        case 404:
          title = "Не найдено";
          description = data?.message || "Запрашиваемый ресурс не найден";
          break;
        case 409:
          title = "Конфликт данных";
          description = data?.message || "Данные уже существуют";
          break;
        case 422:
          title = "Ошибка валидации";
          description = data?.message || "Проверьте правильность введенных данных";
          break;
        case 429:
          title = "Слишком много запросов";
          description = "Подождите немного перед повторной попыткой";
          priority = "high";
          break;
        case 500:
          title = "Ошибка сервера";
          description = "Внутренняя ошибка сервера. Попробуйте позже";
          priority = "high";
          break;
        case 502:
        case 503:
        case 504:
          title = "Сервис недоступен";
          description = "Сервер временно недоступен. Попробуйте позже";
          priority = "high";
          break;
        default:
          title = `Ошибка ${status}`;
          description = data?.message || error.message || "Неизвестная ошибка сервера";
      }
    } else if (error?.message) {
      if (error.message.includes("Failed to fetch") || error.message.includes("Network")) {
        title = "Ошибка сети";
        description = "Проверьте подключение к интернету";
        priority = "high";
      } else if (error.message.includes("timeout")) {
        title = "Превышено время ожидания";
        description = "Запрос выполняется слишком долго. Попробуйте позже";
      } else {
        description = error.message;
      }
    }

    if (context) {
      title = `${title} - ${context}`;
    }

    const formattedError: FormattedError = {
      title,
      description,
      variant: "destructive",
      priority
    };

    this.showToast(formattedError);
    this.logError(error, context);

    return formattedError;
  }

  // Обработка ошибок форм
  handleFormError(error: any, formContext: string): { [key: string]: string } {
    let fieldErrors: { [key: string]: string } = {};

    if (error?.response?.data?.errors) {
      // Структурированные ошибки полей
      fieldErrors = error.response.data.errors;
    } else if (error?.response?.data?.message) {
      const message = error.response.data.message;

      // Попытка извлечь поле из сообщения об ошибке
      if (message.includes("email")) {
        fieldErrors.email = message;
      } else if (message.includes("username") || message.includes("логин")) {
        fieldErrors.username = message;
      } else if (message.includes("password") || message.includes("пароль")) {
        fieldErrors.password = message;
      } else {
        // Общая ошибка формы
        this.handleApiError(error, formContext);
      }
    } else {
      this.handleApiError(error, formContext);
    }

    return fieldErrors;
  }

  // Обработка ошибок загрузки данных
  handleQueryError(error: any, queryKey: string) {
    let title = "Ошибка загрузки";
    let description = "Не удалось загрузить данные";

    if (queryKey.includes("/api/channels")) {
      title = "Ошибка загрузки каналов";
      description = "Не удалось загрузить список каналов";
    } else if (queryKey.includes("/api/categories")) {
      title = "Ошибка загрузки категорий";
      description = "Не удалось загрузить категории";
    } else if (queryKey.includes("/api/user")) {
      title = "Ошибка загрузки профиля";
      description = "Не удалось загрузить данные профиля";
    } else if (queryKey.includes("/api/notifications")) {
      title = "Ошибка загрузки уведомлений";
      description = "Не удалось загрузить уведомления";
    }

    const formattedError: FormattedError = {
      title,
      description: error?.message || description,
      variant: "destructive",
      priority: "normal"
    };

    this.showToast(formattedError);
    this.logError(error, `Query: ${queryKey}`);
  }

  // Обработка JavaScript ошибок
  handleJavaScriptError(error: Error, errorInfo?: any) {
    const formattedError: FormattedError = {
      title: "Ошибка приложения",
      description: "Произошла неожиданная ошибка. Попробуйте обновить страницу",
      variant: "destructive",
      priority: "high"
    };

    this.showToast(formattedError);
    this.logError(error, "JavaScript Error", errorInfo);
  }

  // Обработка ошибок Promise
  handlePromiseRejection(reason: any) {
    const formattedError: FormattedError = {
      title: "Ошибка выполнения",
      description: "Операция завершилась с ошибкой. Попробуйте снова",
      variant: "destructive",
      priority: "normal"
    };

    this.showToast(formattedError);
    this.logError(reason, "Promise Rejection");
  }

  // Успешные уведомления
  showSuccess(title: string, description: string) {
    const successNotification: FormattedError = {
      title,
      description,
      variant: "default",
      priority: "normal"
    };

    if (this.toastFunction) {
      this.toastFunction(successNotification);
    }
  }

  // Информационные уведомления
  showInfo(title: string, description: string) {
    this.showSuccess(title, description);
  }

  // Предупреждения
  showWarning(title: string, description: string) {
    const warningNotification: FormattedError = {
      title,
      description,
      variant: "destructive",
      priority: "normal"
    };

    this.showToast(warningNotification);
  }

  // Логирование ошибок
  logError(error: any, context: string, additionalInfo?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      context,
      error: {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        response: error?.response?.data,
        status: error?.response?.status
      },
      additionalInfo,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error("🚨 Error logged:", logEntry);

    // В продакшене можно отправлять на сервер для мониторинга
    if (process.env.NODE_ENV === 'production') {
      // Отправка на сервер логирования (если настроен)
      this.sendErrorToServer(logEntry);
    }
  }

  private async sendErrorToServer(errorLog: any) {
    try {
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorLog),
        credentials: 'include'
      });
    } catch (e) {
      // Тихо игнорируем ошибки логирования
      console.debug("Failed to send error log to server:", e);
    }
  }
}

export const errorHandler = ErrorHandler.getInstance();
export default errorHandler;

// Error handler utility
export function handleError(error: any, context?: string) {
  console.error(context ? `${context}:` : 'Error:', error);

  // You can add more sophisticated error handling here
  // For example, sending errors to a logging service

  return {
    message: error?.message || 'An unexpected error occurred',
    code: error?.code || 'UNKNOWN_ERROR'
  };
}

// export default handleError; // Removed duplicate export