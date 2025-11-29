
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CategoryCardProps {
  category: {
    id: number;
    name: string;
    icon: string;
    isAdult: boolean;
    price: string;
  };
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const [, setLocation] = useLocation();

  // Загружаем только каналы, так как API /api/channels уже возвращает все типы контента
  const { data: allContent = [] } = useQuery({
    queryKey: ["/api/channels"],
    queryFn: async () => {
      const response = await fetch('/api/channels');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const handleClick = () => {
    setLocation(`/category?id=${category.id}`);
  };

  // Count all content types in this category (no duplication)
  const channelCount = allContent.filter((item: any) => item.category?.id === category.id).length;

  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:scale-[1.02] bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-purple-500/30 hover:border-purple-500/50 shadow-lg hover:shadow-xl"
      onClick={handleClick}
    >
      <CardContent className="p-4 lg:p-6">
        <div className="flex flex-col items-center text-center space-y-3 lg:space-y-4">
          <div className="relative w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-800 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
            {category.icon && (category.icon.includes('fa-') || category.icon.includes('fas ')) ? (
              <i className={`${category.icon} text-white text-xl lg:text-2xl`}></i>
            ) : (
              <span className="text-xl lg:text-2xl">{typeof category.icon === 'string' ? category.icon : '📁'}</span>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm lg:text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200 line-clamp-2">
              {category.name}
            </h3>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 font-medium">
                {channelCount} {channelCount === 1 ? 'публикация' : channelCount < 5 ? 'публикации' : 'публикаций'}
              </span>
              {category.isAdult && (
                <Badge className="bg-red-600 text-white text-xs px-2 py-1 font-medium">
                  18+
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
