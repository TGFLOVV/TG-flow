import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { FixedModal } from "@/components/FixedModal";

interface TelegramLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  botUrl?: string;
  linkToken?: string;
}

export default function TelegramLinkModal({ isOpen, onClose, botUrl, linkToken }: TelegramLinkModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Extract token from botUrl if not provided directly
  const actualToken = linkToken || (botUrl ? botUrl.split('start=link_')[1] : '');
  const linkCommand = `/start link_${actualToken}`;

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(linkCommand);
      setCopied(true);
      toast({
        title: "Команда скопирована",
        description: "Команда скопирована в буфер обмена",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Ошибка копирования",
        description: "Не удалось скопировать команду",
        variant: "destructive",
      });
    }
  };

  const handleOpenBot = () => {
    if (botUrl) {
      window.open(botUrl, '_blank');
    } else {
      window.open('https://t.me/TG_FLOVV_BOT', '_blank');
    }
  };

  return (
    <FixedModal open={isOpen} onOpenChange={onClose} className="max-w-md">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-blue-600" />
          Привязка Telegram
        </h2>
      </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <i className="fab fa-telegram-plane text-2xl sm:text-3xl text-blue-500"></i>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Перейдите в Telegram бота
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 px-2">
              Для привязки аккаунта выполните следующие шаги:
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  1. Откройте бота в Telegram
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Нажмите кнопку ниже для перехода к боту
                </p>
              </div>
              <Button
                onClick={handleOpenBot}
                className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto"
                size="sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Открыть бота
              </Button>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                2. Отправьте команду в боте:
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded border">
                <code className="text-sm font-mono text-gray-900 dark:text-gray-100 flex-1 break-all">
                  {linkCommand}
                </code>
                <Button
                  onClick={handleCopyCommand}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto sm:ml-2"
                >
                  {copied ? (
                    <i className="fas fa-check text-green-500 mr-2"></i>
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copied ? "Скопировано" : "Копировать"}
                </Button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Нажмите кнопку копирования и вставьте команду в чат с ботом
              </p>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-start space-x-2">
                <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-0.5"></i>
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium">Важно:</p>
                  <p className="mt-1">
                    После отправки команды бот автоматически привяжет ваш Telegram аккаунт. 
                    Окно можно закрыть после успешной привязки.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Закрыть
            </Button>
            <Button
              onClick={handleOpenBot}
              className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto order-1 sm:order-2"
            >
              <i className="fab fa-telegram-plane mr-2"></i>
              Перейти к боту
            </Button>
          </div>
        </div>
    </FixedModal>
  );
}