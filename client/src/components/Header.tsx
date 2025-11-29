import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import SearchDropdown from "@/components/SearchDropdown";
import NotificationDropdown from "@/components/NotificationDropdown";
import AddChannelModal from "@/components/AddChannelModal";
import { useTheme } from "next-themes";
import { queryClient } from "@/lib/queryClient";

interface HeaderProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export default function Header({ isMobileMenuOpen = false, setIsMobileMenuOpen = () => {} }: HeaderProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  // Используем только useAuth для единообразного источника данных
  const userWithBalance = user;

  // Отслеживаем изменения данных пользователя
  useEffect(() => {
    // User data tracking for avatar updates
  }, [userWithBalance]);

  const balance = (userWithBalance as any)?.balance || user?.balance || 0;
  const currentUser = userWithBalance || user;
  const { theme, setTheme } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
    setMobileDropdownOpen(false);
    setDesktopDropdownOpen(false);
  };

  const handleTopupSuccess = async (amount: number) => {
    // Обновляем данные пользователя после успешного пополнения
    await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    // Принудительно перезапрашиваем данные
    await queryClient.refetchQueries({ queryKey: ["/api/user"] });

    // Небольшая задержка для обновления UI
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    }, 1000);
  };

  const handleMenuItemClick = (path: string) => {
    setLocation(path);
    setMobileDropdownOpen(false);
    setDesktopDropdownOpen(false);
  };

  return (
    <header 
      className="force-fixed-header bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-2 lg:px-6 py-2 lg:py-4 shadow-sm z-30 lg:z-50"
      style={{ 
        backdropFilter: 'blur(12px)', 
        WebkitBackdropFilter: 'blur(12px)'
      }}
    >
      {/* Mobile layout - Search at top */}
      <div className="lg:hidden">
        {/* Sidebar button and search bar */}
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={() => {
              console.log('Mobile sidebar toggle clicked, current state:', isMobileMenuOpen);
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            className="p-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <i className={`fas fa-bars text-gray-900 dark:text-white`}></i>
          </button>
          <div className="flex-1">
            <SearchDropdown 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSubmit={handleSearch}
            />
          </div>
        </div>

        {/* Bottom row with balance, notifications, profile on mobile */}
        <div className="flex items-center justify-end gap-2 h-10">
          <div className="flex items-center gap-1">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1 flex items-center h-8">
              <i className="fas fa-wallet text-green-500 dark:text-green-400 mr-1 text-xs"></i>
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {typeof balance === 'string' ? parseFloat(balance).toFixed(2) : (typeof balance === 'number' ? balance.toFixed(2) : '0.00')} ₽
              </span>
            </div>
          </div>

          <NotificationDropdown />

          <DropdownMenu open={mobileDropdownOpen} onOpenChange={setMobileDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-1 transition-colors h-8">
{(() => {
                  const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNDc0NzQ3Ii8+CjxwYXRoIGQ9Ik01MCA1MEMzOC4xIDUwIDI5IDQxLjUgMjkgMzFDMjkgMjAuNSAzOC4xIDEyIDUwIDEyQzYxLjkgMTIgNzEgMjAuNSA3MSAzMUM3MSA0MS41IDYxLjkgNTAgNTAgNTBaTTIwIDgwQzIwIDY0LjQgMzQuNCA1MCA1MCA1MEM2NS42IDUwIDgwIDY0LjQgODAgODBWODVIMjBWODBaIiBmaWxsPSIjOTA5MDkwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI5NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjQUFBQUFBIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbmNvZ25pdG88L3RleHQ+Cjwvc3ZnPgo=";

                  // Приоритет: загруженный аватар > Telegram аватар > инкогнито
                  let avatarSrc = defaultAvatar;

                  if (currentUser?.profileImageUrl && 
                      currentUser.profileImageUrl.length > 100 && 
                      currentUser.profileImageUrl.startsWith('data:image/')) {
                    avatarSrc = currentUser.profileImageUrl;
                  } else if ((currentUser as any)?.telegramPhotoUrl) {
                    avatarSrc = (currentUser as any).telegramPhotoUrl;
                  }

                  return (
                    <img 
                      src={avatarSrc}
                      alt="Avatar" 
                      className="w-6 h-6 object-cover rounded-lg border border-purple-500/30"
                      key={`${currentUser?.id}-${avatarSrc}`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== defaultAvatar) {
                          target.src = defaultAvatar;
                        }
                      }}
                    />
                  );
                })()}
                <i className="fas fa-chevron-down text-xs text-gray-500 dark:text-gray-400"></i>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 z-[60]">
              <DropdownMenuItem 
                onClick={() => {
                  setMobileDropdownOpen(false);
                  handleMenuItemClick("/profile");
                }}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
              >
                <i className="fas fa-user mr-2"></i>
                Профиль
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setMobileDropdownOpen(false);
                  setShowAddChannelModal(true);
                }}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
              >
                <i className="fas fa-plus mr-2"></i>
                Добавить публикацию
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => {
                  setMobileDropdownOpen(false);
                  handleMenuItemClick("/my-publications");
                }}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
              >
                <i className="fas fa-list mr-2"></i>
                Мои публикации
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setMobileDropdownOpen(false);
                  toggleTheme();
                }}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
              >
                <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'} mr-2`}></i>
                {theme === 'light' ? 'Темная тема' : 'Светлая тема'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={async () => {
                  setMobileDropdownOpen(false);
                  try {
                    const response = await fetch("/api/logout", { 
                      method: "POST",
                      credentials: "include"
                    });
                    if (response.ok) {
                      window.location.href = "/";
                    } else {
                      console.error("Logout failed");
                      window.location.href = "/";
                    }
                  } catch (error) {
                    console.error("Logout error:", error);
                    window.location.href = "/";
                  }
                }}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 text-red-500 dark:text-red-400"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Выход
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Desktop layout - all in one row */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Search bar with dropdown - takes full width on desktop */}
        <SearchDropdown 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSubmit={handleSearch}
        />

        {/* Desktop balance and profile */}
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 flex items-center">
            <i className="fas fa-wallet text-green-500 dark:text-green-400 mr-2"></i>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {typeof balance === 'string' ? parseFloat(balance).toFixed(2) : (typeof balance === 'number' ? balance.toFixed(2) : '0.00')} ₽
            </span>
          </div>

          <NotificationDropdown />

          <DropdownMenu open={desktopDropdownOpen} onOpenChange={setDesktopDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl p-2 transition-colors">
                <Avatar className="w-8 h-8 rounded-lg border border-purple-500/30">
                  <AvatarImage 
                    src={(() => {
                      const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNDc0NzQ3Ii8+CjxwYXRoIGQ9Ik01MCA1MEMzOC4xIDUwIDI5IDQxLjUgMjkgMzFDMjkgMjAuNSAzOC4xIDEyIDUwIDEyQzYxLjkgMTIgNzEgMjAuNSA3MSAzMUM3MSA0MS41IDYxLjkgNTAgNTAgNTBaTTIwIDgwQzIwIDY0LjQgMzQuNCA1MCA1MCA1MEM2NS42IDUwIDgwIDY0LjQgODAgODBWODVIMjBWODBaIiBmaWxsPSIjOTA5MDkwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI5NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjQUFBQUFBIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbmNvZ25pdG88L3RleHQ+Cjwvc3ZnPgo=";

                      if (user?.profileImageUrl && 
                          user.profileImageUrl.length > 100 && 
                          user.profileImageUrl.startsWith('data:image/')) {
                        return user.profileImageUrl;
                      } else if (user?.telegramPhotoUrl) {
                        return user.telegramPhotoUrl;
                      }
                      return null;
                    })()}
                    alt="Avatar" 
                    className="w-8 h-8 object-cover"
                  />
                  <AvatarFallback className="w-8 h-8 rounded-lg">
                    {(currentUser?.firstName && currentUser.firstName !== 'null' ? currentUser.firstName[0] : '')}{(currentUser?.lastName && currentUser.lastName !== 'null' ? currentUser.lastName[0] : '') || currentUser?.username?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {[currentUser?.firstName, currentUser?.lastName].filter(name => name && name.trim()).join(" ") || currentUser?.username}
                </span>
                <i className="fas fa-chevron-down text-sm text-gray-500 dark:text-gray-400"></i>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 z-[60]">
              <DropdownMenuItem 
                onClick={() => {
                  setDesktopDropdownOpen(false);
                  handleMenuItemClick("/profile");
                }}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
              >
                <i className="fas fa-user mr-2"></i>
                Профиль
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setDesktopDropdownOpen(false);
                  setShowAddChannelModal(true);
                }}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
              >
                <i className="fas fa-plus mr-2"></i>
                Добавить публикацию
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => {
                  setDesktopDropdownOpen(false);
                  handleMenuItemClick("/my-publications");
                }}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
              >
                <i className="fas fa-list mr-2"></i>
                Мои публикации
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setDesktopDropdownOpen(false);
                  toggleTheme();
                }}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
              >
                <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'} mr-2`}></i>
                {theme === 'light' ? 'Темная тема' : 'Светлая тема'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  setDesktopDropdownOpen(false);
                  fetch("/api/logout", { method: "POST" });
                  window.location.href = "/";
                }}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 text-red-500 dark:text-red-400"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Выход
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AddChannelModal 
        isOpen={showAddChannelModal}
        onClose={() => setShowAddChannelModal(false)}
      />

      {showTopupModal && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center pt-20 lg:pt-24">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTopupModal(false)} />
          <div className="relative z-10 w-full max-w-md mx-4">
          </div>
        </div>
      )}
    </header>
  );
}
