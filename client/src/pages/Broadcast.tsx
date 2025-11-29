
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Send, Users, Mail, MessageCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import SEOFooter from "@/components/SEOFooter";
import BackToTopButton from "@/components/BackToTopButton";

interface BroadcastStats {
  totalUsers: number;
  emailUsers: number;
  telegramUsers: number;
}

export default function Broadcast() {
  const [type, setType] = useState<"email" | "telegram">("email");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery<BroadcastStats>({
    queryKey: ["/api/broadcast/stats"],
  });

  const sendBroadcastMutation = useMutation({
    mutationFn: async (data: { type: string; subject?: string; message: string }) => {
      const response = await fetch("/api/broadcast/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ошибка отправки рассылки");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Рассылка отправлена",
        description: `Сообщение отправлено ${data.sentCount} пользователям`,
      });
      setSubject("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/broadcast/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите текст сообщения",
        variant: "destructive",
      });
      return;
    }

    if (type === "email" && !subject.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите тему письма",
        variant: "destructive",
      });
      return;
    }

    sendBroadcastMutation.mutate({
      type,
      subject: type === "email" ? subject : undefined,
      message,
    });
  };

  if (statsLoading) {
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
          <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 lg:px-6 py-2 lg:py-3 pt-4 lg:pt-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold">Рассылка уведомлений</h2>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
                Отправка массовых уведомлений пользователям через email и Telegram
              </p>
            </div>
          </header>
          <main className="pt-20 lg:pt-6">
            <div className="max-w-7xl mx-auto p-3 lg:p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </main>
        </div>
        <BackToTopButton />
      <SEOFooter />
      </div>
    );
  }

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
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 lg:px-6 py-2 lg:py-3 pt-4 lg:pt-4">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/admin")}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 px-0"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Назад
            </Button>
            <h2 className="text-xl lg:text-2xl font-bold">Рассылка уведомлений</h2>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
              Отправка массовых уведомлений пользователям через email и Telegram
            </p>
          </div>
        </header>

        <main className="pt-20 lg:pt-6">
          <div className="max-w-7xl mx-auto p-3 lg:p-6 space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">С email</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.emailUsers || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">С Telegram</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.telegramUsers || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Broadcast Form */}
            <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Отправить рассылку</CardTitle>
                <CardDescription>
                  Выберите тип рассылки и введите сообщение для отправки пользователям
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Type Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Тип рассылки</Label>
                    <RadioGroup
                      value={type}
                      onValueChange={(value: "email" | "telegram") => setType(value)}
                      className="flex flex-row space-x-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="email" />
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email ({stats?.emailUsers || 0} получателей)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="telegram" id="telegram" />
                        <Label htmlFor="telegram" className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          Telegram ({stats?.telegramUsers || 0} получателей)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Subject Field (only for email) */}
                  {type === "email" && (
                    <div className="space-y-2">
                      <Label htmlFor="subject">Тема письма</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Введите тему письма"
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        required
                      />
                    </div>
                  )}

                  {/* Message Field */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Сообщение</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Введите текст сообщения"
                      className="min-h-[120px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      required
                    />
                    {type === "telegram" && (
                      <p className="text-sm text-muted-foreground">
                        Поддерживается HTML разметка: &lt;b&gt;жирный&lt;/b&gt;, &lt;i&gt;курсив&lt;/i&gt;, &lt;a href="url"&gt;ссылка&lt;/a&gt;
                      </p>
                    )}
                  </div>

                  {/* Warning */}
                  <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                    <AlertDescription>
                      Рассылка будет отправлена {type === "email" ? `${stats?.emailUsers || 0} пользователям по email` : `${stats?.telegramUsers || 0} пользователям в Telegram`}.
                      Убедитесь, что сообщение составлено корректно.
                    </AlertDescription>
                  </Alert>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={sendBroadcastMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {sendBroadcastMutation.isPending ? (
                      "Отправка..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Отправить рассылку
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <BackToTopButton />
      <SEOFooter />
    </div>
  );
}
