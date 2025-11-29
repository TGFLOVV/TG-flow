import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ChannelCard from "@/components/ChannelCard";
import ConfirmationModal from "@/components/ConfirmationModal";

import GridSkeleton from "@/components/GridSkeleton";
import { PageLoader } from "@/components/LoadingSpinner";
import BackToTopButton from "@/components/BackToTopButton";
import SEOFooter from "@/components/SEOFooter";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Groups() {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["/api/channels/groups"],
    queryFn: async () => {
      const response = await fetch('/api/channels?type=group');
      const data = await response.json();
      // Дополнительная фильтрация на клиенте для гарантии
      const filteredData = Array.isArray(data) ? data.filter(item => item.type === 'group') : [];
      return filteredData;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const deleteGroup = useMutation({
    mutationFn: (groupId: number) => apiRequest("DELETE", `/api/channels/${groupId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels/groups"] });
      toast({
        title: "Группа удалена",
        description: "Группа успешно удалена из каталога",
      });
      setDeleteModalOpen(false);
      setSelectedGroup(null);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить группу",
        variant: "destructive",
      });
    },
  });

  const handleDeleteGroup = (group: any) => {
    setSelectedGroup(group);
    setDeleteModalOpen(true);
  };

  const canManage = user && ['admin', 'moderator'].includes(user.role);

  // Sort groups by promotion status: ultra-top first, then by TOP promotion date, then by creation date
  const sortedGroups = (groups as any[]).sort((a, b) => {
    // Ultra-top promoted items first
    if (a.isUltraTop && !b.isUltraTop) return -1;
    if (!a.isUltraTop && b.isUltraTop) return 1;

    // If both are ultra-top, sort by ultra-top expiry date (more time remaining = higher position)
    if (a.isUltraTop && b.isUltraTop) {
      const dateA = a.ultraTopExpiresAt ? new Date(a.ultraTopExpiresAt).getTime() : 0;
      const dateB = b.ultraTopExpiresAt ? new Date(b.ultraTopExpiresAt).getTime() : 0;
      return dateB - dateA;
    }

    // Then top promoted items (sort by TOP promotion date)
    if (a.isTop && !b.isTop) return -1;
    if (!a.isTop && b.isTop) return 1;

    if (a.isTop && b.isTop) {
      const dateA = a.topPromotedAt ? new Date(a.topPromotedAt).getTime() : 0;
      const dateB = b.topPromotedAt ? new Date(b.topPromotedAt).getTime() : 0;
      return dateB - dateA;
    }

    // Then by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/70 to-blue-50/70 dark:from-gray-900/70 dark:to-gray-800/70 text-gray-900 dark:text-white">
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <Header 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <main className="header-padding lg:ml-64">
        <div className="max-w-7xl mx-auto px-3 lg:px-6 py-2 lg:py-3">
            <div className="mb-2 lg:mb-3">
              <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">Telegram Группы</h1>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Присоединяйтесь к интересным сообществам</p>
            </div>

            {isLoading ? (
              <GridSkeleton count={6} columns={3} />
            ) : (
              <>
                {/* All groups */}
                {sortedGroups.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {sortedGroups.map((group) => (
                      <ChannelCard key={group.id} channel={group} />
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {sortedGroups.length === 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-800 rounded-xl border p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-users text-gray-500 dark:text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Группы не найдены</h3>
                    <p className="text-gray-600 dark:text-gray-400">Пока что нет доступных групп</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => deleteGroup.mutate(selectedGroup?.id)}
        title="Удалить группу"
        description={`Вы уверены, что хотите удалить группу "${selectedGroup?.name}"? Это действие необратимо.`}
        confirmText="Удалить"
        isLoading={deleteGroup.isPending}
      />

      <BackToTopButton />
      <SEOFooter />
    </div>
  );
}