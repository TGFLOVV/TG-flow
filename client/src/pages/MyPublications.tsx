import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Eye, Calendar, Crown, Plus, Edit, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AddChannelModal from "@/components/AddChannelModal";
import EditPublicationModal from "@/components/EditPublicationModal";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import BackToTopButton from "@/components/BackToTopButton";
import MyPublicationChannelCard from "@/components/MyPublicationChannelCard";
import SEOFooter from "@/components/SEOFooter";

export default function MyPublications() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'channels' | 'bots' | 'groups'>('channels');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Получаем каналы пользователя
  const { data: myChannels = [] } = useQuery({
    queryKey: ["/api/channels/my"],
    staleTime: 5 * 60 * 1000,
  });

  // Получаем категории для модала редактирования
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Фильтруем каналы по типам
  const channels = useMemo(() => 
    myChannels.filter((ch: any) => !ch.type || ch.type === 'channel'), 
    [myChannels]
  );

  const bots = useMemo(() => 
    myChannels.filter((ch: any) => ch.type === 'bot'), 
    [myChannels]
  );

  const groups = useMemo(() => 
    myChannels.filter((ch: any) => ch.type === 'group'), 
    [myChannels]
  );

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate: promoteToTopMutation, isLoading: isPromotingToTop } = useMutation({
    mutationFn: async ({ channelId }: { channelId: number }) => {
      const response = await fetch(`/api/channels/${channelId}/promote-top`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to promote to top");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/channels/my"]);
      toast({
        title: "Успешно",
        description: "Канал успешно поднят в топ!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось поднять в топ",
        variant: "destructive",
      });
    },
  });

  const { mutate: promoteToUltraTopMutation, isLoading: isPromotingToUltraTop } = useMutation({
    mutationFn: async ({ channelId, days }: { channelId: number; days: number }) => {
      const response = await fetch(`/api/channels/${channelId}/promote-ultra-top`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ days }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to promote to ultra top");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/channels/my"]);
      toast({
        title: "Успешно",
        description: "Канал успешно поднят в ультра топ!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось поднять в ультра топ",
        variant: "destructive",
      });
    },
  });

  const handlePromoteStart = useCallback((channelId: number, type: 'top' | 'ultra-top') => {
    // This function is now handled directly in the card component
  }, []);

  const handlePromoteConfirm = useCallback((channelId: number, type: 'top' | 'ultra-top', days?: number) => {
    if (type === 'top') {
      promoteToTopMutation({ channelId });
    } else {
      promoteToUltraTopMutation({ channelId, days: days || 1 });
    }
  }, [promoteToTopMutation, promoteToUltraTopMutation]);

  const filteredChannels = useMemo(() => {
    let result;
    switch (selectedTab) {
      case 'channels':
        result = channels;
        break;
      case 'bots':
        result = bots;
        break;
      case 'groups':
        result = groups;
        break;
      default:
        result = channels;
    }

    // Сортируем: сначала ультра топ, потом топ, потом остальные
    return result?.sort((a, b) => {
      // Проверяем активность ультра топа
      const aIsActiveUltraTop = a.isUltraTop && a.ultraTopExpiresAt && new Date(a.ultraTopExpiresAt) > new Date();
      const bIsActiveUltraTop = b.isUltraTop && b.ultraTopExpiresAt && new Date(b.ultraTopExpiresAt) > new Date();

      // Проверяем топ продвижение
      const aIsTopPromoted = a.isTopPromoted || a.isTop;
      const bIsTopPromoted = b.isTopPromoted || b.isTop;

      // Приоритет: 1. Ультра топ, 2. Топ, 3. Обычные
      if (aIsActiveUltraTop && !bIsActiveUltraTop) return -1;
      if (!aIsActiveUltraTop && bIsActiveUltraTop) return 1;

      // Если оба не ультра топ, проверяем топ продвижение
      if (!aIsActiveUltraTop && !bIsActiveUltraTop) {
        if (aIsTopPromoted && !bIsTopPromoted) return -1;
        if (!aIsTopPromoted && bIsTopPromoted) return 1;
      }

      // Если равны по продвижению, сортируем по дате создания
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }) || [];
  }, [selectedTab, channels, bots, groups]);

  const { user } = useAuth();

  const handleEdit = useCallback((channel: any) => {
    setEditingChannel(channel);
    setIsEditModalOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <Header isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="lg:ml-64 p-4 pt-28 lg:pt-24">
        <h1 className="text-2xl font-bold mb-4">Мои публикации</h1>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedTab === 'channels' ? 'default' : 'outline'} 
              onClick={() => setSelectedTab('channels')}
              className={selectedTab === 'channels' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600' 
                : 'border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20'
              }
            >
              Каналы
            </Button>
            <Button 
              variant={selectedTab === 'bots' ? 'default' : 'outline'} 
              onClick={() => setSelectedTab('bots')}
              className={selectedTab === 'bots' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                : 'border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20'
              }
            >
              Боты
            </Button>
            <Button 
              variant={selectedTab === 'groups' ? 'default' : 'outline'} 
              onClick={() => setSelectedTab('groups')}
              className={selectedTab === 'groups' 
                ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                : 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20'
              }
            >
              Группы
            </Button>
          </div>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredChannels?.map((channel: any) => {
            if (channel.type === 'bot') {
              return (
                <MyPublicationChannelCard
                    key={channel.id}
                    channel={channel}
                    onEdit={handleEdit}
                    onPromoteStart={handlePromoteStart}
                    onPromoteConfirm={handlePromoteConfirm}
                    isPromoting={isPromotingToTop || isPromotingToUltraTop}
                    userBalance={parseFloat(user?.balance || '0')}
                  />
              );
            }

            if (channel.type === 'group') {
              return (
                <MyPublicationChannelCard
                    key={channel.id}
                    channel={channel}
                    onEdit={handleEdit}
                    onPromoteStart={handlePromoteStart}
                    onPromoteConfirm={handlePromoteConfirm}
                    isPromoting={isPromotingToTop || isPromotingToUltraTop}
                    userBalance={parseFloat(user?.balance || '0')}
                  />
              );
            }

            return (
              <MyPublicationChannelCard
                    key={channel.id}
                    channel={channel}
                    onEdit={handleEdit}
                    onPromoteStart={handlePromoteStart}
                    onPromoteConfirm={handlePromoteConfirm}
                    isPromoting={isPromotingToTop || isPromotingToUltraTop}
                    userBalance={parseFloat(user?.balance || '0')}
                  />
            );
          })}
        </div>

        <AddChannelModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

        <EditPublicationModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          publication={editingChannel}
          categories={categories}
        />

        <BackToTopButton />
      </div>
      <SEOFooter />
    </div>
  );
}