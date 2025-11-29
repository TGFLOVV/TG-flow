import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FixedModal } from "@/components/FixedModal";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { extractErrorMessage } from "@/lib/errorMessageCleaner";
import { useState } from "react";
import SEOFooter from "@/components/SEOFooter";
import Header from "@/components/Header";
import BackToTopButton from "@/components/BackToTopButton";
import EditPublicationModal from "@/components/EditPublicationModal";
import AdminModal from "@/components/AdminModal";

function CreateNewsForm() {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("draft");
  const { toast } = useToast();

  const createNewsMutation = useMutation({
    mutationFn: async (newsData: any) => {
      return await apiRequest("POST", "/api/news", newsData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Успешно",
        description: "Новость создана",
      });
      setTitle("");
      setExcerpt("");
      setContent("");
      setStatus("draft");
    },
    onError: (error: any) => {
      let errorMessage = extractErrorMessage(error);

      // Специфичные ошибки новостей
      if (errorMessage.includes("заголовок") || errorMessage.includes("title")) {
        errorMessage = "Заголовок новости слишком длинный или содержит недопустимые символы";
      } else if (errorMessage.includes("контент") || errorMessage.includes("content")) {
        errorMessage = "Содержимое новости слишком длинное";
      } else if (errorMessage.includes("дублирует") || errorMessage.includes("duplicate")) {
        errorMessage = "Новость с таким заголовком уже существует";
      } else if (error?.response?.status === 403) {
        errorMessage = "Недостаточно прав для создания новостей";
      } else if (error?.response?.status === 422) {
        errorMessage = "Неверные данные новости. Проверьте все поля";
      } else if (errorMessage === "Произошла неожиданная ошибка") {
        errorMessage = "Не удалось создать новость";
      }

      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    createNewsMutation.mutate({
      title: title.trim(),
      excerpt: excerpt.trim() || title.trim().substring(0, 100) + "...",
      content: content.trim(),
      status
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">Заголовок *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Введите заголовок новости"
          className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
          required
        />
      </div>

      <div>
        <Label htmlFor="excerpt" className="text-gray-700 dark:text-gray-300">Краткое описание</Label>
        <Input
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Краткое описание (если не указано, будет создано автоматически)"
          className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <Label htmlFor="content" className="text-gray-700 dark:text-gray-300">Содержание *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Введите содержание новости"
          className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white min-h-[150px]"
          required
        />
      </div>

      <div>
        <Label htmlFor="status" className="text-gray-700 dark:text-gray-300">Статус</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700">
            <SelectItem value="draft" className="text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-gray-700/80">Черновик</SelectItem>
            <SelectItem value="published" className="text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-gray-700/80">Опубликовано</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          type="submit"
          disabled={createNewsMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700 flex-1 text-white"
        >
          {createNewsMutation.isPending ? (
            <i className="fas fa-spinner fa-spin mr-2"></i>
          ) : (
            <i className="fas fa-plus mr-2"></i>
          )}
          Создать новость
        </Button>
      </div>
    </form>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState<any>(null);

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  const { data: channels = [] } = useQuery({
    queryKey: ["/api/channels"],
    queryFn: async () => {
      const response = await fetch('/api/channels?type=channel');
      const data = await response.json();
      return Array.isArray(data) ? data.filter(item => !item.type || item.type === 'channel') : [];
    }
  });

  const { data: bots = [] } = useQuery({
    queryKey: ["/api/channels/bots"],
    queryFn: async () => {
      const response = await fetch('/api/channels?type=bot');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["/api/channels/groups"],
    queryFn: async () => {
      const response = await fetch('/api/channels?type=group');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const { data: news = [] } = useQuery({
    queryKey: ["/api/news"],
  });

  const updateNewsStatusMutation = useMutation({
    mutationFn: ({ newsId, status }: { newsId: number; status: string }) =>
      apiRequest("PATCH", `/api/news/${newsId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Успешно",
        description: "Статус новости обновлен",
      });
    },
    onError: (error: any) => {
      let errorMessage = extractErrorMessage(error);
      if (error?.response?.status === 403) {
        errorMessage = "Недостаточно прав для изменения статуса новости";
      }
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: (channelId: number) =>
      apiRequest("DELETE", `/api/channels/${channelId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      toast({
        title: "Канал удален",
        description: "Канал был успешно удален из каталога",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить канал",
        variant: "destructive",
      });
    },
  });

  const deleteBotMutation = useMutation({
    mutationFn: (botId: number) =>
      apiRequest("DELETE", `/api/channels/${botId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels/bots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      toast({
        title: "Бот удален",
        description: "Бот был успешно удален из каталога",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить бота",
        variant: "destructive",
      });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: number) =>
      apiRequest("DELETE", `/api/channels/${groupId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      toast({
        title: "Группа удалена",
        description: "Группа была успешно удалена из каталога",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить группу",
        variant: "destructive",
      });
    },
  });

  const deleteNewsMutation = useMutation({
    mutationFn: (newsId: number) =>
      apiRequest("DELETE", `/api/news/${newsId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      toast({
        title: "Новость удалена",
        description: "Новость была успешно удалена",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить новость",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (publication: any) => {
    setSelectedPublication(publication);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedPublication(null);
  };
  const [selectedTab, setSelectedTab] = useState<'stats' | 'applications' | 'users' | 'topups' | 'withdrawals' | 'news' | 'support' | 'broadcast'>('stats');
  const [publicationTab, setPublicationTab] = useState<'channels' | 'bots' | 'groups'>('channels');

  // Modal states
  const [balanceModal, setBalanceModal] = useState<{ isOpen: boolean; user: any }>({ isOpen: false, user: null });
  const [roleModal, setRoleModal] = useState<{ isOpen: boolean; user: any }>({ isOpen: false, user: null });
  const [blockModal, setBlockModal] = useState<{ isOpen: boolean; user: any }>({ isOpen: false, user: null });
  const [sendNotificationModal, setSendNotificationModal] = useState<{ isOpen: boolean; user: any }>({ isOpen: false, user: null });

  // Form states
  const [balanceAmount, setBalanceAmount] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  const sendNotificationMutation = useMutation({
    mutationFn: async ({ userId, title, message }: { userId: number; title: string; message: string }) => {
      const response = await apiRequest(`/api/admin/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title, message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send notification');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Уведомление отправлено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить уведомление",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ userId, message }: { userId: number; message: string }) => {
      const response = await apiRequest(`/api/admin/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Сообщение отправлено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить сообщение",
        variant: "destructive",
      });
    },
  });

  const updateBalanceMutation = useMutation({
    mutationFn: ({ userId, amount }: { userId: number; amount: number }) =>
      apiRequest("PATCH", `/api/admin/users/${userId}/balance`, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Успешно",
        description: "Баланс пользователя обновлен",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить баланс пользователя",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Успешно",
        description: "Роль пользователя обновлена",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить роль пользователя",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, action }: { userId: number; action: 'block' | 'unblock' }) =>
      apiRequest("PATCH", `/api/admin/users/${userId}/status`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Успешно",
        description: "Статус пользователя обновлен",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить статус пользователя",
        variant: "destructive",
      });
    },
  });

  if (!user || !['admin', 'moderator', 'watcher'].includes(user.role)) {
    return (
      <div className="min-h-screen text-gray-900 dark:text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Доступ запрещен</h1>
          <p className="text-gray-600 dark:text-gray-400">У вас нет прав для доступа к этой странице</p>
        </div>
      </div>
    );
  }

  const filteredChannels = (channels as any[]).filter((channel: any) =>
    channel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    channel.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    channel.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBots = (bots as any[]).filter((bot: any) =>
    bot.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = (groups as any[]).filter((group: any) =>
    group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/70 to-blue-50/70 dark:from-gray-900/70 dark:to-gray-800/70 text-gray-900 dark:text-white">
        <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}/>

      <div className="lg:ml-64">
        <Header 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        <main className="header-padding">
          <div className="max-w-7xl mx-auto px-3 lg:px-6 py-3 lg:py-6">
            <header className="bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 px-3 lg:px-6 py-4">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold">Панель управления</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">Управление пользователями и заявками</p>
              </div>
            </header>

            <div className="p-2 lg:p-3">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-none">
              <CardContent className="p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Всего публикаций</p>
                    <p className="text-2xl font-bold">{(stats as any)?.totalPublications || 0}</p>
                  </div>
                  <i className="fas fa-file-alt text-3xl text-purple-200"></i>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-none">
              <CardContent className="p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Активных пользователей</p>
                    <p className="text-2xl font-bold">{(stats as any)?.totalUsers || 0}</p>
                  </div>
                  <i className="fas fa-user-check text-3xl text-blue-200"></i>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 border-none">
              <CardContent className="p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Доходы</p>
                    <p className="text-2xl font-bold">₽{(stats as any)?.totalRevenue || 0}</p>
                  </div>
                  <i className="fas fa-chart-line text-3xl text-green-200"></i>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-none">
              <CardContent className="p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Заявки на рассмотрении</p>
                    <p className="text-2xl font-bold">{(stats as any)?.pendingApplications || 0}</p>
                  </div>
                  <i className="fas fa-clock text-3xl text-orange-200"></i>
                </div>
              </CardContent>
            </Card>
          </div>

            {/* Publication Tabs */}
            <div className="flex space-x-4 mb-4">
              <Button
                variant={publicationTab === 'channels' ? 'default' : 'outline'}
                onClick={() => setPublicationTab('channels')}
              >
                Каналы
              </Button>
              <Button
                variant={publicationTab === 'bots' ? 'default' : 'outline'}
                onClick={() => setPublicationTab('bots')}
              >
                Боты
              </Button>
              <Button
                variant={publicationTab === 'groups' ? 'default' : 'outline'}
                onClick={() => setPublicationTab('groups')}
              >
                Группы
              </Button>
            </div>

          {/* Channels Management */}
          {publicationTab === 'channels' && (
          <Card className="bg-gray-50/80 dark:bg-gray-900/80 border-gray-300 dark:border-gray-800 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Управление каналами</CardTitle>
                <div className="w-80">
                  <Input
                    placeholder="Поиск каналов..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-100/80 dark:bg-gray-800/80">
                    <tr>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Канал
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Категория
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Владелец
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Подписчики
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredChannels.map((channel: any) => (
                      <tr key={channel.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/80">
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gray-200/80 dark:bg-gray-700/80 rounded-full mr-2 lg:mr-3 flex items-center justify-center overflow-hidden">
                              {(channel.imageUrl || channel.avatarUrl) ? (
                                <img 
                                  src={channel.imageUrl || channel.avatarUrl} 
                                  alt={channel.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <i className="fas fa-paper-plane text-purple-400 text-sm"></i>
                              )}
                            </div>
                            <div>
                              <div className="text-xs lg:text-sm font-medium">
                                {channel.name}
                              </div>
                              <div className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                                @{channel.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                          <Badge className="bg-purple-500 text-white text-xs">
                            {channel.category?.name}
                          </Badge>
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                          {channel.owner?.username}
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                          {channel.subscriberCount?.toLocaleString()}
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {['admin', 'moderator'].includes(user.role) && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                onClick={() => handleEdit(channel)}
                              >
                                <i className="fas fa-edit mr-1"></i>
                                Изменить
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={deleteChannelMutation.isPending}
                                onClick={() => deleteChannelMutation.mutate(channel.id)}
                              >
                                <i className="fas fa-trash mr-1"></i>
                                Удалить
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredChannels.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Каналы не найдены' : 'Нет добавленных каналов'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Bots Management */}
          {publicationTab === 'bots' && (
          <Card className="bg-gray-50/80 dark:bg-gray-900/80 border-gray-300 dark:border-gray-800 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
              <CardTitle>Управление ботами</CardTitle>
              <div className="w-80">
                  <Input
                    placeholder="Поиск ботов..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-100/80 dark:bg-gray-800/80">
                    <tr>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Бот
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Описание
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {Array.isArray(bots) && bots.map((bot: any) => (
                      <tr key={bot.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/80">
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 lg:w-10 h-8 lg:h-10 bg-blue-600 rounded-full mr-2 lg:mr-3 flex items-center justify-center">
                              <i className="fas fa-robot text-white text-sm"></i>
                            </div>
                            <div>
                              <div className="text-xs lg:text-sm font-medium">
                                {bot.name}
                              </div>
                              <div className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                                {bot.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                          {bot.description || "Нет описания"}
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {['admin', 'moderator'].includes(user.role) && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                onClick={() => handleEdit(bot)}
                              >
                                <i className="fas fa-edit mr-1"></i>
                                Изменить
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteBotMutation.mutate(bot.id)}
                                disabled={deleteBotMutation.isPending}
                              >
                                <i className="fas fa-trash mr-1"></i>
                                Удалить
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!Array.isArray(bots) || bots.length === 0) && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Нет добавленных ботов
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Groups Management */}
          {publicationTab === 'groups' && (
          <Card className="bg-gray-50/80 dark:bg-gray-900/80 border-gray-300 dark:border-gray-800 mb-8">
            <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Управление группами</CardTitle>
              <div className="w-80">
                  <Input
                    placeholder="Поиск групп..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-100/80 dark:bg-gray-800/80">
                    <tr>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Группа
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Описание
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {Array.isArray(groups) && groups.map((group: any) => (
                      <tr key={group.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/80">
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 lg:w-10 h-8 lg:h-10 bg-green-600 rounded-full mr-2 lg:mr-3 flex items-center justify-center">
                              <i className="fas fa-users text-white text-sm"></i>
                            </div>
                            <div>
                              <div className="text-xs lg:text-sm font-medium">
                                {group.name}
                              </div>
                              <div className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                                {group.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 lg:px-6 py-4 text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                          {group.description || "Нет описания"}
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {['admin', 'moderator'].includes(user.role) && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                onClick={() => handleEdit(group)}
                              >
                                <i className="fas fa-edit mr-1"></i>
                                Изменить
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteGroupMutation.mutate(group.id)}
                                disabled={deleteGroupMutation.isPending}
                              >
                                <i className="fas fa-trash mr-1"></i>
                                Удалить
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!Array.isArray(groups) || groups.length === 0) && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Нет добавленных групп
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          )}

          {/* News Management */}
          <Card className="bg-gray-50/80 dark:bg-gray-900/80 border-gray-300 dark:border-gray-800 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Управление новостями</CardTitle>
                {['admin', 'moderator'].includes(user.role) && (
                  <FixedModal>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        <i className="fas fa-plus mr-2"></i>
                        Добавить новость
                      </Button>




                          Создать новость


                      <CreateNewsForm />

                  </FixedModal>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-100/80 dark:bg-gray-800/80">
                    <tr>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Заголовок
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Дата
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {Array.isArray(news) && news.map((newsItem: any) => (
                      <tr key={newsItem.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/80">
                        <td className="px-3 lg:px-6 py-4">
                          <div className="text-xs lg:text-sm font-medium">
                            {newsItem.title}
                          </div>
                          <div className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                            {newsItem.excerpt}
                          </div>
                                                </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Badge className={`${
                              newsItem.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'
                            } text-white text-xs`}>
                              {newsItem.status === 'published' ? 'Опубликовано' : 'Черновик'}
                            </Badge>
                            {['admin', 'moderator'].includes(user.role) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateNewsStatusMutation.mutate({
                                  newsId: newsItem.id,
                                  status: newsItem.status === 'published' ? 'draft' : 'published'
                                })}
                                disabled={updateNewsStatusMutation.isPending}
                                className="text-xs"
                              >
                                {newsItem.status === 'published' ? 'Скрыть' : 'Опубликовать'}
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                          {new Date(newsItem.createdAt).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {['admin', 'moderator'].includes(user.role) && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteNewsMutation.mutate(newsItem.id)}
                              disabled={deleteNewsMutation.isPending}
                            >
                              <i className="fas fa-trash mr-1"></i>
                              Удалить
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!Array.isArray(news) || news.length === 0) && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Нет добавленных новостей
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
            </div>
          </div>
        </main>
      </div>

      <BackToTopButton />

      {/* Edit Publication Modal */}
      <EditPublicationModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        publication={selectedPublication}
        categories={categories}
      />

        {/* Balance Modal */}
        <AdminModal
          isOpen={balanceModal.isOpen}
          onClose={() => setBalanceModal({ isOpen: false, user: null })}
          title="Изменить баланс"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Сумма (может быть отрицательной)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                placeholder="Введите сумму"
              />
            </div>
            <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => {
                  if (balanceModal.user && balanceAmount) {
                    updateBalanceMutation.mutate({
                      userId: balanceModal.user.id,
                      amount: parseFloat(balanceAmount)
                    });
                    setBalanceModal({ isOpen: false, user: null });
                    setBalanceAmount('');
                  }
                }}
                disabled={updateBalanceMutation.isPending || !balanceAmount}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {updateBalanceMutation.isPending ? 'Обновление...' : 'Обновить баланс'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBalanceModal({ isOpen: false, user: null });
                  setBalanceAmount('');
                }}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </div>
        </AdminModal>

        {/* Role Modal */}
        <AdminModal
          isOpen={roleModal.isOpen}
          onClose={() => setRoleModal({ isOpen: false, user: null })}
          title="Изменить роль"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">Новая роль</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Пользователь</SelectItem>
                  <SelectItem value="watcher">Наблюдатель</SelectItem>
                  <SelectItem value="moderator">Модератор</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => {
                  if (roleModal.user && selectedRole) {
                    updateRoleMutation.mutate({
                      userId: roleModal.user.id,
                      role: selectedRole
                    });
                    setRoleModal({ isOpen: false, user: null });
                    setSelectedRole('');
                  }
                }}
                disabled={updateRoleMutation.isPending || !selectedRole}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {updateRoleMutation.isPending ? 'Обновление...' : 'Изменить роль'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRoleModal({ isOpen: false, user: null });
                  setSelectedRole('');
                }}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </div>
        </AdminModal>

        {/* Block/Unblock Modal */}
        <AdminModal
          isOpen={blockModal.isOpen}
          onClose={() => setBlockModal({ isOpen: false, user: null })}
          title={blockModal.user?.status === 'blocked' ? 'Разблокировать пользователя' : 'Заблокировать пользователя'}
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              {blockModal.user?.status === 'blocked' 
                ? `Вы уверены, что хотите разблокировать пользователя ${blockModal.user?.username}?`
                : `Вы уверены, что хотите заблокировать пользователя ${blockModal.user?.username}?`
              }
            </p>
            <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => {
                  if (blockModal.user) {
                    updateStatusMutation.mutate({
                      userId: blockModal.user.id,
                      action: blockModal.user.status === 'blocked' ? 'unblock' : 'block'
                    });
                    setBlockModal({ isOpen: false, user: null });
                  }
                }}
                disabled={updateStatusMutation.isPending}
                className={`flex-1 ${blockModal.user?.status === 'blocked' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
              >
                {updateStatusMutation.isPending ? 'Обновление...' : (blockModal.user?.status === 'blocked' ? 'Разблокировать' : 'Заблокировать')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBlockModal({ isOpen: false, user: null })}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </div>
        </AdminModal>

        {/* Send Notification Modal */}
        <AdminModal
          isOpen={sendNotificationModal.isOpen}
          onClose={() => setSendNotificationModal({ isOpen: false, user: null })}
          title="Отправить уведомление"
          className="max-w-lg"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="notif-title">Заголовок</Label>
              <Input
                id="notif-title"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="Введите заголовок"
              />
            </div>
            <div>
              <Label htmlFor="notif-message">Сообщение</Label>
              <Textarea
                id="notif-message"
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Введите сообщение"
                className="h-24 resize-none"
              />
            </div>
            <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => {
                  if (sendNotificationModal.user && notificationTitle && notificationMessage) {
                    sendNotificationMutation.mutate({
                      userId: sendNotificationModal.user.id,
                      title: notificationTitle,
                      message: notificationMessage
                    });
                    setSendNotificationModal({ isOpen: false, user: null });
                    setNotificationTitle('');
                    setNotificationMessage('');
                  }
                }}
                disabled={sendNotificationMutation.isPending || !notificationTitle || !notificationMessage}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {sendNotificationMutation.isPending ? 'Отправка...' : 'Отправить'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSendNotificationModal({ isOpen: false, user: null });
                  setNotificationTitle('');
                  setNotificationMessage('');
                }}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </div>
        </AdminModal>
      <SEOFooter />
    </div>
  );
}
