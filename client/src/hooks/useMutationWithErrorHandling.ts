import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { errorHandler } from '@/lib/errorHandler';

interface MutationWithErrorHandlingOptions<TData, TError, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'onError'> {
  showErrorToast?: boolean;
  contextName?: string;
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void;
}

export function useMutationWithErrorHandling<TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
  options: MutationWithErrorHandlingOptions<TData, TError, TVariables, TContext>
) {
  const { showErrorToast = true, contextName = '', onError, ...mutationOptions } = options;

  return useMutation({
    ...mutationOptions,
    onError: (error: TError, variables: TVariables, context: TContext | undefined) => {
      // Вызываем пользовательский обработчик ошибок, если он есть
      if (onError) {
        onError(error, variables, context);
      }

      // Показываем toast с ошибкой, если включено
      if (showErrorToast) {
        errorHandler.handleApiError(error, contextName);
      }
    },
  });
}

export default useMutationWithErrorHandling;