
import React, { useState, useEffect } from 'react';
import { FixedModal } from '@/components/FixedModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface EditPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  publication: any;
  categories?: any[];
}

export default function EditPublicationModal({
  isOpen,
  onClose,
  publication,
  categories: propCategories
}: EditPublicationModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    categoryId: '',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Получаем категории из API, если не переданы через props
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
    enabled: !propCategories || propCategories.length === 0,
  });

  const categoriesData = propCategories && propCategories.length > 0 ? propCategories : categories;

  useEffect(() => {
    if (publication && isOpen) {
      setFormData({
        name: publication.name || publication.title || '',
        title: publication.title || publication.name || '',
        description: publication.description || '',
        categoryId: publication.categoryId?.toString() || '',
        imageUrl: publication.imageUrl || publication.avatarUrl || ''
      });
      
      if (publication.imageUrl || publication.avatarUrl) {
        setImagePreview(publication.imageUrl || publication.avatarUrl);
      }
    }
  }, [publication, isOpen]);

  const handleClose = () => {
    setFormData({
      name: '',
      title: '',
      description: '',
      categoryId: '',
      imageUrl: ''
    });
    setImageFile(null);
    setImagePreview('');
    onClose();
  };

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/channels/${publication.id}`, data);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Успешно",
        description: "Публикация обновлена",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/channels/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/channels/bots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/channels/groups"] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить публикацию",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Ошибка",
          description: "Размер файла не должен превышать 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setImagePreview(base64String);
        setFormData({ ...formData, imageUrl: base64String });
      };
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData({ ...formData, imageUrl: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Ошибка валидации",
        description: "Название обязательно для заполнения",
        variant: "destructive",
      });
      return;
    }

    if (!formData.categoryId) {
      toast({
        title: "Ошибка валидации",
        description: "Выберите категорию",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      name: formData.name.trim(),
      title: formData.title.trim() || formData.name.trim(),
      description: formData.description.trim(),
      categoryId: parseInt(formData.categoryId),
      imageUrl: formData.imageUrl.trim()
    });
  };

  return (
    <FixedModal open={isOpen} onOpenChange={handleClose} className="max-w-md p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Редактировать публикацию</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Изменения вступят в силу сразу после сохранения
        </p>
        {publication && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              Редактирование: {publication.name}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Тип: {publication.type === 'channel' ? 'Канал' : publication.type === 'bot' ? 'Бот' : 'Группа'}
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div className="form-group">
          <Label className="text-gray-700 dark:text-gray-300 block mb-2 text-base">
            Название {publication?.type === "channel" ? "канала" : publication?.type === "group" ? "группы" : "бота"} *
          </Label>
          <Input
            value={formData.name}
            onChange={(e) => {
              if (e.target.value.length <= 25) {
                setFormData({ ...formData, name: e.target.value, title: e.target.value });
              }
            }}
            placeholder={`Название ${publication?.type === "channel" ? "канала" : publication?.type === "group" ? "группы" : "бота"}`}
            className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3"
            maxLength={25}
            required
          />
          <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.name.length}/25
          </div>
        </div>

        {/* Category */}
        <div className="form-group">
          <Label className="text-gray-700 dark:text-gray-300 block mb-2 text-base">Категория *</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
          >
            <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3">
              <SelectValue placeholder="Выберите категорию" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg z-[10002]" style={{ zIndex: 10002 }}>
              {Array.isArray(categoriesData) &&
                categoriesData.map((category: any) => (
                  <SelectItem
                    key={category.id}
                    value={category.id.toString()}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center">
                      {category.icon && <i className={`fas fa-${category.icon} mr-2`}></i>}
                      {category.name} ({category.price}₽)
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="form-group">
          <Label className="text-gray-700 dark:text-gray-300 block mb-2 text-base">Описание</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => {
              if (e.target.value.length <= 300) {
                setFormData({ ...formData, description: e.target.value });
              }
            }}
            placeholder="Описание публикации"
            className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3"
            rows={4}
            maxLength={300}
          />
          <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.description.length}/300
          </div>
        </div>

        {/* Image Upload */}
        <div className="form-group">
          <Label className="text-gray-700 dark:text-gray-300 block mb-2 text-base">Изображение</Label>
          <div className="space-y-4">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg border border-gray-300 dark:border-gray-700"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute top-3 right-3 bg-red-600 hover:bg-red-700"
                  onClick={removeImage}
                >
                  <i className="fas fa-times"></i>
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-800">
                <i className="fas fa-cloud-upload-alt text-gray-400 dark:text-gray-500 text-3xl mb-3"></i>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">Загрузите изображение</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload-edit"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("image-upload-edit")?.click()}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Выбрать файл
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-3"
          >
            {updateMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Сохранение...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Сохранить изменения
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={updateMutation.isPending}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg py-3"
          >
            Отмена
          </Button>
        </div>
      </form>
    </FixedModal>
  );
}
