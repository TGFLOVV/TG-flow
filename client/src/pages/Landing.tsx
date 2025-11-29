
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import SEOFooter from "@/components/SEOFooter";

export default function Landing() {
  const [, setLocation] = useLocation();

  // Загружаем статистику для лендинга
  const { data: landingStats, isLoading } = useQuery({
    queryKey: ["/api/landing/stats"],
    staleTime: 5 * 60 * 1000, // 5 минут кэширования
  });

  // Получаем значения из статистики или используем значения по умолчанию
  const totalChannels = (landingStats as any)?.totalChannels || 0;
  const totalUsers = (landingStats as any)?.totalUsers || 0;
  const totalCategories = (landingStats as any)?.totalCategories || 0;

  const handleLogin = () => {
    setLocation("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/70 to-blue-50/70 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto">
              <i className="fas fa-paper-plane text-white text-2xl"></i>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              TG Flow
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Каталог лучших Telegram каналов и ботов России
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Каталог Telegram каналов
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Найдите лучшие ТГ каналы по всем тематикам. Каталог telegram каналов с рейтингами и отзывами. Бесплатное размещение каналов в каталоге.
              </p>
            </div>

            <Button 
              onClick={handleLogin}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium"
              size="lg"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Войти в систему
            </Button>

            <div className="text-center">
              <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <div className="text-2xl font-bold text-purple-500 dark:text-purple-400">
                    {isLoading ? '...' : (totalChannels > 0 ? `${totalChannels.toLocaleString()}+` : '0')}
                  </div>
                  <div>Каналов</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-500 dark:text-purple-400">
                    {isLoading ? '...' : (totalUsers > 0 ? `${totalUsers.toLocaleString()}+` : '0')}
                  </div>
                  <div>Пользователей</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-500 dark:text-purple-400">
                    {isLoading ? '...' : (totalCategories > 0 ? totalCategories : '0')}
                  </div>
                  <div>Категорий</div>
                </div>
              </div>
            </div>

            {/* Ссылки на правовые документы */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setLocation('/public-offer')}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline"
                >
                  Публичная оферта
                </button>
                <button
                  onClick={() => setLocation('/privacy-policy')}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline"
                >
                  Политика конфиденциальности
                </button>
                <button
                  onClick={() => setLocation('/pricing')}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline"
                >
                  Тарифы
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <SEOFooter />
    </div>
  );
}
