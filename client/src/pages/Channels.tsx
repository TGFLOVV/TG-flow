
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import ChannelCard from "@/components/ChannelCard";
import Header from "@/components/Header";
import GridSkeleton from "@/components/GridSkeleton";
import { PageLoader } from "@/components/LoadingSpinner";
import BackToTopButton from "@/components/BackToTopButton";
import SEOHead from "@/components/SEOHead";
import SEOFooter from "@/components/SEOFooter";
import HiddenSEOKeywords from '../components/HiddenSEOKeywords';
import StructuredData from '../components/StructuredData';
import { usePageTransition } from "@/hooks/usePageTransition";

export default function Channels() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('category');

  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ["/api/channels", categoryId],
    queryFn: async () => {
      const url = categoryId ? `/api/channels?categoryId=${categoryId}&type=channel` : '/api/channels?type=channel';
      const response = await fetch(url);
      const data = await response.json();
      // Дополнительная фильтрация на клиенте для гарантии
      const filteredData = Array.isArray(data) ? data.filter(item => !item.type || item.type === 'channel') : [];
      return filteredData;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const isLoading = channelsLoading;

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Уведомляем хук о состоянии загрузки данных
  usePageTransition();

  const currentCategory = categoryId ? (categories as any[]).find(cat => cat.id === parseInt(categoryId)) : null;

  // Sort channels by promotion status: ultra-top first, then TOP by promotion date, then by creation date  
  const sortedChannels = (channels as any[]).sort((a, b) => {
    // Ultra-top promoted items first
    if (a.isUltraTop && !b.isUltraTop) return -1;
    if (!a.isUltraTop && b.isUltraTop) return 1;

    // If both are ultra-top, sort by ultra-top expiry date (more time remaining = higher position)
    if (a.isUltraTop && b.isUltraTop) {
      const dateA = a.ultraTopExpiresAt ? new Date(a.ultraTopExpiresAt).getTime() : 0;
      const dateB = b.ultraTopExpiresAt ? new Date(b.ultraTopExpiresAt).getTime() : 0;
      return dateB - dateA;
    }

    // Then top promoted items (sort by TOP promotion date)
    const aIsTopPromoted = a.isTopPromoted || a.isTop;
    const bIsTopPromoted = b.isTopPromoted || b.isTop;

    if (aIsTopPromoted && !bIsTopPromoted) return -1;
    if (!aIsTopPromoted && bIsTopPromoted) return 1;

    if (aIsTopPromoted && bIsTopPromoted) {
      const dateA = a.topPromotedAt ? new Date(a.topPromotedAt).getTime() : 0;
      const dateB = b.topPromotedAt ? new Date(b.topPromotedAt).getTime() : 0;
      return dateB - dateA;
    }

    // Then by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Динамические SEO данные
  const seoTitle = currentCategory 
    ? `${currentCategory.name} - Telegram каналы | TG Flow Каталог`
    : "Каталог Telegram каналов - TG Flow | Лучшие ТГ каналы России";

  const seoDescription = currentCategory
    ? `Лучшие Telegram каналы в категории "${currentCategory.name}". Качественные ТГ каналы с рейтингами и отзывами. Каталог telegram каналов.`
    : "Каталог лучших Telegram каналов и ботов. Найдите качественные ТГ каналы по всем тематикам: новости, бизнес, развлечения, обучение.";

  const categoryName = currentCategory ? currentCategory.name : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/70 to-blue-50/70 dark:from-gray-900/70 dark:to-gray-800/70 text-gray-900 dark:text-white">
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        canonicalUrl={`https://tgflovv.ru/channels${categoryId ? `?category=${categoryId}` : ''}`}
        currentCategory={categoryName}
      />

      <HiddenSEOKeywords 
        currentCategory={categoryName}
        additionalKeywords={[
          'каталог telegram каналов россия',
          'лучшие тг каналы 2025',
          'популярные telegram каналы россии',
          'качественные telegram каналы',
          'проверенные тг каналы'
        ]}
      />

      <StructuredData 
        currentCategory={categoryName}
        pageType={currentCategory ? 'category' : 'catalog'}
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
      <main className="header-padding">
        <div className="max-w-7xl mx-auto px-3 lg:px-6 py-2 lg:py-3">
            <div className="mb-2 lg:mb-3">
              <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {currentCategory ? currentCategory.name : 'Telegram Каналы'}
              </h1>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
                {currentCategory ? `Каналы "${currentCategory.name}"` : 'Присоединяйтесь к интересным каналам'}
              </p>
            </div>

            {isLoading ? (
              <GridSkeleton count={6} columns={3} />
            ) : (
              <>
                {/* All channels */}
                {sortedChannels.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {sortedChannels.map((channel) => (
                      <ChannelCard key={channel.id} channel={channel} />
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {sortedChannels.length === 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-800 rounded-xl border p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-tv text-gray-500 dark:text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Каналы не найдены</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentCategory ? `В категории "${currentCategory.name}" пока нет каналов` : 'Пока что нет доступных каналов'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <BackToTopButton />
      <SEOFooter />
    </div>
  );
}
