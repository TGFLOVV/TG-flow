import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { FixedModal } from '@/components/FixedModal';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SupportMessage {
  id: number;
  chatId: string;
  userId: number;
  message: string;
  isFromAdmin: boolean;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  adminUser?: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

interface SupportChat {
  chatId: string;
  userId: number;
  lastMessage: string;
  unreadCount: number;
  lastMessageAt: string;
  user: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

export default function SupportButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<SupportChat | null>(null);
  const [message, setMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'admin';

  // Получаем данные в зависимости от роли пользователя
  const { data: supportData, isLoading: supportLoading, refetch } = useQuery({
    queryKey: isAdmin ? ['/api/support/chats'] : ['/api/support/messages'],
    queryFn: async () => {
      if (isAdmin) {
        return await apiRequest('GET', '/api/support/chats');
      } else {
        return await apiRequest('GET', '/api/support/messages');
      }
    },
    enabled: !!user && isOpen,
    refetchInterval: 5000, // Обновляем каждые 5 секунд
  });

  // Мутация для отправки сообщений
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message?: string; file?: File; chatId?: string }) => {
      const formData = new FormData();
      if (data.message) formData.append('message', data.message);
      if (data.file) formData.append('file', data.file);
      if (data.chatId) formData.append('chatId', data.chatId);

      return await apiRequest('POST', '/api/support/messages', formData);
    },
    onSuccess: () => {
      setMessage('');
      setSelectedFile(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/support/chats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/support/messages'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    },
  });

  // Мутация для отметки как прочитанные
  const markAsReadMutation = useMutation({
    mutationFn: async (role: string) => {
      return await apiRequest('POST', '/api/support/mark-read', { role });
    },
  });

  // Получаем количество непрочитанных сообщений
  const { data: unreadData } = useQuery({
    queryKey: ['/api/support/unread-count'],
    queryFn: () => apiRequest('GET', '/api/support/unread-count'),
    enabled: !!user && !isOpen,
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  useEffect(() => {
    if (unreadData?.count) {
      setUnreadCount(unreadData.count);
    }
  }, [unreadData]);

  const handleOpenDialog = () => {
    setIsOpen(true);
    if (isAdmin && unreadCount > 0) {
      markAsReadMutation.mutate('admin');
    } else if (!isAdmin && unreadCount > 0) {
      markAsReadMutation.mutate('user');
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() && !selectedFile) {
      toast({
        title: 'Ошибка',
        description: 'Введите сообщение или выберите файл',
        variant: 'destructive',
      });
      return;
    }

    if (message.length > 1000) {
      toast({
        title: 'Ошибка',
        description: 'Сообщение не должно превышать 1000 символов',
        variant: 'destructive',
      });
      return;
    }

    sendMessageMutation.mutate({
      message: message.trim() || undefined,
      file: selectedFile || undefined,
      chatId: selectedChat?.chatId || undefined,
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Ошибка',
          description: 'Размер файла не должен превышать 10MB',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  const getUserDisplayName = (user: any) => {
    if (!user) return 'Пользователь';
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.username) {
      return `@${user.username}`;
    }
    return 'Пользователь';
  };

  const getUserInitials = (user: any) => {
    if (!user) return 'П';
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user?.username) {
      return user.username[0].toUpperCase();
    }
    return 'П';
  };

  if (!user) return null;

  return (
    <>
      {/* Кнопка поддержки */}
      <div className="fixed bottom-4 right-4 z-50 support-button-safe">
        <Button
          onClick={handleOpenDialog}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200 relative"
        >
          <i className="fas fa-headset text-xl"></i>
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-6 h-6 flex items-center justify-center rounded-full"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Главное модальное окно */}
      <FixedModal open={isOpen} onOpenChange={setIsOpen} className="max-w-4xl p-0">
        <div className="flex flex-col h-[600px]">
          {/* Заголовок */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              <i className="fas fa-headset mr-3 text-blue-600"></i>
              Техническая поддержка
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {isAdmin ? 'Управление обращениями пользователей' : 'Свяжитесь с нами для получения помощи'}
            </p>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Список чатов для админа */}
            {isAdmin && (
              <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">Обращения</h3>
                </div>
                <ScrollArea className="flex-1 h-full">
                  {supportLoading ? (
                    <div className="p-4 text-center">
                      <i className="fas fa-spinner fa-spin text-gray-400"></i>
                      <p className="text-sm text-gray-500 mt-2">Загрузка...</p>
                    </div>
                  ) : supportData?.length > 0 ? (
                    <div className="space-y-1 p-2">
                      {supportData.map((chat: SupportChat) => (
                        <div
                          key={chat.chatId}
                          onClick={() => setSelectedChat(chat)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedChat?.chatId === chat.chatId
                              ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <Avatar className="w-10 h-10 flex-shrink-0">
                              <AvatarImage src={chat?.user?.profileImageUrl || ''} />
                              <AvatarFallback className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                {getUserInitials(chat?.user)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {getUserDisplayName(chat?.user)}
                                </p>
                                {chat?.unreadCount > 0 && (
                                  <Badge className="bg-red-500 text-white text-xs">
                                    {chat.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                {chat?.lastMessage || 'Нет сообщений'}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {chat?.lastMessageAt ? `${formatDate(chat.lastMessageAt)} ${formatTime(chat.lastMessageAt)}` : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <i className="fas fa-inbox text-gray-400 text-2xl mb-2"></i>
                      <p className="text-sm text-gray-500">Нет обращений</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {/* Область сообщений */}
            <div className={`flex flex-col ${isAdmin ? 'flex-1' : 'w-full'}`}>
              {/* Сообщения */}
              <ScrollArea className="flex-1 p-4">
                {supportLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <i className="fas fa-spinner fa-spin text-gray-400 text-2xl mb-2"></i>
                      <p className="text-gray-500">Загрузка сообщений...</p>
                    </div>
                  </div>
                ) : (isAdmin && !selectedChat) ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <i className="fas fa-comments text-gray-400 text-3xl mb-3"></i>
                      <p className="text-gray-500 text-lg">Выберите чат</p>
                      <p className="text-gray-400 text-sm">Выберите обращение из списка слева</p>
                    </div>
                  </div>
                ) : supportData?.length > 0 ? (
                  <div className="space-y-4">
                    {(isAdmin ? 
                      supportData.find((chat: SupportChat) => chat?.chatId === selectedChat?.chatId)?.messages || [] 
                      : supportData || []
                    ).map((msg: SupportMessage) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          (isAdmin && msg.isFromAdmin) || (!isAdmin && !msg.isFromAdmin)
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                            (isAdmin && msg.isFromAdmin) || (!isAdmin && !msg.isFromAdmin)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          }`}
                        >
                          {msg.message.includes('[Изображение:') ? (
                            <div
                              onClick={() => setViewingImage(msg.message.match(/\[Изображение: (.+?)\]/)?.[1] || '')}
                              className="cursor-pointer"
                            >
                              <div className="bg-white/10 rounded-lg p-3 text-center">
                                <i className="fas fa-image text-2xl mb-2"></i>
                                <p className="text-xs">
                                  {msg.message.match(/\[Файл: (.+?)\]/)?.[1] || 'Изображение'}
                                </p>
                                <p className="text-xs opacity-70">Нажмите для просмотра</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          )}
                          <p className={`text-xs mt-2 ${
                            (isAdmin && msg.isFromAdmin) || (!isAdmin && !msg.isFromAdmin)
                              ? 'text-blue-100'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {formatDate(msg.createdAt)} {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <i className="fas fa-comment-dots text-gray-400 text-3xl mb-3"></i>
                      <p className="text-gray-500 text-lg">Начните общение</p>
                      <p className="text-gray-400 text-sm">Отправьте первое сообщение нашей поддержке</p>
                    </div>
                  </div>
                )}
              </ScrollArea>

              {/* Область ввода */}
              {(!isAdmin || selectedChat) && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                  {/* Выбранный файл */}
                  {selectedFile && (
                    <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <i className="fas fa-paperclip text-gray-400"></i>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={removeFile}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <i className="fas fa-times"></i>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Поле ввода сообщения */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Textarea
                        value={message}
                        onChange={(e) => {
                          if (e.target.value.length <= 1000) {
                            setMessage(e.target.value);
                          }
                        }}
                        placeholder="Введите ваше сообщение..."
                        rows={3}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white resize-none pr-20"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        {message.length}/1000
                      </div>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.txt"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <i className="fas fa-paperclip mr-2"></i>
                          Файл
                        </Button>
                      </div>

                      <Button
                        onClick={handleSendMessage}
                        disabled={sendMessageMutation.isPending || (!message.trim() && !selectedFile)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {sendMessageMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Отправка...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane mr-2"></i>
                            Отправить
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </FixedModal>

      {/* Модальное окно для просмотра изображений */}
      <FixedModal open={!!viewingImage} onOpenChange={() => setViewingImage(null)} className="max-w-4xl">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Просмотр изображения</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewingImage(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
          {viewingImage && (
            <div className="text-center">
              <img
                src={viewingImage}
                alt="Просмотр"
                className="max-w-full max-h-96 mx-auto rounded-lg border border-gray-200 dark:border-gray-700"
              />
            </div>
          )}
        </div>
      </FixedModal>
    </>
  );
}
