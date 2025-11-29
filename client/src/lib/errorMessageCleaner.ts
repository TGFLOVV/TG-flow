// Функция для очистки сообщений об ошибках от технических кодов и префиксов
export function cleanErrorMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return 'Произошла неожиданная ошибка';
  }

  return message
    // Убираем коды статусов HTTP в начале (400:, 500:, etc.)
    .replace(/^\d{3}:\s*/, '')
    // Убираем "Error:" в начале
    .replace(/^Error:\s*/i, '')
    // Убираем "error:" в начале 
    .replace(/^error:\s*/i, '')
    // Убираем "Ошибка:" в начале (если дублируется)
    .replace(/^Ошибка:\s*/i, '')
    // Убираем технические префиксы
    .replace(/^[A-Z_]+_ERROR:\s*/i, '')
    // Убираем коды в скобках в начале [ERROR_CODE]
    .replace(/^\[[A-Z_]+\]\s*/i, '')
    // Убираем лишние пробелы
    .trim()
    // Если после очистки строка пустая, возвращаем дефолтное сообщение
    || 'Произошла неожиданная ошибка';
}

// Функция для извлечения понятного сообщения из объекта ошибки
export function extractErrorMessage(error: any): string {
  let message = '';

  // Сначала пробуем получить сообщение из response.data.message
  if (error?.response?.data?.message) {
    message = error.response.data.message;
  }
  // Затем из error.message
  else if (error?.message) {
    message = error.message;
  }
  // Затем из response.data (если это строка)
  else if (error?.response?.data && typeof error.response.data === 'string') {
    message = error.response.data;
  }
  // Если ничего не найдено, возвращаем дефолтное сообщение
  else {
    message = 'Произошла неожиданная ошибка';
  }

  return cleanErrorMessage(message);
}