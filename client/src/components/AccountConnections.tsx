import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import TelegramLinkModal from "@/components/TelegramLinkModal";
import { Link, Unlink } from "lucide-react";

export default function AccountConnections() {
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [telegramBotUrl, setTelegramBotUrl] = useState("");
  const { toast } = useToast();

  const { data: userData } = useQuery({
    queryKey: ["/api/user"],
  });

  // Обработка параметров URL для отображения сообщений об ошибках и успехе
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');

    // Only process if there are actual parameters to handle
    if (!error && !success) return;

    if (error) {
      let errorMessage = "Произошла ошибка";

      switch (error) {
        case 'google_already_linked_to_other':
          errorMessage = "Этот Google аккаунт уже привязан к другому пользователю";
          break;
        case 'user_already_has_google':
          errorMessage = "К вашему аккаунту уже привязан другой Google аккаунт";
          break;
        case 'email_has_different_google':
          errorMessage = "К этому email уже привязан другой Google аккаунт";
          break;
        default:
          errorMessage = "Ошибка привязки Google аккаунта";
      }

      toast({
        title: "Ошибка привязки",
        description: errorMessage,
        variant: "destructive",
      });
    }

    if (success === 'google_linked') {
      toast({
        title: "Успешно!",
        description: "Google аккаунт успешно привязан к вашему профилю",
      });

      // Обновляем данные пользователя
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    }

    // Очищаем URL только если были параметры
    if (error || success) {
      const newUrl = window.location.pathname;
      if (window.location.href !== newUrl) {
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []); // Remove toast dependency to prevent loops

  const linkTelegramMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/telegram/link", {}),
    onSuccess: (data: any) => {
      if (data.botUrl) {
        setTelegramBotUrl(data.botUrl);
        setShowTelegramModal(true);
      }
    },
    onError: (error: any) => {
      console.error("Error linking Telegram:", error);
      let errorMessage = "Не удалось создать ссылку для привязки";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.status === 401) {
        errorMessage = "Сессия истекла. Войдите в систему заново";
      } else if (error?.response?.status === 409) {
        errorMessage = "Telegram аккаунт уже привязан к другому пользователю";
      } else if (error?.response?.status === 400) {
        errorMessage = "Некорректные данные для привязки Telegram";
      }

      toast({
        title: "Ошибка привязки Telegram", 
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const unlinkTelegramMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/telegram/unlink", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Telegram отвязан",
        description: "Ваш Telegram аккаунт успешно отвязан",
      });
    },
    onError: (error: any) => {
      console.error("Error unlinking Telegram:", error);
      let errorMessage = "Не удалось отвязать Telegram аккаунт";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.status === 401) {
        errorMessage = "Сессия истекла. Войдите в систему заново";
      } else if (error?.response?.status === 404) {
        errorMessage = "Telegram аккаунт не привязан к профилю";
      } else if (error?.response?.status === 400) {
        errorMessage = "Некорректный запрос на отвязку";
      }

      toast({
        title: "Ошибка отвязки Telegram",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleLinkTelegram = () => {
    linkTelegramMutation.mutate();
  };

  const handleUnlinkTelegram = () => {
    unlinkTelegramMutation.mutate();
  };

  return (
    <>
      <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Привязанные аккаунты</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Управляйте подключенными внешними аккаунтами для удобного входа
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Telegram Account */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16c-.18 1.896-.96 6.728-1.356 8.92-.168.93-.5 1.24-.82 1.27-.697.06-1.226-.46-1.9-.9-1.056-.69-1.653-1.12-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.53 5.831-2.538 6.998-3.024 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.32.023.464.138.121.097.155.228.171.32.016.092.036.301.02.465z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                    Telegram
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(userData as any)?.telegramId ? (
                      `Привязан как @${(userData as any)?.telegramUsername || 'пользователь'}`
                    ) : (
                      'Привяжите Telegram для быстрого входа'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {(userData as any)?.telegramId ? (
                  <Button
                    onClick={handleUnlinkTelegram}
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                    disabled={unlinkTelegramMutation.isPending}
                  >
                    <Unlink className="h-4 w-4 mr-1" />
                    {unlinkTelegramMutation.isPending ? "Отвязка..." : "Отвязать"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleLinkTelegram}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={linkTelegramMutation.isPending}
                  >
                    <Link className="h-4 w-4 mr-1" />
                    {linkTelegramMutation.isPending ? "Привязка..." : "Привязать"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Google Account */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                    Google
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(userData as any)?.googleId ? (
                      'Привязан к Google аккаунту'
                    ) : (
                      'Привяжите Google для удобного входа'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {(userData as any)?.googleId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-300 text-green-600 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20"
                    disabled
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Привязан
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      // Сохраняем в сессии информацию о попытке привязки
                      fetch('/api/auth/google', {
                        method: 'GET',
                        credentials: 'include'
                      }).then(() => {
                        window.location.href = '/api/auth/google';
                      }).catch(() => {
                        window.location.href = '/api/auth/google';
                      });
                    }}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Link className="h-4 w-4 mr-1" />
                    Привязать
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Зачем привязывать аккаунты?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Быстрый вход без ввода пароля</li>
                  <li>• Дополнительная безопасность аккаунта</li>
                  <li>• Восстановление доступа при потере пароля</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Telegram Link Modal */}
      {showTelegramModal && (
        <TelegramLinkModal
          isOpen={showTelegramModal}
          onClose={() => setShowTelegramModal(false)}
          botUrl={telegramBotUrl}
        />
      )}
    </>
  );
}
