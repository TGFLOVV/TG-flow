import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import CategoryCard from "@/components/CategoryCard";
import BackToTopButton from "@/components/BackToTopButton";
import SEOFooter from "@/components/SEOFooter";

// This component displays a catalog of categories and channels.
export default function Catalog() {
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: allContent = [] } = useQuery({
    queryKey: ["/api/channels"],
    queryFn: async () => {
      const response = await fetch('/api/channels');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Count channels by category (no duplication since API already returns all types)
  const channelsByCategory: { [key: number]: number } = {};

  allContent.forEach((item: any) => {
    if (item.category?.id) {
      channelsByCategory[item.category.id] = (channelsByCategory[item.category.id] || 0) + 1;
    }
  });

  const handleCategoryClick = (categoryId: number) => {
    setLocation(`/category?id=${categoryId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">
          <Sidebar />
          <div className="lg:ml-64">
            <Header />
            <main className="flex-1 p-3 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <div className="mb-6 lg:mb-8">
                  <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">Категории</h1>
                  <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Найдите каналы по интересам</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-white/80 dark:bg-gray-900/80 border-2 border-gray-300 dark:border-gray-700 rounded-xl p-4 lg:p-6 shadow-lg">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-200/80 dark:bg-gray-700/80 rounded-lg mb-3"></div>
                        <div className="h-5 bg-gray-200/80 dark:bg-gray-700/80 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200/80 dark:bg-gray-700/80 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
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

      <main className="pt-20 lg:pt-24 header-padding">
        <div className="max-w-7xl mx-auto px-3 lg:px-6 py-3 lg:py-6">
              <div className="mb-6 lg:mb-8">
                <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">Категории</h1>
                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Найдите каналы по интересам</p>
              </div>

              {!Array.isArray(categories) || categories.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <i className="fas fa-folder-open text-gray-500 dark:text-gray-400 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Категории не найдены</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    В данный момент нет доступных категорий для отображения
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                  {categories.map((category: any) => (
                    <CategoryCard key={category.id} category={category} />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>

      <BackToTopButton />
      <SEOFooter />
    </div>
  );
}