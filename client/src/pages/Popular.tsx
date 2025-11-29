import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ChannelCard from "@/components/ChannelCard";

import GridSkeleton from "@/components/GridSkeleton";
import BackToTopButton from "@/components/BackToTopButton";
import SEOFooter from "@/components/SEOFooter";

export default function Popular() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Получаем все публикации одним запросом
  const { data: allContent = [], isLoading } = useQuery({
    queryKey: ["/api/channels", "all"],
    queryFn: async () => {
      const response = await fetch('/api/channels');
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
    },
  });

  // Сортируем по количеству просмотров (сначала больше просмотров)
  const allPopularContent = allContent.sort((a: any, b: any) => {
    const viewsA = a.viewCount || a.views || 0;
    const viewsB = b.viewCount || b.views || 0;
    return viewsB - viewsA;
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
            <div className="mb-3 lg:mb-4">
              <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Популярное
              </h1>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
                Все каналы, группы и боты отсортированные по популярности
              </p>
            </div>

            {isLoading ? (
              <GridSkeleton count={6} columns={3} />
            ) : (
              <>
                {/* All popular content */}
                {allPopularContent.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 lg:gap-6">
                    {allPopularContent.map((item) => (
                      <ChannelCard key={`${item.id}-${item.type || 'channel'}`} channel={item} />
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {allPopularContent.length === 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-800 rounded-xl border p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-fire text-gray-500 dark:text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Контент не найден
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Пока что нет добавленного контента
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