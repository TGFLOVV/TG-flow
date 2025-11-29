import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import SEOFooter from "@/components/SEOFooter";
import LoadingSpinner from "@/components/LoadingSpinner";
import BackToTopButton from "@/components/BackToTopButton";

export default function WithdrawalRequests() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ["/api/withdrawal-requests", activeTab],
    queryFn: () => apiRequest("GET", `/api/withdrawal-requests?status=${activeTab !== "all" ? activeTab : ""}`),
    staleTime: 30 * 1000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => apiRequest("GET", "/api/users"),
    staleTime: 60 * 1000,
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: number; status: string; rejectionReason?: string }) =>
      apiRequest("PATCH", `/api/withdrawal-requests/${id}`, { status, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawal-requests"] });
      toast({
        title: "Заявка обновлена",
        description: "Статус заявки успешно изменен",
        className: "bg-green-600 text-white border-green-500",
      });
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить заявку",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">На рассмотрении</Badge>;
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600">Одобрена</Badge>;
      case "rejected":
        return <Badge className="bg-red-500 hover:bg-red-600">Отклонена</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "sbp":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">СБП</Badge>;
      case "card":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Карта</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const handleApprove = (request: any) => {
    updateRequestMutation.mutate({
      id: request.id,
      status: "approved",
    });
  };

  const handleReject = () => {
    if (!selectedRequest) return;

    updateRequestMutation.mutate({
      id: selectedRequest.id,
      status: "rejected",
      rejectionReason: rejectionReason.trim() || "Не указана",
    });
  };

  const formatCardNumber = (cardNumber: string) => {
    if (!cardNumber) return "";
    return cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ****").slice(0, 9) + " ****";
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex">
        <Sidebar 
          isMobileMenuOpen={isMobileMenuOpen} 
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        <main className="flex-1 p-2 sm:p-4 lg:p-6 lg:ml-64 main-content">
          <div className="max-w-full lg:max-w-7xl mx-auto header-padding overflow-x-hidden">
            <Card className="w-full">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold">Заявки на вывод средств</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 lg:p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                    <TabsTrigger value="pending" className="text-xs sm:text-sm px-2 py-2">На рассмотрении</TabsTrigger>
                    <TabsTrigger value="approved" className="text-xs sm:text-sm px-2 py-2">Одобренные</TabsTrigger>
                    <TabsTrigger value="rejected" className="text-xs sm:text-sm px-2 py-2">Отклоненные</TabsTrigger>
                    <TabsTrigger value="all" className="text-xs sm:text-sm px-2 py-2">Все</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="mt-6">
                    {requests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Заявки не найдены
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto border rounded-lg">
                          <Table className="min-w-[800px]">
                            <TableHeader>
                              <TableRow>
                                <TableHead className="min-w-[120px] text-xs sm:text-sm">Пользователь</TableHead>
                                <TableHead className="min-w-[80px] text-xs sm:text-sm">Сумма</TableHead>
                                <TableHead className="min-w-[70px] text-xs sm:text-sm">Способ</TableHead>
                                <TableHead className="min-w-[100px] text-xs sm:text-sm">Реквизиты</TableHead>
                                <TableHead className="min-w-[80px] text-xs sm:text-sm">Статус</TableHead>
                                <TableHead className="min-w-[80px] text-xs sm:text-sm">Дата</TableHead>
                                <TableHead className="min-w-[120px] text-xs sm:text-sm">Действия</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {requests.map((request: any) => {
                                const user = users.find((u: any) => u.id === request.userId);
                                return (
                                <TableRow key={request.id}>
                                  <TableCell className="p-2 sm:p-4">
                                    <div className="max-w-[100px] sm:max-w-none">
                                      <div className="font-semibold text-xs sm:text-sm truncate">{user?.username || 'Неизвестно'}</div>
                                      <div className="text-xs text-gray-500 truncate">
                                        {user?.firstName} {user?.lastName}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        ID: {request.userId}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="p-2 sm:p-4">
                                    <div className="font-semibold text-green-600 text-xs sm:text-sm whitespace-nowrap">
                                      {parseFloat(request.amount).toFixed(2)} ₽
                                    </div>
                                  </TableCell>
                                  <TableCell className="p-2 sm:p-4">
                                    {getMethodBadge(request.method)}
                                  </TableCell>
                                  <TableCell className="p-2 sm:p-4">
                                    <div className="text-xs sm:text-sm max-w-[80px] sm:max-w-[120px] break-words">
                                      {request.method === "sbp" ? (
                                        <>
                                          <div>{request.phoneNumber}</div>
                                          <div className="text-gray-500 text-xs">{request.bankName}</div>
                                        </>
                                      ) : (
                                        <div>{formatCardNumber(request.cardNumber)}</div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="p-2 sm:p-4">
                                    {getStatusBadge(request.status)}
                                  </TableCell>
                                  <TableCell className="p-2 sm:p-4">
                                    <div className="text-xs sm:text-sm whitespace-nowrap">
                                      {new Date(request.createdAt).toLocaleDateString("ru-RU")}
                                    </div>
                                  </TableCell>
                                  <TableCell className="p-2 sm:p-4">
                                    {request.status === "pending" && (
                                      <div className="flex flex-col gap-1 min-w-[100px]">
                                        <Button
                                          size="sm"
                                          onClick={() => handleApprove(request)}
                                          disabled={updateRequestMutation.isPending}
                                          className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-auto"
                                        >
                                          Одобрить
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => {
                                            setSelectedRequest(request);
                                            setShowRejectDialog(true);
                                          }}
                                          disabled={updateRequestMutation.isPending}
                                          className="text-xs px-2 py-1 h-auto"
                                        >
                                          Отклонить
                                        </Button>
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              )})}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden space-y-3">
                          {requests.map((request: any) => {
                            const user = users.find((u: any) => u.id === request.userId);
                            return (
                              <Card key={request.id} className="p-4 border border-gray-200 dark:border-gray-800">
                                <div className="space-y-3">
                                  {/* Header with User and Amount */}
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-sm truncate">{user?.username || 'Неизвестно'}</div>
                                      <div className="text-xs text-gray-500 truncate">
                                        {user?.firstName} {user?.lastName}
                                      </div>
                                      <div className="text-xs text-gray-400">ID: {request.userId}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold text-green-600 text-sm">
                                        {parseFloat(request.amount).toFixed(2)} ₽
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {new Date(request.createdAt).toLocaleDateString("ru-RU")}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Method and Status */}
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      {getMethodBadge(request.method)}
                                      {getStatusBadge(request.status)}
                                    </div>
                                  </div>

                                  {/* Payment Details */}
                                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Реквизиты:</div>
                                    <div className="text-sm break-all">
                                      {request.method === "sbp" ? (
                                        <>
                                          <div>{request.phoneNumber}</div>
                                          <div className="text-gray-500 text-xs mt-1">{request.bankName}</div>
                                        </>
                                      ) : (
                                        <div>{formatCardNumber(request.cardNumber)}</div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  {request.status === "pending" && (
                                    <div className="flex gap-2 pt-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleApprove(request)}
                                        disabled={updateRequestMutation.isPending}
                                        className="bg-green-600 hover:bg-green-700 text-xs flex-1"
                                      >
                                        Одобрить
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                          setSelectedRequest(request);
                                          setShowRejectDialog(true);
                                        }}
                                        disabled={updateRequestMutation.isPending}
                                        className="text-xs flex-1"
                                      >
                                        Отклонить
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонить заявку</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Укажите причину отклонения заявки:
              </p>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Причина отклонения..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
                className="flex-1"
              >
                Отменить
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={updateRequestMutation.isPending}
                className="flex-1"
              >
                {updateRequestMutation.isPending ? "Отклонение..." : "Отклонить"}
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