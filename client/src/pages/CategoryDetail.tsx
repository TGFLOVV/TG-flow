import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import ChannelCard from "@/components/ChannelCard";
import Header from "@/components/Header";
import GridSkeleton from "@/components/GridSkeleton";
import SEOFooter from "@/components/SEOFooter";

export default function CategoryDetail() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('id');

  const { data: allContent = [], isLoading } = useQuery({
    queryKey: ["/api/channels", categoryId],
    queryFn: async () => {
      const url = categoryId ? `/api/channels?categoryId=${categoryId}` : '/api/channels';
      const response = await fetch(url);
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        return [];
      }
      
      // Строгая дедупликация по ID
      const uniqueContent = [];
      const seenIds = new Set();
      
      for (const item of data) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          uniqueContent.push({
            ...item,
            contentType: item.contentType || item.type || 'channel'
          });
        }
      }
      
      console.log(`Категория ${categoryId}: получено ${data.length} элементов, уникальных ${uniqueContent.length}`);
      return uniqueContent;
    },
    staleTime: 30000, // 30 секунд
    gcTime: 300000, // 5 минут
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const currentCategory = categoryId ? (categories as any[]).find(cat => cat.id === parseInt(categoryId)) : null;

  const category = currentCategory;

  // Сортировка: Ультра топ, потом топ (по дате топ продвижения), потом обычные
  const sortedContent = allContent.sort((a, b) => {
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

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (isLoading) {
    return (

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">
        <Sidebar 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <div className="lg:ml-64">
          <Header 
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
          <main className="flex-1 p-3 lg:p-8 header-padding overflow-x-hidden">
            <div className="max-w-full lg:max-w-7xl mx-auto w-full">
              <div className="mb-6 lg:mb-8">
                <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">Загрузка...</h1>
              </div>
              <GridSkeleton count={6} columns={3} />
            </div>
          </main>
        </div>
      </div>

    );
  }

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
        <div className="max-w-7xl mx-auto px-3 lg:px-6 py-3 lg:py-6">
            <div className="mb-6 lg:mb-8">
              <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {currentCategory ? `Категория: ${currentCategory.name}` : 'Категория'}
              </h1>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
                {currentCategory ? `Все публикации в категории "${currentCategory.name}"` : 'Все публикации'}
              </p>
            </div>

            {isLoading ? (
              <GridSkeleton count={6} columns={3} />
            ) : sortedContent.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-800 rounded-xl border p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-search text-gray-500 dark:text-gray-400 text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Контент не найден</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  В категории "{category?.name}" пока нет добавленного контента
                </p>
              </div>
            ) : (
              <>
                {/* Ультра топ */}
                {(() => {
                  const ultraTopContent = sortedContent.filter(item => item.isUltraTop);
                  if (ultraTopContent.length === 0) return null;

                  return (
                    <div className="mb-8">
                      <div className="flex items-center mb-4">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-bold mr-3">
                          <i className="fas fa-crown mr-1"></i>
                          УЛЬТРА ТОП
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-purple-600 to-transparent"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        {ultraTopContent.map((content) => (
                          <ChannelCard key={`ultra-${content.id}`} channel={content} />
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Все публикации */}
                {(() => {
                  const allContent = sortedContent.filter(item => !item.isUltraTop);
                  if (allContent.length === 0) return null;

                  return (
                    <div>
                      <div className="flex items-center mb-4">
                        <div className="bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-bold mr-3">
                          <i className="fas fa-list mr-1"></i>
                          ВСЕ ПУБЛИКАЦИИ
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-500 to-transparent"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        {allContent.map((content) => (
                          <ChannelCard key={`all-${content.id}`} channel={content} />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </main>
      </div>
      <SEOFooter />
    </div>

  );
}