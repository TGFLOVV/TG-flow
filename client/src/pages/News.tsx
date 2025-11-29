import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FixedModal } from "@/components/FixedModal";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import BackToTopButton from "@/components/BackToTopButton";
import SEOFooter from "@/components/SEOFooter";

import GridSkeleton from "@/components/GridSkeleton";
import VirtualizedChannelGrid from "@/components/VirtualizedChannelGrid";

export default function News() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: news = [], isLoading } = useQuery({
    queryKey: ["/api/news"],
  });

  const createNewsMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; imageUrl?: string }) => {
      return await apiRequest("POST", "/api/news", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({
        title: "Успешно",
        description: "Новость создана",
      });
      setTitle("");
      setContent("");
      setImageFile(null);
      setShowAddModal(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать новость",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = undefined;

      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      await createNewsMutation.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        imageUrl,
      });
    } catch (error) {
      console.error('Error creating news:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Ошибка",
          description: "Размер файла не должен превышать 5MB",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
    }
  };

  const canManageNews = user?.role === 'admin' || user?.role === 'moderator';

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
        <main className="header-padding">
          <header className="bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 px-3 lg:px-6 py-2 lg:py-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold">Новости</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">Последние новости и обновления</p>
              </div>
              {canManageNews && (
                <>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => setShowAddModal(true)}
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Добавить новость
                  </Button>

                  <FixedModal 
                    open={showAddModal} 
                    onOpenChange={setShowAddModal}
                  >
                    <div className="p-6">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Создать новость</h2>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-900 dark:text-white">Заголовок</label>
                          <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Введите заголовок новости"
                            className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-900 dark:text-white">Изображение (необязательно)</label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                          />
                          {imageFile && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Выбран файл: {imageFile.name}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-900 dark:text-white">Содержание</label>
                          <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Введите содержание новости"
                            rows={6}
                            className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div className="flex space-x-3">
                          <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
                          >
                            {isSubmitting ? (
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                            ) : (
                              <i className="fas fa-plus mr-2"></i>
                            )}
                            Создать
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowAddModal(false)}
                            className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
                          >
                            Отмена
                          </Button>
                        </div>
                      </div>
                    </div>
                  </FixedModal>
                </>
              )}
            </div>
          </header>

          <div className="p-3 lg:p-6">
            <div className="max-w-full lg:max-w-7xl mx-auto w-full">
              {isLoading ? (
                <GridSkeleton count={6} columns={3} />
              ) : Array.isArray(news) && news.length === 0 ? (
                <Card className="bg-white/80 dark:bg-gray-900/80 border-2 border-gray-300 dark:border-gray-700 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-200/80 dark:bg-gray-700/80 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-newspaper text-gray-500 dark:text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Новости не найдены</h3>
                    <p className="text-gray-600 dark:text-gray-400">Пока нет опубликованных новостей</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* All news without TOP sections */}

                  {Array.isArray(news) && (
                    <>
                      {/* Mobile Grid View */}
                      <div className="lg:hidden grid grid-cols-1 gap-4">
                        {news.map((article: any) => (
                          <Card 
                            key={article.id} 
                            className="bg-white/80 dark:bg-gray-900/80 border border-gray-300 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
                          >
                            <CardContent className="p-4">
                              <div className="flex flex-col h-full">
                                {article.imageUrl && (
                                  <div className="mb-3 flex justify-center">
                                    <img 
                                      src={article.imageUrl} 
                                      alt={article.title}
                                      className="w-20 h-20 object-cover rounded-lg"
                                    />
                                  </div>
                                )}
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200 line-clamp-2">
                                  {article.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 flex-grow line-clamp-3">
                                  {article.content}
                                </p>
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-auto">
                                  <span className="flex items-center">
                                    <i className="far fa-calendar mr-1"></i>
                                    {new Date(article.createdAt).toLocaleDateString('ru-RU')}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Desktop List View */}
                      <div className="hidden lg:block space-y-4">
                        {news.map((article: any) => (
                          <Card 
                            key={article.id} 
                            className="bg-white/80 dark:bg-gray-900/80 border border-gray-300 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start space-x-4">
                                <div className="w-2 h-16 bg-gradient-to-b from-purple-500 to-purple-700 rounded-full flex-shrink-0"></div>
                                <div className="flex-1 min-w-0">
                                  {article.imageUrl && (
                                    <div className="mb-4">
                                      <img 
                                        src={article.imageUrl} 
                                        alt={article.title}
                                        className="w-32 h-32 object-cover rounded-lg"
                                      />
                                    </div>
                                  )}
                                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                                    {article.title}
                                  </h3>
                                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    {article.content}
                                  </p>
                                  <div className="flex items-center">
                                    <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                      <i className="far fa-calendar mr-2"></i>
                                      {new Date(article.createdAt).toLocaleDateString('ru-RU')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <BackToTopButton />
      <SEOFooter />
    </div>
  );
}