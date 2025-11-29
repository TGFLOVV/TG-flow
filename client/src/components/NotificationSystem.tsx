
import React, { useState } from 'react';
import { FixedModal } from '@/components/FixedModal';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface NotificationSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSystem({ isOpen, onClose }: NotificationSystemProps) {
  const { toast } = useToast();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', '/api/notifications');
      } catch (error: any) {
        // Не логируем 401 ошибки для неавторизованных пользователей
        if (error.message?.includes('401') || error.status === 401) {
          return [];
        }
        throw error;
      }
    },
    enabled: isOpen,
    retry: false,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('PATCH', '/api/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      toast({
        title: "Успешно",
        description: "Все уведомления отмечены как прочитанные",
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'balance_topup':
        return 'fas fa-wallet text-green-500';
      case 'application_approved':
        return 'fas fa-check-circle text-green-500';
      case 'application_rejected':
        return 'fas fa-times-circle text-red-500';
      case 'moderator_payment':
        return 'fas fa-coins text-yellow-500';
      case 'withdrawal_approved':
        return 'fas fa-money-bill-wave text-green-500';
      case 'withdrawal_rejected':
        return 'fas fa-exclamation-triangle text-red-500';
      default:
        return 'fas fa-bell text-blue-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'только что';
    if (diffInMins < 60) return `${diffInMins} мин. назад`;
    if (diffInHours < 24) return `${diffInHours} ч. назад`;
    if (diffInDays < 7) return `${diffInDays} дн. назад`;
    
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const unreadNotifications = notifications.filter((n: any) => !n.isRead);

  return (
    <FixedModal open={isOpen} onOpenChange={onClose} className="max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Уведомления
          </h2>
          {unreadNotifications.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {markAllAsReadMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-1"></i>
                  Отмечаем...
                </>
              ) : (
                <>
                  <i className="fas fa-check-double mr-1"></i>
                  Прочитать все
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          У вас {notifications.length} уведомлений, {unreadNotifications.length} непрочитанных
        </p>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-bell-slash text-4xl text-gray-300 dark:text-gray-600 mb-3"></i>
            <p className="text-gray-500 dark:text-gray-400">Уведомлений пока нет</p>
          </div>
        ) : (
          notifications.map((notification: any) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                notification.isRead
                  ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
              }`}
              onClick={() => {
                if (!notification.isRead) {
                  markAsReadMutation.mutate(notification.id);
                }
              }}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <i className={`${getNotificationIcon(notification.type)} text-lg`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={onClose}
          variant="outline"
          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Закрыть
        </Button>
      </div>
    </FixedModal>
  );
}
