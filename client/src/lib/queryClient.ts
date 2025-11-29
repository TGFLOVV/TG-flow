import { QueryClient, QueryCache, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const errorData = await res.json();
      const message = errorData.message || errorData.error || errorData.details || res.statusText;
      throw new Error(message);
    } catch (parseError) {
      const text = await res.text();
      const message = text || res.statusText || 'Произошла ошибка';
      throw new Error(message);
    }
  }
}

export async function apiRequest(
  method: string,
  path: string,
  body?: any
): Promise<any> {


  const url = `${path}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);


    if (!response.ok) {
      const errorText = await response.text();
      let errorData;

      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }

      // Создаем ошибку в формате, совместимом с axios
      const apiError = new Error(errorData.message || 'API Error');
      apiError.name = 'APIError';
      (apiError as any).response = {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      };

      console.error('API Error details:', {
        url,
        method,
        status: response.status,
        statusText: response.statusText,
        errorData,
        body
      });
      
      throw apiError;
    }

    const text = await response.text();

    if (!text) {
      return null;
    }

    try {
      const parsed = JSON.parse(text);
      return parsed;
    } catch (error) {
      return text;
    }
  } catch (error) {


    // Обрабатываем различные типы ошибок
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      const networkError = new Error('Сетевая ошибка: проверьте подключение к интернету');
      networkError.name = 'NetworkError';
      throw networkError;
    }

    if (error instanceof Error) {
      throw error;
    }

    // Fallback для неизвестных ошибок
    const unknownError = new Error('Произошла неизвестная ошибка при выполнении запроса');
    unknownError.name = 'UnknownError';
    throw unknownError;
  }
}



type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return undefined;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 15 * 60 * 1000, // 15 минут кеширования
      gcTime: 30 * 60 * 1000, // 30 минут в памяти
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      // Импортируем error handler для обработки ошибок запросов
      import('../lib/errorHandler').then(({ errorHandler }) => {
        errorHandler.handleQueryError(error, query.queryKey[0] as string);
      });
    },
  }),
});
