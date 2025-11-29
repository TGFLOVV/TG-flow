import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { FixedModal } from './FixedModal';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
}

export default function SendMessageModal({ isOpen, onClose, userId, userName }: SendMessageModalProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { userId: number; subject: string; message: string }) => {
      return await apiRequest('POST', '/api/messages/send', data);
    },
    onSuccess: () => {
      toast({
        title: 'Успешно',
        description: 'Сообщение отправлено',
      });
      setSubject('');
      setMessage('');
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    },
  });

  const handleSendMessage = () => {
    if (!subject.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Укажите тему сообщения',
        variant: 'destructive',
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите текст сообщения',
        variant: 'destructive',
      });
      return;
    }

    sendMessageMutation.mutate({
      userId,
      subject: subject.trim(),
      message: message.trim(),
    });
  };

  return (
    <FixedModal open={isOpen} onOpenChange={onClose} className="max-w-md">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Отправить сообщение: {userName}
        </h2>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
            Тема сообщения
          </Label>
          <Input
            type="text"
            placeholder="Введите тему"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <Label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
            Сообщение
          </Label>
          <Textarea
            placeholder="Введите текст сообщения"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white resize-none"
          />
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 flex-1 text-white"
          >
            {sendMessageMutation.isPending ? (
              <i className="fas fa-spinner fa-spin mr-2"></i>
            ) : (
              <i className="fas fa-paper-plane mr-2"></i>
            )}
            Отправить
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
          >
            Отмена
          </Button>
        </div>
      </div>
    </FixedModal>
  );
}