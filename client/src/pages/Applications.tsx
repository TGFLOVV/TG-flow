import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { extractErrorMessage } from "@/lib/errorMessageCleaner";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import BackToTopButton from "@/components/BackToTopButton";
import SEOFooter from "@/components/SEOFooter";

export default function Applications() {
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const { toast } = useToast();
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [selectedTab, setSelectedTab] = useState<'channels' | 'bots' | 'groups'>('channels');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ["/api/applications"],
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: number; status: string; rejectionReason?: string }) => {
      try {
        const response = await apiRequest("PATCH", `/api/applications/${id}`, { status, rejectionReason });
        return response;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Успешно",
        description: "Статус заявки обновлен",
      });
      setRejectionReason("");
      setSelectedApplicationId(null);
    },
    onError: (error: any) => {
      let errorMessage = extractErrorMessage(error);

      // Специфичные ошибки заявок
      if (errorMessage.includes("не найдена") || errorMessage.includes("not found")) {
        errorMessage = "Заявка не найдена или была удалена";
      } else if (errorMessage.includes("уже обработана") || errorMessage.includes("already processed")) {
        errorMessage = "Заявка уже была обработана ранее";
      } else if (errorMessage.includes("недостаточно прав") || errorMessage.includes("insufficient")) {
        errorMessage = "Недостаточно прав для обработки заявки";
      } else if (error?.response?.status === 403) {
        errorMessage = "Нет прав для изменения статуса заявки";
      } else if (error?.response?.status === 404) {
        errorMessage = "Заявка не найдена";
      } else if (error?.response?.status === 409) {
        errorMessage = "Заявка уже была обработана";
      } else if (errorMessage === "Произошла неожиданная ошибка") {
        errorMessage = "Не удалось обновить статус заявки";
      }

      toast({
        title: "Ошибка при обработке заявки",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (applicationId: number) => {
    try {
      updateApplicationMutation.mutate({ id: applicationId, status: "approved" });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось одобрить заявку",
        variant: "destructive",
      });
    }
  };

  const handleReject = (applicationId: number) => {
    try {
      if (!rejectionReason.trim()) {
        toast({
          title: "Ошибка",
          description: "Укажите причину отклонения",
          variant: "destructive",
        });
        return;
      }
      updateApplicationMutation.mutate({ 
        id: applicationId, 
        status: "rejected", 
        rejectionReason: rejectionReason.trim() 
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отклонить заявку",
        variant: "destructive",
      });
    }
  };

  const toggleCardExpansion = (applicationId: number) => {
    const newExpandedCards = new Set(expandedCards);
    if (newExpandedCards.has(applicationId)) {
      newExpandedCards.delete(applicationId);
    } else {
      newExpandedCards.add(applicationId);
    }
    setExpandedCards(newExpandedCards);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">В ожидании</Badge>;
      case "approved":
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">Одобрено</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30">Отклонено</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredChannels = useMemo(() => {
    let result;
    switch (selectedTab) {
      case 'channels':
        result = applications?.filter((item: any) => item.type === "channel");
        break;
      case 'bots':
        result = applications?.filter((item: any) => item.type === "bot");
        break;
      case 'groups':
        result = applications?.filter((item: any) => item.type === "group");
        break;
      default:
        result = applications?.filter((item: any) => item.type === "channel");
    }

    // Фильтрация по статусу
    if (statusFilter !== 'all') {
      result = result?.filter((item: any) => item.status === statusFilter);
    }

    // Сортировка по дате создания (новые сверху)
    return result?.sort((a: any, b: any) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }) || [];
  }, [selectedTab, statusFilter, applications]);

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
        <main className="header-padding p-2 lg:p-4 overflow-x-hidden">
          <div className="max-w-full lg:max-w-7xl mx-auto w-full">
            <header className="bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 px-3 lg:px-6 py-2 lg:py-3 mb-3">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Заявки</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm lg:text-base">Управление заявками</p>
            </header>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div className="space-x-2">
                <Button variant={selectedTab === 'channels' ? 'default' : 'outline'} onClick={() => setSelectedTab('channels')}>Каналы</Button>
                <Button variant={selectedTab === 'bots' ? 'default' : 'outline'} onClick={() => setSelectedTab('bots')}>Боты</Button>
                <Button variant={selectedTab === 'groups' ? 'default' : 'outline'} onClick={() => setSelectedTab('groups')}>Группы</Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={statusFilter === 'all' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Все
                </Button>
                <Button 
                  variant={statusFilter === 'pending' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('pending')}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  На проверке
                </Button>
                <Button 
                  variant={statusFilter === 'approved' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('approved')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Одобрено
                </Button>
                <Button 
                  variant={statusFilter === 'rejected' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setStatusFilter('rejected')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Отклонено
                </Button>
              </div>
            </div>
            
            {error ? (
              <Card className="bg-red-50/80 dark:bg-red-900/20 border-red-300 dark:border-red-800">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-red-100/80 dark:bg-red-800/80 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-exclamation-triangle text-red-500 dark:text-red-400 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Ошибка загрузки</h3>
                  <p className="text-red-600 dark:text-red-400">Не удалось загрузить заявки. Попробуйте перезагрузить страницу.</p>
                </CardContent>
              </Card>
            ) : isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="bg-gray-50/80 dark:bg-gray-900/80 border-gray-300 dark:border-gray-800">
                    <CardContent className="p-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : Array.isArray(filteredChannels) && filteredChannels.length === 0 ? (
              <Card className="bg-gray-50/80 dark:bg-gray-900/80 border-gray-300 dark:border-gray-800">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-inbox text-gray-500 dark:text-gray-400 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Заявки не найдены</h3>
                  <p className="text-gray-600 dark:text-gray-400">Нет поданных заявок</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {Array.isArray(filteredChannels) && filteredChannels.map((application: any) => (
                  <Card key={application.id} className="bg-gray-50/80 dark:bg-gray-900/80 border-gray-300 dark:border-gray-800 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-colors">
                    <CardHeader>
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between space-y-2 lg:space-y-0">
                        <div className="flex-1">
                          <CardTitle className="text-gray-900 dark:text-white mb-2">
                            <div className="flex items-start space-x-3">
                              {application.channelImage && (
                                <div className="flex-shrink-0">
                                  <img 
                                    src={application.channelImage} 
                                    alt={application.channelName || "Channel"} 
                                    className="w-12 h-12 rounded-lg object-cover border border-gray-300 dark:border-gray-700"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <i className="fab fa-telegram text-blue-500 dark:text-blue-400"></i>
                                  <span className="text-sm lg:text-base text-gray-700 dark:text-gray-300">
                                    {application.type === "channel" ? "Канал" : 
                                     application.type === "bot" ? "Бот" : "Группа"}
                                  </span>
                                  {application.price === '0' && (
                                    <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs">
                                      <i className="fas fa-edit mr-1"></i>
                                      Редактирование
                                    </Badge>
                                  )}
                                </div>
                                {application.channelName && (
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                                    {application.channelName}
                                  </h3>
                                )}
                                <div className="flex items-center space-x-2">
                                  <a 
                                    href={application.channelUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:underline text-sm break-all"
                                  >
                                    {application.channelUrl}
                                  </a>
                                  <a 
                                    href={application.channelUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                                  >
                                    <i className="fas fa-external-link-alt text-xs"></i>
                                  </a>
                                </div>
                              </div>
                            </div>
                          </CardTitle>
                          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-1 lg:space-y-0 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center">
                              <i className="fas fa-user mr-1 text-gray-500 dark:text-gray-400"></i>
                              От: <span className="text-gray-900 dark:text-white ml-1">{application.applicant?.username || 'Неизвестно'}</span>
                            </span>
                            {application.applicant?.email && (
                              <span className="flex items-center">
                                <i className="fas fa-envelope mr-1 text-gray-500 dark:text-gray-400"></i>
                                <span className="text-gray-900 dark:text-white break-all">{application.applicant.email}</span>
                              </span>
                            )}
                            <span className="flex items-center">
                              <i className="fas fa-clock mr-1 text-gray-500 dark:text-gray-400"></i>
                              {new Date(application.createdAt).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {getStatusBadge(application.status)}
                          <Button                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCardExpansion(application.id)}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1"
                          >
                            <i className={`fas ${expandedCards.has(application.id) ? 'fa-chevron-up' : 'fa-chevron-down'} text-sm`}></i>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {expandedCards.has(application.id) && (
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <p className="text-gray-600 dark:text-gray-400">
                              <strong className="text-gray-900 dark:text-white">Категория:</strong> {application.category?.name || 'Не указана'}
                            </p>
                            {application.price !== '0' && (
                              <p className="text-gray-600 dark:text-gray-400">
                                <strong className="text-gray-900 dark:text-white">Цена:</strong> <span className="text-green-600 dark:text-green-400">{application.price}₽</span>
                              </p>
                            )}
                            {application.price === '0' && (
                              <p className="text-gray-600 dark:text-gray-400">
                                <strong className="text-gray-900 dark:text-white">Тип:</strong> <span className="text-blue-600 dark:text-blue-400">Редактирование канала</span>
                              </p>
                            )}
                          </div>

                          {application.description && (
                            <p className="text-gray-600 dark:text-gray-400">
                              <strong className="text-gray-900 dark:text-white">Описание:</strong> {application.description}
                            </p>
                          )}

                          {application.rejectionReason && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                              <p className="text-red-600 dark:text-red-400">
                                <strong>Причина отклонения:</strong> {application.rejectionReason}
                              </p>
                            </div>
                          )}

                          {application.status === 'pending' && (
                            <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                              <Button
                                onClick={() => handleApprove(application.id)}
                                disabled={updateApplicationMutation.isPending}
                                className="bg-purple-600 hover:bg-purple-700 text-white w-full lg:w-auto"
                              >
                                <i className="fas fa-check mr-2"></i>
                                Одобрить
                              </Button>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    disabled={updateApplicationMutation.isPending}
                                    onClick={() => setSelectedApplicationId(application.id)}
                                    className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 w-full lg:w-auto"
                                  >
                                    <i className="fas fa-times mr-2"></i>
                                    Отклонить
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-800 mx-2 lg:mx-0">
                                  <DialogHeader>
                                    <DialogTitle className="text-gray-900 dark:text-white">Отклонить заявку</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <p className="text-gray-600 dark:text-gray-400">
                                      Укажите причину отклонения заявки на канал:
                                    </p>
                                    <p className="text-blue-500 dark:text-blue-400 text-sm break-all">{application.channelUrl}</p>
                                    <Textarea
                                      placeholder="Причина отклонения..."
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                      className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                                      rows={3}
                                    />
                                    <div className="flex flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-3">
                                      <Button
                                        onClick={() => handleReject(application.id)}
                                        disabled={updateApplicationMutation.isPending || !rejectionReason.trim()}
                                        variant="destructive"
                                        className="w-full lg:flex-1"
                                      >
                                        {updateApplicationMutation.isPending ? (
                                          <i className="fas fa-spinner fa-spin mr-2"></i>
                                        ) : (
                                          <i className="fas fa-times mr-2"></i>
                                        )}
                                        Отклонить
                                      </Button>
                                      <DialogTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 w-full lg:w-auto"
                                        >
                                          Отмена
                                        </Button>
                                      </DialogTrigger>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
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