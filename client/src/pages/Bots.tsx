import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import ChannelCard from "@/components/ChannelCard";
import Header from "@/components/Header";
import BackToTopButton from "@/components/BackToTopButton";
import GridSkeleton from "@/components/GridSkeleton";
import { PageLoader } from "@/components/LoadingSpinner";
import VirtualizedChannelGrid from "@/components/VirtualizedChannelGrid";
import SEOFooter from "@/components/SEOFooter";

export default function Bots() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('category');

  const { data: bots = [], isLoading: botsLoading, error: botsError } = useQuery({
    queryKey: ["/api/bots", categoryId],
    queryFn: async () => {
      const url = categoryId ? `/api/channels?categoryId=${categoryId}&type=bot` : '/api/channels?type=bot';
      console.log('🤖 Fetching bots from:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch bots: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🤖 Bots data received:', data);
      // Дополнительная фильтрация на клиенте для гарантии
      const filteredData = Array.isArray(data) ? data.filter(item => item.type === 'bot') : [];
      return filteredData;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const isLoading = botsLoading;

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const currentCategory = categoryId ? (categories as any[]).find(cat => cat.id === parseInt(categoryId)) : null;

  // Sort bots by promotion status: ultra-top first, then by TOP promotion date, then by creation date
  const sortedBots = (bots as any[]).sort((a, b) => {
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
        <main className="header-padding">
        <div className="max-w-7xl mx-auto px-3 lg:px-6 py-2 lg:py-3">
            <div className="mb-2 lg:mb-3">
              <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {currentCategory ? `${currentCategory.name}` : 'Telegram Боты'}
              </h1>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
                {currentCategory ? `Боты "${currentCategory.name}"` : 'Найдите полезных ботов для работы и развлечений'}
              </p>
            </div>

            {botsError ? (
              <div className="bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 rounded-xl border p-8 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-exclamation-triangle text-red-500 dark:text-red-400 text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Ошибка загрузки</h3>
                <p className="text-red-600 dark:text-red-400">Не удалось загрузить ботов. Попробуйте перезагрузить страницу.</p>
              </div>
            ) : isLoading ? (
              <GridSkeleton count={6} columns={3} />
            ) : (
              <>
                {/* All bots */}
                {sortedBots.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {sortedBots.map((bot) => (
                      <ChannelCard key={bot.id} channel={bot} />
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {sortedBots.length === 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-800 rounded-xl border p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-robot text-gray-500 dark:text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Боты не найдены</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentCategory ? `В категории "${currentCategory.name}" пока нет ботов` : 'Пока что нет доступных ботов'}
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