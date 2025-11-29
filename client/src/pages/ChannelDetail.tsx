import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { PageLoader } from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FixedModal } from "@/components/FixedModal";
import { Star, Users, Eye, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEOFooter from "@/components/SEOFooter";

export default function ChannelDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [userRating, setUserRating] = useState(0);
  const [showRatingConfirm, setShowRatingConfirm] = useState(false);
  const [pendingRating, setPendingRating] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: channel, isLoading } = useQuery({
    queryKey: [`/api/channels/${id}`],
    enabled: !!id,
  });

  // Get user's existing rating for this channel
  const { data: userExistingRating } = useQuery({
    queryKey: [`/api/channels/${id}/user-rating`],
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 минут
    refetchOnWindowFocus: false,
  });

    // Fetch 24h views
  const { data: views24hData } = useQuery({
    queryKey: [`/api/channels/${id}/views-24h`],
    enabled: !!id,
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });

  // Set user rating when data loads
  useEffect(() => {
    if (userExistingRating && typeof userExistingRating === 'object' && 'rating' in userExistingRating) {
      const rating = (userExistingRating as any).rating;
      if (rating !== null && rating !== undefined) {
        setUserRating(rating);
      }
    } else if (userExistingRating && (userExistingRating as any).rating === null) {
      setUserRating(0);
    }
  }, [userExistingRating]);

  const incrementViewMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/channels/${id}/view`),
    onSuccess: (data) => {
      // Обновляем данные канала с точным количеством просмотров с сервера
      if (data && data.viewCount) {
        queryClient.setQueryData([`/api/channels/${id}`], (oldData: any) => {
          if (oldData) {
            return { ...oldData, views: data.viewCount };
          }
          return oldData;
        });
      }

      // Только инвалидируем списки, но не перезагружаем текущий канал
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  useEffect(() => {
    if (id && !incrementViewMutation.isPending) {
      incrementViewMutation.mutate();
    }
  }, [id]);

  const rateMutation = useMutation({
    mutationFn: (rating: number) => apiRequest("POST", `/api/channels/${id}/rate`, { rating }),
    onSuccess: (data) => {
      // Обновляем рейтинг пользователя в кэше
      queryClient.setQueryData([`/api/channels/${id}/user-rating`], { rating: pendingRating });

      // Обновляем общий рейтинг канала
      queryClient.setQueryData([`/api/channels/${id}`], (oldData: any) => {
        if (oldData && data && data.newRating) {
          return { ...oldData, rating: data.newRating };
        }
        return oldData;
      });

      queryClient.invalidateQueries({ queryKey: [`/api/channels/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/channels/${id}/user-rating`] });
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });

      toast({
        title: "Оценка поставлена!",
        description: "Спасибо за вашу оценку",
      });
    },
    onError: (error: any) => {
      // Возвращаем предыдущее значение рейтинга при ошибке
      setUserRating(userRating);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось поставить оценку",
        variant: "destructive",
      });
    },
  });

  const updateSubscribersMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/channels/${id}/update-subscribers`),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/channels/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      toast({
        title: "Подписчики обновлены!",
        description: `Количество подписчиков: ${data.subscriberCount?.toLocaleString() || "0"}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить количество подписчиков",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <PageLoader text="Загрузка канала..." />
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen flex relative">
        <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <Header isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <main className="flex-1 lg:ml-64 p-3 lg:p-8 pt-28 lg:pt-24 relative z-10">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Канал не найден</h1>
            <Button 
              onClick={() => setLocation("/channels")}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Вернуться к каналам
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const handleRating = (rating: number) => {
    setPendingRating(rating);
    setShowRatingConfirm(true);
  };

  const confirmRating = () => {
    setUserRating(pendingRating);
    rateMutation.mutate(pendingRating);
    setShowRatingConfirm(false);
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-white flex flex-col relative">
      <div className="flex flex-1">
        <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <Header isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <main className="flex-1 lg:ml-64 p-3 lg:p-8 pt-28 lg:pt-24 overflow-x-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => {
                const channelData = channel as any;
                if (channelData?.type === 'bot') {
                  setLocation("/bots");
                } else if (channelData?.type === 'group') {
                  setLocation("/groups");
                } else {
                  setLocation("/channels");
                }
              }}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              {(channel as any)?.type === 'bot' ? '← Назад к ботам' : 
               (channel as any)?.type === 'group' ? '← Назад к группам' : 
               '← Назад к каналам'}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Основная информация о канале */}
            <div className="lg:col-span-2">
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {((channel as any)?.imageUrl || (channel as any)?.avatarUrl) ? (
                      <img 
                        src={(channel as any).imageUrl || (channel as any).avatarUrl}
                        alt={(channel as any).name}
                        className="w-16 h-16 lg:w-20 lg:h-20 rounded-xl object-cover border border-gray-300 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        {(channel as any)?.type === 'bot' ? (
                          <i className="fas fa-robot text-blue-500 dark:text-blue-400 text-2xl"></i>
                        ) : (channel as any)?.type === 'group' ? (
                          <i className="fas fa-users text-green-500 dark:text-green-400 text-2xl"></i>
                        ) : (
                          <i className="fas fa-paper-plane text-purple-500 dark:text-purple-400 text-2xl"></i>
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {(channel as any)?.name}
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">@{(channel as any)?.username}</p>
                      <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
                        {(channel as any)?.category?.name}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Описание</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {(channel as any)?.description || "Описание канала не указано"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Users className="w-6 h-6 mx-auto mb-1 text-blue-500 dark:text-blue-400" />
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {(channel as any)?.subscriberCount?.toLocaleString() || "0"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Подписчиков</div>
                      </div>

                      <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Eye className="w-6 h-6 mx-auto mb-1 text-green-500 dark:text-green-400" />
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {views24hData?.views24h?.toLocaleString() || "0"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">За 24 часа</div>
                      </div>

                      <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Eye className="w-6 h-6 mx-auto mb-1 text-green-500 dark:text-green-400" />
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {(channel as any)?.views ? (channel as any).views.toLocaleString() : ((channel as any)?.viewCount || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Просмотров</div>
                      </div>

                      <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Star className="w-6 h-6 mx-auto mb-1 text-yellow-500 dark:text-yellow-400" />
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {(channel as any)?.rating ? parseFloat((channel as any).rating).toFixed(1) : "0.0"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Рейтинг</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => window.open(`https://t.me/${(channel as any)?.username}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Подписаться
                      </Button>
                      {user && ['admin', 'moderator'].includes(user.role) && (
                        <Button
                          variant="outline"
                          onClick={() => updateSubscribersMutation.mutate()}
                          disabled={updateSubscribersMutation.isPending}
                          className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          {updateSubscribersMutation.isPending ? (
                            <i className="fas fa-spinner fa-spin w-4 h-4 mr-2"></i>
                          ) : (
                            <i className="fas fa-sync-alt w-4 h-4 mr-2"></i>
                          )}
                          Обновить
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Боковая панель с рейтингом */}
            <div>
              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">
                    {userRating > 0 ? 'Ваша оценка' : 'Оценить канал'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {userRating > 0 
                        ? 'Нажмите на звезды, чтобы изменить оценку' 
                        : 'Поставьте оценку этому канала'
                      }
                    </p>

                    <div className="flex justify-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRating(star)}
                          className={`w-8 h-8 ${
                            star <= (userRating || 0)
                              ? "text-yellow-400"
                              : "text-gray-400 dark:text-gray-500"
                          } hover:text-yellow-300 transition-colors`}
                          disabled={rateMutation.isPending}
                        >
                          <Star className="w-full h-full fill-current" />
                        </button>
                      ))}
                    </div>

                    {userRating > 0 && (
                      <p className="text-center text-sm text-green-500 dark:text-green-400">
                        Ваша оценка: {userRating}/5 ⭐
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 mt-4">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Информация</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Статус:</span>
                      <Badge className="ml-2 bg-green-600 hover:bg-green-700 text-white">
                        {(channel as any)?.status === 'approved' ? 'Одобрен' : (channel as any)?.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Дата добавления:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {new Date((channel as any)?.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      </div>

      <FixedModal open={showRatingConfirm} onOpenChange={setShowRatingConfirm}>
        <div className="bg-white/95 dark:bg-gray-900/95 border-gray-300 dark:border-gray-600 backdrop-blur-sm max-w-lg text-gray-900 dark:text-white rounded-xl shadow-2xl p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Подтвердить оценку</h2>
          </div>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Вы хотите поставить оценку <span className="text-yellow-400 font-bold">{pendingRating}</span> из 5 звезд каналу "{(channel as any)?.name}"?
            </p>
            <div className="flex justify-center space-x-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= pendingRating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                />
              ))}
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={confirmRating}
                disabled={rateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
              >
                {rateMutation.isPending ? (
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                ) : (
                  <i className="fas fa-check mr-2"></i>
                )}
                Подтвердить оценку
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRatingConfirm(false)}
                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex-1"
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      </FixedModal>

      <SEOFooter />
    </div>
  );
}
