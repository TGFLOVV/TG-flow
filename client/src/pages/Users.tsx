import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import SendMessageModal from "@/components/SendMessageModal";
import SEOFooter from "@/components/SEOFooter";
import BackToTopButton from "@/components/BackToTopButton";


import Header from "@/components/Header";

export default function Users() {
  const [balanceAmount, setBalanceAmount] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedUserForMessage, setSelectedUserForMessage] = useState<{ id: number; name: string } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [userToBlock, setUserToBlock] = useState<any>(null);
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const updateBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: number; amount: string }) => {
      return await apiRequest("PATCH", `/api/users/${userId}/balance`, { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Успешно",
        description: "Баланс пользователя обновлен",
      });
      setBalanceAmount("");
      setSelectedUserId(null);
      setShowBalanceModal(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить баланс",
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: number; action: string }) => {
      return await apiRequest("PATCH", `/api/users/${userId}/status`, { action });
    },
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
        description: error.message || "Не удалось обновить статус",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      return await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Успешно",
        description: "Роль пользователя обновлена",
      });
      setSelectedRole("");
      setSelectedUserId(null);
      setShowRoleModal(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить роль",
        variant: "destructive",
      });
    },
  });

  const handleUpdateBalance = () => {
    if (!balanceAmount.trim() || selectedUserId === null) {
      toast({
        title: "Ошибка",
        description: "Укажите сумму",
        variant: "destructive",
      });
      return;
    }
    updateBalanceMutation.mutate({ userId: selectedUserId, amount: balanceAmount });
  };

  const handleUpdateRole = () => {
    if (!selectedRole || selectedUserId === null) {
      toast({
        title: "Ошибка",
        description: "Выберите роль",
        variant: "destructive",
      });
      return;
    }
    updateRoleMutation.mutate({ userId: selectedUserId, role: selectedRole });
  };

  const handleSendMessage = (user: any) => {
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const fullName = [firstName, lastName].filter(name => name.trim()).join(" ");
    const displayName = fullName ? `${fullName} (${user.username})` : user.username;

    setSelectedUserForMessage({
      id: user.id,
      name: displayName
    });
    setShowMessageModal(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500/10 text-red-500 dark:text-red-400">Администратор</Badge>;
      case "moderator":
        return <Badge className="bg-blue-500/10 text-blue-500 dark:text-blue-400">Модератор</Badge>;
      case "watcher":
        return <Badge className="bg-green-500/10 text-green-500 dark:text-green-400">Смотрящий</Badge>;
      default:
        return <Badge variant="secondary">Пользователь</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "blocked":
        return <Badge variant="destructive">Заблокирован</Badge>;
      case "active":
        return <Badge className="bg-green-500/10 text-green-500 dark:text-green-400">Активен</Badge>;
      default:
        return <Badge variant="secondary">Неизвестно</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/70 to-blue-50/70 dark:from-gray-900/70 dark:to-gray-800/70 text-gray-900 dark:text-white flex flex-col">
        <Sidebar 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen">
        <Header 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
      <main className="flex-1 p-3 lg:p-8 header-padding overflow-x-hidden">
        <div className="max-w-full lg:max-w-7xl mx-auto w-full overflow-x-hidden">
          <div className="mb-8">
            <h1 className="text-xl lg:text-3xl font-bold mb-2">Пользователи</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
              Управление пользователями системы
            </p>
          </div>

          {isLoading ? (
            <Card className="bg-gray-50/80 dark:bg-gray-900/80 border border-gray-300 dark:border-gray-800">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-200/80 dark:bg-gray-700/80 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <i className="fas fa-spinner fa-spin text-gray-500 dark:text-gray-400 text-2xl"></i>
                </div>
                <p className="text-gray-600 dark:text-gray-400">Загрузка пользователей...</p>
              </CardContent>
            </Card>
          ) : !Array.isArray(users) || users.length === 0 ? (
            <Card className="bg-gray-50/80 dark:bg-gray-900/80 border border-gray-300 dark:border-gray-800">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-200/80 dark:bg-gray-700/80 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-users text-gray-500 dark:text-gray-400 text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">Пользователи не найдены</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  В системе пока нет зарегистрированных пользователей
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop Table View */}
              <Card className="bg-gray-50/80 dark:bg-gray-900/80 border border-gray-300 dark:border-gray-800 hidden lg:block">
                <CardHeader>
                  <CardTitle>Список пользователей ({Array.isArray(users) ? users.length : 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-200 dark:border-gray-800">
                          <TableHead className="text-gray-600 dark:text-gray-400">Пользователь</TableHead>
                          <TableHead className="text-gray-600 dark:text-gray-400">Email</TableHead>
                          <TableHead className="text-gray-600 dark:text-gray-400">Роль</TableHead>
                          <TableHead className="text-gray-600 dark:text-gray-400">Баланс</TableHead>
                          <TableHead className="text-gray-600 dark:text-gray-400">Статус</TableHead>
                          <TableHead className="text-gray-600 dark:text-gray-400">Дата регистрации</TableHead>
                          <TableHead className="text-gray-600 dark:text-gray-400">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(users as any[]).map((user: any) => (
                          <TableRow key={user.id} className="border-gray-200 dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-800/80">
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8 rounded-lg">
                                  <AvatarImage 
                                    src={user.profileImageUrl || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNDc0NzQ3Ii8+CjxwYXRoIGQ9Ik01MCA1MEMzOC4xIDUwIDI5IDQxLjUgMjkgMzFDMjkgMjAuNSAzOC4xIDEyIDUwIDEyQzYxLjkgMTIgNzEgMjAuNSA3MSAzMUM3MSA0MS41IDYxLjkgNTAgNTAgNTBaTTIwIDgwQzIwIDY0LjQgMzQuNCA1MCA1MCA1MEM2NS42IDUwIDgwIDY0LjQgODAgODBWODVIMjBWODBaIiBmaWxsPSIjOTA5MDkwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI5NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjQUFBQUFBIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbmNvZ25pdG88L3RleHQ+Cjwvc3ZnPgo="} 
                                    alt="Avatar" 
                                    className="w-8 h-8 object-cover"
                                  />
                                  <AvatarFallback className="w-8 h-8 rounded-lg">
                                    {(user.firstName?.[0] || '').replace('n', '')}{(user.lastName?.[0] || '').replace('n', '') || user.username?.[0]?.toUpperCase() || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.username}</p>
                                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    {[user.firstName, user.lastName].filter(name => name && name.trim()).join(" ") || "Имя не указано"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{user.email || 'Не указан'}</TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell className="text-green-500 dark:text-green-400 font-medium">{user.balance}₽</TableCell>
                            <TableCell>{getStatusBadge(user.status || 'active')}</TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">
                              {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
                                  onClick={() => {
                                    setSelectedUserId(user.id);
                                    setShowBalanceModal(true);
                                  }}
                                >
                                  <i className="fas fa-wallet mr-1"></i>
                                  Баланс
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
                                  onClick={() => {
                                    setSelectedUserId(user.id);
                                    setSelectedRole(user.role);
                                    setShowRoleModal(true);
                                  }}
                                >
                                  <i className="fas fa-user-cog mr-1"></i>
                                  Роль
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSendMessage(user)}
                                  className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
                                >
                                  <i className="fas fa-envelope mr-1"></i>
                                  Сообщение
                                </Button>

                                <Button
                                  size="sm"
                                  variant={user.status === 'blocked' ? 'default' : 'destructive'}
                                  onClick={() => {
                                    setUserToBlock(user);
                                    setShowBlockModal(true);
                                  }}
                                >
                                  <i className={`fas ${user.status === 'blocked' ? 'fa-unlock' : 'fa-ban'} mr-1`}></i>
                                  {user.status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Пользователи ({Array.isArray(users) ? users.length : 0})</h2>
                </div>
                {Array.isArray(users) && users.map((user: any) => (
                  <Card key={user.id} className="bg-gray-50/80 dark:bg-gray-900/80 border border-gray-300 dark:border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="w-12 h-12 rounded-lg">
                          <AvatarImage 
                            src={user.profileImageUrl || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNDc0NzQ3Ii8+CjxwYXRoIGQ9Ik01MCA1MEMzOC4xIDUwIDI5IDQxLjUgMjkgMzFDMjkgMjAuNSAzOC4xIDEyIDUwIDEyQzYxLjkgMTIgNzEgMjAuNSA3MSAzMUM3MSA0MS41IDYxLjkgNTAgNTAgNTBaTTIwIDgwQzIwIDY0LjQgMzQuNCA1MCA1MCA1MEM2NS42IDUwIDgwIDY0LjQgODAgODBWODVIMjBWODBaIiBmaWxsPSIjOTA5MDkwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI5NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjQUFBQUFBIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbmNvZ25pdG88L3RleHQ+Cjwvc3ZnPgo="} 
                            alt="Avatar" 
                            className="w-12 h-12 object-cover"
                          />
                          <AvatarFallback className="w-12 h-12 rounded-lg">
                            {(user.firstName?.[0] || '').replace('n', '')}{(user.lastName?.[0] || '').replace('n', '') || user.username?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{user.username}</p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {[user.firstName, user.lastName].filter(name => name && name.trim()).join(" ") || "Имя не указано"}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-xs">{user.email || 'Не указан'}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-green-500 dark:text-green-400 font-medium">{user.balance}₽</div>
                          <div className="text-gray-600 dark:text-gray-400 text-xs">
                            {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.status || 'active')}
                      </div>

                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 flex-1"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setShowBalanceModal(true);
                            }}
                          >
                            <i className="fas fa-wallet mr-2"></i>
                            Баланс
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 flex-1"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setSelectedRole(user.role);
                              setShowRoleModal(true);
                            }}
                          >
                            <i className="fas fa-user-cog mr-2"></i>
                            Роль
                          </Button>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendMessage(user)}
                          className="w-full border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
                        >
                          <i className="fas fa-envelope mr-2"></i>
                          Отправить сообщение
                        </Button>

                        <Button
                          size="sm"
                          variant={user.status === 'blocked' ? 'default' : 'destructive'}
                          onClick={() => {
                            setUserToBlock(user);
                            setShowBlockModal(true);
                          }}
                          className="w-full"
                        >
                          <i className={`fas ${user.status === 'blocked' ? 'fa-unlock' : 'fa-ban'} mr-2`}></i>
                          {user.status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
                    )}
        </div>
      </main>
      </div>

      {/* Send Message Modal */}
      {selectedUserForMessage && (
        <SendMessageModal
          isOpen={showMessageModal}
          onClose={() => {
            setShowMessageModal(false);
            setSelectedUserForMessage(null);
          }}
          userId={selectedUserForMessage.id}
          userName={selectedUserForMessage.name}
        />
      )}

      {/* Balance Modal */}
      <Dialog open={showBalanceModal} onOpenChange={setShowBalanceModal}>
        <DialogContent className="max-w-md p-6 sm:p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
              Изменить баланс: {selectedUserId && users.find((u: any) => u.id === selectedUserId)?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
              Текущий баланс: <span className="text-green-500 dark:text-green-400 font-medium">
                {selectedUserId && users.find((u: any) => u.id === selectedUserId)?.balance}₽
              </span>
            </p>
            <div className="form-group">
              <Label className="text-gray-700 dark:text-gray-300 block mb-2 text-base">
                Сумма для добавления/списания (используйте - для списания)
              </Label>
              <Input
                type="number"
                placeholder="100 или -50"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3"
              />
            </div>
            <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleUpdateBalance}
                disabled={updateBalanceMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-3"
              >
                {updateBalanceMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Обновление...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    Обновить
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBalanceModal(false)}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg py-3"
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="max-w-md p-6 sm:p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
              Изменить роль: {selectedUserId && users.find((u: any) => u.id === selectedUserId)?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
              Текущая роль: {selectedUserId && getRoleBadge(users.find((u: any) => u.id === selectedUserId)?.role)}
            </p>
            <div className="form-group">
              <Label className="text-gray-700 dark:text-gray-300 block mb-2 text-base">
                Новая роль
              </Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value)}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3">
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg z-[10002]" style={{ zIndex: 10002 }}>
                  <SelectItem value="user" className="hover:bg-gray-100 dark:hover:bg-gray-700">Пользователь</SelectItem>
                  <SelectItem value="watcher" className="hover:bg-gray-100 dark:hover:bg-gray-700">Смотрящий</SelectItem>
                  <SelectItem value="moderator" className="hover:bg-gray-100 dark:hover:bg-gray-700">Модератор</SelectItem>
                  <SelectItem value="admin" className="hover:bg-gray-100 dark:hover:bg-gray-700">Администратор</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleUpdateRole}
                disabled={updateRoleMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3"
              >
                {updateRoleMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Обновление...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    Обновить
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRoleModal(false)}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg py-3"
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block User Modal */}
      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent className="max-w-md p-6 sm:p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
              {userToBlock?.status === 'blocked' ? 'Разблокировать пользователя' : 'Заблокировать пользователя'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Avatar className="w-12 h-12 rounded-lg">
                <AvatarImage 
                  src={userToBlock?.profileImageUrl || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNDc0NzQ3Ii8+CjxwYXRoIGQ9Ik01MCA1MEMzOC4xIDUwIDI5IDQxLjUgMjkgMzFDMjkgMjAuNSAzOC4xIDEyIDUwIDEyQzYxLjkgMTIgNzEgMjAuNSA3MSAzMUM3MSA0MS41IDYxLjkgNTAgNTAgNTBaTTIwIDgwQzIwIDY0LjQgMzQuNCA1MCA1MCA1MEM2NS42IDUwIDgwIDY0LjQgODAgODBWODVIMjBWODBaIiBmaWxsPSIjOTA5MDkwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI5NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjQUFBQUFBIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbmNvZ25pdG88L3RleHQ+Cjwvc3ZnPgo="} 
                  alt="Avatar" 
                  className="w-12 h-12 object-cover"
                />
                <AvatarFallback className="w-12 h-12 rounded-lg">
                  {(userToBlock?.firstName?.[0] || '').replace('n', '')}{(userToBlock?.lastName?.[0] || '').replace('n', '') || userToBlock?.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{userToBlock?.username}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {[userToBlock?.firstName, userToBlock?.lastName].filter(name => name && name.trim()).join(" ") || "Имя не указано"}
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start">
                <i className="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400 mt-1 mr-3"></i>
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    {userToBlock?.status === 'blocked' ? 'Подтверждение разблокировки' : 'Подтверждение блокировки'}
                  </h4>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    {userToBlock?.status === 'blocked' 
                      ? 'После разблокировки пользователь снова сможет пользоваться системой.'
                      : 'После блокировки пользователь не сможет войти в систему и использовать её функции.'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => {
                  if (userToBlock) {
                    toggleUserStatusMutation.mutate({ 
                      userId: userToBlock.id, 
                      action: userToBlock.status === 'blocked' ? 'unblock' : 'block' 
                    });
                    setShowBlockModal(false);
                    setUserToBlock(null);
                  }
                }}
                disabled={toggleUserStatusMutation.isPending}
                className={`flex-1 ${userToBlock?.status === 'blocked' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
                } text-white rounded-lg py-3`}
              >
                {toggleUserStatusMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {userToBlock?.status === 'blocked' ? 'Разблокировка...' : 'Блокировка...'}
                  </>
                ) : (
                  <>
                    <i className={`fas ${userToBlock?.status === 'blocked' ? 'fa-unlock' : 'fa-ban'} mr-2`}></i>
                    {userToBlock?.status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowBlockModal(false);
                  setUserToBlock(null);
                }}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg py-3"
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BackToTopButton />
      <SEOFooter />
    </div>
  );
}
