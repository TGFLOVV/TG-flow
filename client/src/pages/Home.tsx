import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import CategoryCard from "@/components/CategoryCard";
import ChannelCard from "@/components/ChannelCard";
import AddChannelModal from "@/components/AddChannelModal";
import { PageLoader, CardSkeleton } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useLocation } from "wouter";
import BackToTopButton from "@/components/BackToTopButton";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import NewsSkeleton from "@/components/NewsSkeleton";
import SEOHead from "@/components/SEOHead";
import SEOFooter from "@/components/SEOFooter";
import HiddenSEOKeywords from "@/components/HiddenSEOKeywords";

export default function Home() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [location, setLocation] = useLocation();

  // Получаем все публикации одним запросом
  const { data: allContent = [], isLoading: allContentLoading, error: allContentError } = useQuery({
    queryKey: ["/api/channels", "all"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/channels');
        if (!response.ok) throw new Error('Failed to fetch content');
        const data = await response.json();

        // Убираем дубликаты по ID и типу
        const uniqueContent = [];
        const seen = new Set();

        for (const item of (Array.isArray(data) ? data : [])) {
          const key = `${item.id}-${item.type || 'channel'}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueContent.push(item);
          }
        }

        return uniqueContent;
      } catch (error) {
        console.error('Error fetching content:', error);
        return [];
      }
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: news = [], isLoading: newsLoading, error: newsError } = useQuery({
    queryKey: ["/api/news"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Функция для получения времени до истечения продвижения в миллисекундах
  const getTimeUntilExpiry = (item: any) => {
    const now = new Date().getTime();

    if (item.isUltraTop && item.ultraTopExpiresAt) {
      const expiry = new Date(item.ultraTopExpiresAt).getTime();
      return expiry - now;
    }

    if (item.isTop && item.topExpiresAt) {
      const expiry = new Date(item.topExpiresAt).getTime();
      return expiry - now;
    }

    return 0;
  };

  // Фильтруем весь контент по поисковому запросу
  const filteredContent = Array.isArray(allContent) ? allContent.filter((item: any) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Сортируем весь контент: Ультра топ сначала, потом топ (по дате продвижения), потом обычные
  const sortedContent = filteredContent.sort((a, b) => {
    // Ultra-top promoted items first
    if (a.isUltraTop && !b.isUltraTop) return -1;
    if (!a.isUltraTop && b.isUltraTop) return 1;

    // If both are ultra-top, sort by ultra-top promotion date
    if (a.isUltraTop && b.isUltraTop) {
      // Sort by expiry date DESC (more time remaining = higher position)
      const dateA = a.ultraTopExpiresAt ? new Date(a.ultraTopExpiresAt).getTime() : 0;
      const dateB = b.ultraTopExpiresAt ? new Date(b.ultraTopExpiresAt).getTime() : 0;
      return dateB - dateA;
    }

    // Then top promoted items (sort by TOP promotion date)
    if (a.isTop && !b.isTop) return -1;
    if (!a.isTop && b.isTop) return 1;

    if (a.isTop && b.isTop) {
      const dateA = a.topPromotedAt ? new Date(a.topPromotedAt).getTime() : 0;
      const dateB = b.topPromotedAt ? new Date(b.topPromotedAt).getTime() : 0;
      return dateB - dateA;
    }

    // Then by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Отфильтровываем только ультра топ контент для отображения
  const allUltraTopContent = sortedContent.filter(item => item.isUltraTop);

  // Сортируем контент для популярного раздела по количеству просмотров
  const allPopularContent = filteredContent.sort((a: any, b: any) => {
    const viewsA = a.viewCount || 0;
    const viewsB = b.viewCount || 0;
    return viewsB - viewsA;
  });

  // Фильтруем последние новости
  const latestNews = Array.isArray(news) ? news.slice(0, 2) : [];

  // Show loading spinner if any critical data is still loading
  const isLoadingAnyData = allContentLoading;

  if (isLoadingAnyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50/70 to-blue-50/70 dark:from-gray-900/70 dark:to-gray-800/70 text-gray-900 dark:text-white">
        <Sidebar 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <div className="lg:ml-64">
          <Header 
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
          <main className="pt-2 lg:pt-4 p-2 lg:p-4 header-padding overflow-x-hidden">
            <div className="max-w-full lg:max-w-7xl mx-auto space-y-3 lg:space-y-4">
              <PageLoader text="Загрузка данных..." />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/70 to-blue-50/70 dark:from-gray-900/70 dark:to-gray-800/70 text-gray-900 dark:text-white">
      <SEOHead 
        title="TG Flow | Главная"
        description="TG Flow - главная страница каталога"
        keywords="главная, каталог telegram, тг каналы, лучшие telegram каналы, рекомендуемые тг каналы, популярные telegram"
        canonicalUrl="https://tgflovv.ru/"
      />
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="lg:ml-64">
        <Header 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Main Content */}
        <main className="pt-2 lg:pt-20 p-2 lg:p-4 header-padding overflow-x-hidden">
          <div className="max-w-full lg:max-w-7xl mx-auto space-y-3 lg:space-y-4">

            {/* Рекомендуемое */}
            {allUltraTopContent.length > 0 ? (
              <section className="mb-3 lg:mb-4">
                <div className="flex items-center justify-between mb-2 lg:mb-3">
                  <div className="flex items-center">
                    <i className="fas fa-crown text-yellow-500 mr-2 text-lg lg:text-xl"></i>
                    <h2 className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">Рекомендуемое</h2>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setLocation("/popular")}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Все популярное →
                  </Button>
                </div>

                <div className="relative">
                  <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
                    {allUltraTopContent
                      .slice(0, 12)
                      .map((item: any) => (
                        <div key={`${item.id}-${item.type || 'channel'}`} className="flex-shrink-0 w-80 h-64">
                          <ChannelCard channel={item} />
                        </div>
                      ))}
                  </div>
                </div>
              </section>
            ) : (
              <section className="mb-6 lg:mb-8">
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <div className="flex items-center">
                    <i className="fas fa-crown text-yellow-500 mr-2 text-lg lg:text-xl"></i>
                    <h2 className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">Рекомендуемое</h2>
                  </div>
                </div>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-200/80 dark:bg-gray-700/80 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-crown text-yellow-500 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Пока нет рекомендуемого контента
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Здесь будет отображаться контент с Ультра топ продвижением
                  </p>
                </div>
              </section>
            )}

            {/* Популярное */}
            <section className="mb-6 lg:mb-8">
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <div className="flex items-center">
                  <i className="fas fa-fire text-red-500 mr-2 text-lg lg:text-xl"></i>
                  <h2 className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">Популярное</h2>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setLocation("/popular")}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Смотреть все →
                </Button>
              </div>

              {allPopularContent.length > 0 ? (
                <div className="relative">
                  <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
                    {allPopularContent
                      .slice(0, 12)
                      .map((item: any) => (
                        <div key={`${item.id}-${item.type || 'channel'}`} className="flex-shrink-0 w-80 h-64">
                          <ChannelCard channel={item} />
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200/80 dark:bg-gray-700/80 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-fire text-red-500 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Пока нет популярного контента
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Здесь будет отображаться популярный контент
                  </p>
                </div>
              )}
            </section>

            {/* Последние новости */}
            <section className="mb-6 lg:mb-8">
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <div className="flex items-center">
                  <i className="fas fa-newspaper text-blue-500 mr-2 text-lg lg:text-xl"></i>
                  <h2 className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">Последние новости</h2>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setLocation("/news")}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Все новости →
                </Button>
              </div>

              {latestNews.length > 0 ? (
                <div className="relative">
                  <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
                    {latestNews.map((newsItem: any) => (
                      <div 
                        key={newsItem.id}
                        className="flex-shrink-0 w-96 bg-white/80 dark:bg-gray-900/80 border-2 border-gray-300 dark:border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors cursor-pointer shadow-lg hover:shadow-xl"
                        onClick={() => setLocation("/news")}
                      >
                        <div className="flex flex-col space-y-4">
                          {newsItem.imageUrl && (
                            <div className="w-32 h-32 rounded-lg overflow-hidden mx-auto">
                              <img
                                src={newsItem.imageUrl}
                                alt={newsItem.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                              {newsItem.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-3">
                              {newsItem.excerpt || newsItem.content?.substring(0, 150) + '...'}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(newsItem.createdAt).toLocaleDateString("ru-RU")}
                              </span>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation("/news");
                                }}
                              >
                                Читать далее
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200/80 dark:bg-gray-700/80 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-newspaper text-blue-500 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Новостей пока нет
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Здесь будут отображаться последние новости
                  </p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <AddChannelModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />

      <BackToTopButton />
      <PWAInstallPrompt />
      <SEOFooter />
    </div>
  );
}
