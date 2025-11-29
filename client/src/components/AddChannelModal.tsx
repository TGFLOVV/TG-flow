import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FixedModal } from "@/components/FixedModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { extractErrorMessage } from "@/lib/errorMessageCleaner";

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddChannelModal({ isOpen, onClose, onSuccess }: AddChannelModalProps) {
  const [formData, setFormData] = useState({
    channelName: "",
    channelUrl: "",
    description: "",
    categoryId: "",
    type: "",
    channelImage: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const { toast } = useToast();

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  // Get user data for balance check
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const addChannelMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/applications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Заявка отправлена",
        description: "Ваша заявка отправлена на модерацию",
      });
      onClose();
      resetForm();
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Error submitting application:", error);

      let errorMessage = extractErrorMessage(error);
      let errorTitle = "Ошибка при отправке заявки";

      if (errorMessage.includes("уже существует") || errorMessage.includes("уже подана")) {
        errorTitle = "Канал уже существует";
        errorMessage = "Канал с такой ссылкой уже добавлен в каталог или заявка на него уже подана";
      } else if (errorMessage.includes("Недостаточно средств") || errorMessage.includes("Insufficient balance")) {
        errorTitle = "Недостаточно средств";
        errorMessage = "На вашем балансе недостаточно средств для подачи заявки. Пополните баланс и попробуйте снова";
      } else if (errorMessage.includes("Ссылка должна начинаться")) {
        errorTitle = "Неверная ссылка";
      } else if (error?.response?.status === 409) {
        errorTitle = "Канал уже существует";
        errorMessage = "Канал с такой ссылкой уже добавлен в каталог";
      } else if (error?.response?.status === 403) {
        errorTitle = "Недостаточно прав";
        errorMessage = "У вас нет прав для создания канала";
      } else if (error?.response?.status === 422) {
        errorTitle = "Неверные данные";
        errorMessage = "Проверьте правильность заполнения всех полей";
      } else if (errorMessage === "Произошла неожиданная ошибка") {
        errorMessage = "Не удалось отправить заявку";
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      channelName: "",
      channelUrl: "",
      description: "",
      categoryId: "",
      type: "",
      channelImage: "",
    });
    setImageFile(null);
    setImagePreview("");
  };

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
        setFormData({ ...formData, channelImage: base64String });
      };
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData({ ...formData, channelImage: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.channelName || !formData.channelUrl || !formData.type || !formData.categoryId) {
      toast({
        title: "Ошибка валидации",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    if (!formData.channelUrl.startsWith("https://t.me/")) {
      toast({
        title: "Неверная ссылка",
        description: "Ссылка должна начинаться с https://t.me/",
        variant: "destructive",
      });
      return;
    }

    const selectedCategory = categories.find((cat: any) => cat.id === parseInt(formData.categoryId));
    const price = parseFloat(selectedCategory?.price || "30");
    const userBalance = parseFloat((user as any)?.balance || "0");

    if (userBalance < price) {
      toast({
        title: "Недостаточно средств",
        description: `На вашем балансе ${userBalance}₽, а стоимость подачи заявки ${price}₽. Пополните баланс и попробуйте снова`,
        variant: "destructive",
      });
      return;
    }

    const applicationData = {
      ...formData,
      categoryId: parseInt(formData.categoryId),
      price: price.toString(),
    };

    addChannelMutation.mutate(applicationData);
  };

  return (
    <FixedModal open={isOpen} onOpenChange={onClose} className="max-w-md p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Добавить в каталог</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Заполните форму для добавления вашего канала в каталог</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Selection */}
        <div className="form-group">
          <Label className="text-gray-700 dark:text-gray-300 block mb-2 text-base">Тип *</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3">
              <SelectValue placeholder="Выберите тип" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg z-[10002]" style={{ zIndex: 10002 }}>
              <SelectItem value="channel" className="hover:bg-gray-100 dark:hover:bg-gray-700">Канал</SelectItem>
              <SelectItem value="group" className="hover:bg-gray-100 dark:hover:bg-gray-700">Группа</SelectItem>
              <SelectItem value="bot" className="hover:bg-gray-100 dark:hover:bg-gray-700">Бот</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Name */}
        <div className="form-group">
          <Label className="text-gray-700 dark:text-gray-300 block mb-2 text-base">
            Название {formData.type === "channel" ? "канала" : formData.type === "group" ? "группы" : "бота"} *
          </Label>
          <Input
            value={formData.channelName}
            onChange={(e) => {
              if (e.target.value.length <= 25) {
                setFormData({ ...formData, channelName: e.target.value });
              }
            }}
            placeholder={`Название вашего ${formData.type === "channel" ? "канала" : formData.type === "group" ? "группы" : "бота"}`}
            className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3"
            maxLength={25}
          />
          <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.channelName.length}/25
          </div>
        </div>

        {/* URL */}
        <div className="form-group">
          <Label className="text-gray-700 dark:text-gray-300 block mb-2 text-base">
            Ссылка на {formData.type === "channel" ? "канал" : formData.type === "group" ? "группу" : "бота"} *
          </Label>
          <Input
            value={formData.channelUrl}
            onChange={(e) => {
              if (e.target.value.length <= 40) {
                setFormData({ ...formData, channelUrl: e.target.value });
              }
            }}
            placeholder="https://t.me/your_channel"
            className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3"
            maxLength={40}
          />
          <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.channelUrl.length}/40
          </div>
        </div>

        {/* Category */}
        <div className="form-group">
          <Label className="text-gray-700 dark:text-gray-300 block mb-2 text-base">Категория *</Label>
          <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
            <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-3">
              <SelectValue placeholder="Выберите категорию" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg z-[10002]" style={{ zIndex: 10002 }}>
              {Array.isArray(categories) &&
                categories.map((category: any) => (
                  <SelectItem
                    key={category.id}
                    value={category.id.toString()}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {category.name} ({category.price}₽)
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
            placeholder="Описание канала"
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
                  id="image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("image-upload")?.click()}
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
            disabled={addChannelMutation.isPending}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-3"
          >
            {addChannelMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Отправка...
              </>
            ) : (
              <>
                <i className="fas fa-plus mr-2"></i>
                Отправить заявку
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg py-3"
          >
            Отмена
          </Button>
        </div>
      </form>
    </FixedModal>
  );
}