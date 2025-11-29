import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { 
  Home, 
  List, 
  Users, 
  FileText, 
  BarChart3, 
  Plus, 
  Bot,
  MessageSquareText,
  Newspaper,
  HelpCircle,
  MessageCircle,
  User,
  CreditCard
} from "lucide-react";

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export default function Sidebar({ isMobileMenuOpen = false, setIsMobileMenuOpen = () => {} }: SidebarProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  // Используем только useAuth для единообразного источника данных
  const userWithAvatar = user;

  // Отслеживаем изменения данных пользователя
  useEffect(() => {
    // User data tracking for avatar updates
  }, [userWithAvatar]);

  const currentUser = userWithAvatar || user;

  if (!currentUser) return null;

  // Запросы для подсчета ожидающих заявок и пополнений
  const { data: pendingApplications = [] } = useQuery({
    queryKey: ["/api/applications", "pending"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/applications?status=pending', {
          credentials: 'include'
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        return [];
      }
    },
    enabled: ["admin", "moderator"].includes(currentUser.role),
    refetchInterval: 60000, // Обновляем каждую минуту
  });

  const { data: pendingTopups = [] } = useQuery({
    queryKey: ["/api/topups", "pending"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/topups?status=pending', {
          credentials: 'include'
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        return [];
      }
    },
    enabled: currentUser.role === "admin",
    refetchInterval: 60000, // Обновляем каждую минуту
  });

  // Запрос на получение ожидающих заявок пользователя
  const { data: userPendingApplications = [] } = useQuery({
    queryKey: ["/api/user/applications", "pending"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user/applications?status=pending', {
          credentials: 'include'
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching user pending applications:", error);
        return [];
      }
    },
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  const menuItems = [
    { path: "/home", icon: "fas fa-home", label: "Главная" },
    { path: "/catalog", icon: "fas fa-th-large", label: "Категории" },
    { path: "/channels", icon: "fas fa-tv", label: "Каналы" },
    { path: "/groups", icon: "fas fa-users-rectangle", label: "Группы" },
    { path: "/bots", icon: "fas fa-robot", label: "Боты" },
    { path: "/news", icon: "fas fa-newspaper", label: "Новости" },
    { path: "/popular", icon: "fas fa-fire", label: "Популярное" },
  ];

  const faqItem = { path: "/faq", icon: "fas fa-question-circle", label: "FAQ" };
  const publicOfferItem = { path: "/public-offer", icon: "fas fa-file-contract", label: "Публичная оферта" };
  const privacyPolicyItem = { path: "/privacy-policy", icon: "fas fa-shield-alt", label: "Политика конфиденциальности" };

  // Запрос на получение ожидающих заявок на вывод
  const { data: pendingWithdrawals = [] } = useQuery({
    queryKey: ["/api/withdrawal-requests", "pending"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/withdrawal-requests?status=pending', {
          credentials: 'include'
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        return [];
      }
    },
    enabled: currentUser.role === "admin",
    refetchInterval: 60000, // Обновляем каждую минуту
  });

  const managementItems = [
    { path: "/admin", icon: "fas fa-cog", label: "Панель управления", roles: ["admin", "moderator", "watcher"] },
    { 
      path: "/applications", 
      icon: "fas fa-inbox", 
      label: "Заявки", 
      roles: ["admin", "moderator"],
      badge: pendingApplications.length > 0 ? pendingApplications.length : null
    },
    { 
      path: "/withdrawal-requests", 
      icon: "fas fa-money-bill-wave", 
      label: "Выводы", 
      roles: ["admin"],
      badge: pendingWithdrawals.length > 0 ? pendingWithdrawals.length : null
    },
    { path: "/users", icon: "fas fa-user-shield", label: "Пользователи", roles: ["admin"] },
    { path: "/broadcast", icon: "fas fa-bullhorn", label: "Рассылка", roles: ["admin"] },

  ];

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "Администратор";
      case "moderator":
        return "Модератор";
      case "watcher":
        return "Смотрящий";
      default:
        return "Пользователь";
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`force-fixed-sidebar bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-r border-purple-500/30 flex flex-col w-72 lg:w-64 overflow-y-auto z-40 lg:z-30 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
        style={{ 
          backdropFilter: 'blur(12px)', 
          WebkitBackdropFilter: 'blur(12px)'
        }}
      >
        {/* Header */}
        <div className="p-4 lg:p-6 flex-shrink-0">
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
                <svg className="w-4 h-4 lg:w-5 lg:h-5 relative z-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16c-.18 1.896-.96 6.728-1.356 8.92-.168.93-.5 1.24-.82 1.27-.697.06-1.226-.46-1.9-.9-1.056-.69-1.653-1.12-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.53 5.831-2.538 6.998-3.024 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.32.023.464.138.121.097.155.228.171.32.016.092.036.301.02.465z"/>
                </svg>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-20 blur-sm"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent leading-tight">
                TG Flow
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Каталог каналов
              </p>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3 p-3 bg-gray-100/80 dark:bg-gray-800/80 rounded-lg border border-purple-500/30">
            <Avatar className="w-10 h-10 rounded-lg border border-purple-500/30">
              <AvatarImage 
                src={(() => {
                  const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNDc0NzQ3Ii8+CjxwYXRoIGQ9Ik01MCA1MEMzOC4xIDUwIDI5IDQxLjUgMjkgMzFDMjkgMjAuNSAzOC4xIDEyIDUwIDEyQzYxLjkgMTIgNzEgMjAuNSA3MSAzMUM3MSA0MS41IDYxLjkgNTAgNTAgNTBaTTIwIDgwQzIwIDY0LjQgMzQuNCA1MCA1MCA1MEM2NS42IDUwIDgwIDY0LjQgODAgODBWODVIMjBWODBaIiBmaWxsPSIjOTA5MDkwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI5NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjQUFBQUFBIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbmNvZ25pdG88L3RleHQ+Cjwvc3ZnPgo=";

                  if (currentUser?.profileImageUrl && 
                      currentUser.profileImageUrl.length > 100 && 
                      currentUser.profileImageUrl.startsWith('data:image/')) {
                    return currentUser.profileImageUrl;
                  } else if ((currentUser as any)?.telegramPhotoUrl) {
                    return (currentUser as any).telegramPhotoUrl;
                  }
                  return null;
                })()} 
                alt="Avatar" 
                className="w-10 h-10 object-cover"
              />
              <AvatarFallback className="w-10 h-10 rounded-lg">
                {(currentUser?.firstName && currentUser.firstName !== 'null' ? currentUser.firstName[0] : '')}{(currentUser?.lastName && currentUser.lastName !== 'null' ? currentUser.lastName[0] : '') || currentUser?.username?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {[currentUser?.firstName, currentUser?.lastName].filter(name => name && name !== 'null' && name.trim()).join(" ") || currentUser?.username}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                {getRoleName(currentUser?.role || 'user')}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 pb-4 flex flex-col">
          <nav className="flex-1 space-y-1 lg:space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  setLocation(item.path);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "flex items-center space-x-2 lg:space-x-3 w-full px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl transition-colors text-sm lg:text-base",
                  location === item.path
                    ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                    : "text-gray-800 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-200/80 dark:hover:bg-gray-800/80"
                )}
              >
                <i className={`${item.icon} w-4 lg:w-5`}></i>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}

            {managementItems.some(item => !item.roles || item.roles.includes(currentUser.role)) && (
              <div className="pt-3 lg:pt-4">
                <div className="text-xs font-semibold text-purple-600/80 dark:text-purple-400/80 px-3 lg:px-4 mb-2 uppercase tracking-wide">
                  Управление
                </div>
                {managementItems
                  .filter(item => !item.roles || item.roles.includes(currentUser.role))
                  .map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        setLocation(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between w-full px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl transition-colors text-xs lg:text-base",
                        location === item.path
                          ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                          : "text-gray-800 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-200/80 dark:hover:bg-gray-800/80"
                      )}
                    >
                      <div className="flex items-center space-x-2 lg:space-x-3">
                        <i className={`${item.icon} w-4 lg:w-5 text-xs lg:text-base`}></i>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <div className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 ml-2">
                          {item.badge > 99 ? '99+' : item.badge}
                        </div>
                      )}
                    </button>
                  ))}
              </div>
            )}
          </nav>

          {/* FAQ Section */}
          <div className="mt-4 pt-4 border-t border-gray-300/80 dark:border-purple-500/30 space-y-1">
            <button
              onClick={() => {
                setLocation(faqItem.path);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "flex items-center space-x-2 lg:space-x-3 w-full px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl transition-colors text-sm lg:text-base",
                location === faqItem.path
                  ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                  : "text-gray-800 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-200/80 dark:hover:bg-gray-800/80"
              )}
            >
              <i className={`${faqItem.icon} w-4 lg:w-5`}></i>
              <span className="font-medium">{faqItem.label}</span>
            </button>

            <button
              onClick={() => {
                setLocation("/pricing");
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "flex items-center space-x-2 lg:space-x-3 w-full px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl transition-colors text-sm lg:text-base",
                location === "/pricing"
                  ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                  : "text-gray-800 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-200/80 dark:hover:bg-gray-800/80"
              )}
            >
              <i className="fas fa-tags w-4 lg:w-5"></i>
              <span className="font-medium">Тарифы</span>
            </button>

            <button
              onClick={() => {
                setLocation(publicOfferItem.path);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "flex items-center space-x-2 lg:space-x-3 w-full px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl transition-colors text-sm lg:text-base",
                location === publicOfferItem.path
                  ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                  : "text-gray-800 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-200/80 dark:hover:bg-gray-800/80"
              )}
            >
              <i className={`${publicOfferItem.icon} w-4 lg:w-5`}></i>
              <span className="font-medium">{publicOfferItem.label}</span>
            </button>

            <button
              onClick={() => {
                setLocation(privacyPolicyItem.path);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "flex items-center space-x-2 lg:space-x-3 w-full px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl transition-colors text-sm lg:text-base",
                location === privacyPolicyItem.path
                  ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                  : "text-gray-800 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-200/80 dark:hover:bg-gray-800/80"
              )}
            >
              <i className={`${privacyPolicyItem.icon} w-4 lg:w-5`}></i>
              <span className="font-medium">{privacyPolicyItem.label}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
