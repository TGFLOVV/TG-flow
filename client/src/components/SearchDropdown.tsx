import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";

interface SearchDropdownProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function SearchDropdown({ searchQuery, setSearchQuery, onSubmit }: SearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Получаем все каналы для поиска
  const { data: allChannels = [] } = useQuery({
    queryKey: ["/api/channels/all"],
    queryFn: async () => {
      const response = await fetch('/api/channels');
      const channels = await response.json();

      return Array.isArray(channels) ? channels.map((c: any) => ({ 
        ...c, 
        type: c.type || 'channel' 
      })) : [];
    },
    enabled: searchQuery.length > 0
  });

  // Фильтруем результаты на основе поискового запроса
  const filteredResults = allChannels.filter((item: any) => 
    searchQuery.length > 0 && (
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ).slice(0, 8); // Ограничиваем до 8 результатов

  // Закрываем dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Показываем dropdown когда есть текст для поиска
  useEffect(() => {
    setIsOpen(searchQuery.length > 0 && filteredResults.length > 0);
  }, [searchQuery, filteredResults.length]);

  const handleItemClick = (item: any) => {
    setLocation(`/channel?id=${item.id}`);
    setIsOpen(false);
    setSearchQuery('');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bot':
        return 'fas fa-robot';
      case 'group':
        return 'fas fa-users';
      default:
        return 'fas fa-tv';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bot':
        return 'text-blue-500';
      case 'group':
        return 'text-green-500';
      default:
        return 'text-purple-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bot':
        return 'Бот';
      case 'group':
        return 'Группа';
      default:
        return 'Канал';
    }
  };

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <form onSubmit={onSubmit} className="relative">
        <i className="fas fa-search absolute left-2 lg:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs lg:text-sm"></i>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск каналов, групп, ботов..."
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg lg:rounded-xl pl-7 lg:pl-10 pr-3 lg:pr-4 py-1.5 lg:py-2.5 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          onFocus={() => {
            if (searchQuery.length > 0 && filteredResults.length > 0) {
              setIsOpen(true);
            }
          }}
        />
      </form>

      {/* Dropdown с результатами */}
      {isOpen && filteredResults.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            {filteredResults.map((item: any) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => handleItemClick(item)}
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
              >
                {(item.imageUrl || item.avatarUrl) ? (
                  <img
                    src={item.imageUrl || item.avatarUrl}
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.type === 'bot' ? 'bg-blue-600' : 
                    item.type === 'group' ? 'bg-green-600' : 'bg-purple-600'
                  }`}>
                    <i className={`text-white ${getTypeIcon(item.type)}`}></i>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {item.name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 ${getTypeColor(item.type)}`}>
                      {getTypeLabel(item.type)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    @{item.username}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                      {item.description}
                    </p>
                  )}
                </div>

                {item.type !== 'bot' && (
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <i className="fas fa-users"></i>
                    <span>{item.subscriberCount?.toLocaleString() || 0}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
