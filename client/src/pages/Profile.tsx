import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Mail, Wallet, Plus } from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Header from "@/components/Header";
import BackToTopButton from "@/components/BackToTopButton";
import SEOFooter from "@/components/SEOFooter";
import UserStatistics from "@/components/UserStatistics";
import AccountConnections from "@/components/AccountConnections";
import SecuritySettings from "@/components/SecuritySettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, User, Settings, Edit2, Check, X } from "lucide-react";
import WithdrawalModal from "@/components/WithdrawalModal";
import { FixedModal } from "@/components/FixedModal";

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string | null;
  balance: number;
  role: string;
  status: string;
  createdAt: string;
}

export default function Profile() {
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Edit states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    firstName: "",
    lastName: "",
    email: ""
  });

  // Email verification states
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
  });

  const typedUser = user as User | undefined;

  React.useEffect(() => {
    if (error) {
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить данные пользователя",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const { data: myPendingApplications = [] } = useQuery({
    queryKey: ["/api/user/applications", "pending"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user/applications?status=pending', {
          credentials: 'include'
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload avatar');
      }

      const data = await response.json();
      return data.user;
    },
    onSuccess: async (updatedUser) => {
      console.log('🎯 Avatar upload success, updated user:', {
        hasProfileImage: !!updatedUser?.profileImageUrl,
        profileImageUrlLength: updatedUser?.profileImageUrl?.length || 0,
        userData: updatedUser
      });

      setSelectedAvatar(null);
      setAvatarPreview(null);

      // Очищаем файловый input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Принудительно обновляем кэш с новыми данными пользователя
      queryClient.setQueryData(["/api/user"], updatedUser);

      // Инвалидируем кэш для всех компонентов - расширенная инвалидация
      await queryClient.invalidateQueries({ 
        queryKey: ["/api/user"],
        exact: false,
        refetchType: 'all'
      });

      // Принудительно перезапрашиваем данные
      await queryClient.refetchQueries({ 
        queryKey: ["/api/user"],
        type: 'all'
      });

      toast({
        title: "Аватар обновлен",
        description: "Ваш аватар успешно обновлен",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить аватар",
        variant: "destructive",
      });
    },
  });

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Ошибка",
          description: "Размер файла не должен превышать 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ошибка",
          description: "Выберите файл изображения",
          variant: "destructive",
        });
        return;
      }

      setSelectedAvatar(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setAvatarPreview(e.target.result as string);
        }
      };
      reader.onerror = () => {
        toast({
          title: "Ошибка",
          description: "Не удалось прочитать файл",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при выборе аватара",
        variant: "destructive",
      });
    }
  };

  const removeAvatar = () => {
    setSelectedAvatar(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const saveAvatar = () => {
    if (selectedAvatar) {
      updateAvatarMutation.mutate(selectedAvatar);
    }
  };

  // Initialize edit values when user data changes
  React.useEffect(() => {
    if (typedUser) {
      setEditValues({
        firstName: typedUser.firstName || "",
        lastName: typedUser.lastName || "",
        email: typedUser.email || ""
      });
    }
  }, [typedUser]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string }) => 
      apiRequest("PATCH", "/api/user/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setEditingField(null);
      toast({
        title: "Профиль обновлен",
        description: "Данные успешно сохранены",
      });
    },
    onError: (error: any) => {
      console.error("Error updating profile:", error);
      
      let errorMessage = "Не удалось обновить профиль";
      
      const serverMessage = error?.response?.data?.message || "";
      const errorCode = error?.response?.data?.errorCode;
      
      if (error?.response?.status === 400) {
        if (serverMessage.includes("обязателен")) {
          errorMessage = "Необходимо заполнить все обязательные поля";
        } else if (serverMessage.includes("слишком длинный") || 
                   serverMessage.includes("слишком короткий")) {
          errorMessage = "Некорректная длина данных. Проверьте введённую информацию";
        } else if (serverMessage.includes("спецсимвол") || 
                   serverMessage.includes("недопустимые символы")) {
          errorMessage = "Используются недопустимые символы";
        } else if (serverMessage.includes("пустым")) {
          errorMessage = "Поля не могут быть пустыми";
        } else {
          errorMessage = serverMessage || "Некорректные данные профиля";
        }
      } else if (error?.response?.status === 401) {
        errorMessage = "Сессия истекла. Войдите в систему заново";
      } else if (error?.response?.status === 403) {
        errorMessage = "Нет прав для редактирования профиля";
      } else if (error?.response?.status === 413) {
        errorMessage = "Данные профиля слишком большие. Сократите длину текста";
      } else if (error?.response?.status === 422) {
        errorMessage = "Некорректный формат данных";
      } else if (error?.response?.status >= 500) {
        errorMessage = "Ошибка сервера при обновлении профиля";
      } else if (serverMessage) {
        errorMessage = serverMessage;
      }
      
      toast({
        title: "Ошибка обновления",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const sendEmailVerificationMutation = useMutation({
    mutationFn: (data: { email: string }) => 
      apiRequest("POST", "/api/user/email/send-verification", data),
    onSuccess: (data: any) => {
      setPendingEmail(data.email);
      setShowEmailVerification(true);
      toast({
        title: "Код отправлен",
        description: `Код верификации отправлен на ${data.email}`,
      });
    },
    onError: (error: any) => {
      console.error("Error sending verification:", error);
      
      let errorMessage = "Не удалось отправить код верификации";
      
      const serverMessage = error?.response?.data?.message || "";
      const errorCode = error?.response?.data?.errorCode;
      
      // Проверяем message из ошибки (формат "400: сообщение")
      if (error?.message && error.message.includes(": ")) {
        const actualMessage = error.message.split(": ")[1];
        if (actualMessage) {
          errorMessage = actualMessage;
          
          // Проверка на занятый email в извлеченном сообщении
          if (actualMessage.includes("уже привязан к другому аккаунту") ||
              actualMessage.includes("уже используется") ||
              actualMessage.includes("уже занят") ||
              actualMessage.includes("зарегистрирован") ||
              actualMessage.includes("already in use")) {
            errorMessage = "Данная почта уже зарегистрирована на другого пользователя";
          }
        }
      } else if (error?.response?.status === 400) {
        if (errorCode === "EMAIL_ALREADY_EXISTS" || 
            serverMessage.includes("уже привязан к другому аккаунту") ||
            serverMessage.includes("уже используется") ||
            serverMessage.includes("уже занят") ||
            serverMessage.includes("зарегистрирован") ||
            serverMessage.includes("already in use")) {
          errorMessage = "Данная почта уже зарегистрирована на другого пользователя";
        } else if (errorCode === "INVALID_EMAIL_FORMAT" || 
                   serverMessage.includes("некорректный email") ||
                   serverMessage.includes("invalid email") ||
                   serverMessage.includes("email адрес")) {
          errorMessage = "Некорректный формат email адреса";
        } else if (serverMessage.includes("обязателен")) {
          errorMessage = "Поле email обязательно для заполнения";
        } else if (serverMessage.includes("пустым")) {
          errorMessage = "Email не может быть пустым";
        } else {
          errorMessage = serverMessage || "Некорректные данные email";
        }
      } else if (error?.response?.status === 401) {
        errorMessage = "Сессия истекла. Войдите в систему заново";
      } else if (error?.response?.status === 409) {
        errorMessage = "Данная почта уже зарегистрирована на другого пользователя";
      } else if (error?.response?.status === 422) {
        errorMessage = "Некорректный формат email адреса";
      } else if (error?.response?.status === 429) {
        errorMessage = "Слишком много попыток отправки. Попробуйте через несколько минут";
      } else if (error?.response?.status === 500) {
        if (errorCode === "EMAIL_SEND_FAILED") {
          errorMessage = "Не удалось отправить email. Проверьте правильность адреса и попробуйте позже";
        } else {
          errorMessage = "Ошибка сервера при отправке кода";
        }
      } else if (serverMessage) {
        errorMessage = serverMessage;
      }
      
      toast({
        title: "Ошибка отправки кода",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (data: { code: string; email: string }) => 
      apiRequest("POST", "/api/user/email/verify", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setShowEmailVerification(false);
      setEditingField(null);
      setVerificationCode("");
      setPendingEmail("");
      toast({
        title: "Email обновлен",
        description: "Ваш email успешно изменен",
      });
    },
    onError: (error: any) => {
      console.error("Error verifying email:", error);
      
      let errorMessage = "Ошибка верификации кода";
      
      const serverMessage = error?.response?.data?.message || "";
      const errorCode = error?.response?.data?.errorCode;
      
      if (error?.response?.status === 400) {
        if (serverMessage.includes("неверный код") || 
            serverMessage.includes("invalid code") ||
            errorCode === "INVALID_CODE") {
          errorMessage = "Введён неверный код верификации. Проверьте код и попробуйте снова";
        } else if (serverMessage.includes("обязателен")) {
          errorMessage = "Необходимо ввести код верификации";
        } else if (serverMessage.includes("пустым")) {
          errorMessage = "Код верификации не может быть пустым";
        } else {
          errorMessage = serverMessage || "Неверный код верификации";
        }
      } else if (error?.response?.status === 401) {
        errorMessage = "Сессия истекла. Войдите в систему заново";
      } else if (error?.response?.status === 410 || 
                 serverMessage.includes("истек") || 
                 serverMessage.includes("expired") ||
                 errorCode === "CODE_EXPIRED") {
        errorMessage = "Код верификации истёк. Запросите новый код";
      } else if (error?.response?.status === 404 || 
                 serverMessage.includes("не найден") || 
                 serverMessage.includes("not found") ||
                 errorCode === "CODE_NOT_FOUND") {
        errorMessage = "Код верификации не найден. Запросите новый код";
      } else if (error?.response?.status === 429) {
        errorMessage = "Слишком много попыток ввода кода. Попробуйте через несколько минут";
      } else if (error?.response?.status === 500) {
        errorMessage = "Ошибка сервера при верификации кода";
      } else if (serverMessage) {
        errorMessage = serverMessage;
      }
      
      toast({
        title: "Ошибка верификации",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleFieldEdit = (field: string) => {
    setEditingField(field);
  };

  const handleSaveField = (field: string) => {
    if (field === "email") {
      sendEmailVerificationMutation.mutate({ email: editValues.email });
    } else {
      const updateData: any = {};
      if (field === "firstName") updateData.firstName = editValues.firstName;
      if (field === "lastName") updateData.lastName = editValues.lastName;
      updateProfileMutation.mutate(updateData);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    if (typedUser) {
      setEditValues({
        firstName: typedUser.firstName || "",
        lastName: typedUser.lastName || "",
        email: typedUser.email || ""
      });
    }
  };

  const handleVerifyEmail = () => {
    verifyEmailMutation.mutate({ 
      code: verificationCode, 
      email: pendingEmail 
    });
  };

  

  if (isLoading) {
    return (
      <div className="min-h-screen text-gray-900 dark:text-white">
        <Sidebar />
        <div className="lg:ml-64 flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (!typedUser) {
    return (
      <div className="min-h-screen text-gray-900 dark:text-white">
        <Sidebar />
        <div className="lg:ml-64 flex justify-center items-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Пользователь не найден</h2>
            <button 
              onClick={() => window.location.href = '/profile'} 
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500 dark:bg-red-600";
      case "moderator":
        return "bg-blue-500 dark:bg-blue-600";
      case "watcher":
        return "bg-yellow-500 dark:bg-yellow-600";
      default:
        return "bg-gray-500 dark:bg-gray-600";
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "Администратор";
      case "moderator":
        return "Модератор";
      case "watcher":
        return "Смотрящий";
      default:
        return "Пользователь";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 dark:bg-green-600 text-white">Одобрено</Badge>;
      case "rejected":
        return <Badge className="bg-red-500 dark:bg-red-600 text-white">Отклонено</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 dark:bg-yellow-600 text-white">На рассмотрении</Badge>;
      default:
        return <Badge className="bg-gray-500 dark:bg-gray-600 text-white">Неизвестно</Badge>;
    }
  };

  // Обработка аватара
  const getAvatarContent = () => {
    // Если есть предварительный просмотр, показываем его
    if (avatarPreview) {
      return (
        <img 
          src={avatarPreview} 
          alt="User Avatar Preview" 
          className="w-20 h-20 rounded-lg object-cover border border-purple-500/30"
        />
      );
    }

    const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNDc0NzQ3Ii8+CjxwYXRoIGQ9Ik01MCA1MEMzOC4xIDUwIDI5IDQxLjUgMjkgMzFDMjkgMjAuNSAzOC4xIDEyIDUwIDEyQzYxLjkgMTIgNzEgMjAuNSA3MSAzMUM3MSA0MS41IDYxLjkgNTAgNTAgNTBaTTIwIDgwQzIwIDY0LjQgMzQuNCA1MCA1MCA1MEM2NS42IDUwIDgwIDY0LjQgODAgODBWODVIMjBWODBaIiBmaWxsPSIjOTA5MDkwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI5NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjQUFBQUFBIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbmNvZ25pdG88L3RleHQ+Cjwvc3ZnPgo=";

    console.log('🎨 Profile getAvatarContent:', {
      hasUser: !!typedUser,
      profileImageUrl: typedUser?.profileImageUrl ? 'EXISTS' : 'NULL',
      profileImageUrlLength: typedUser?.profileImageUrl?.length || 0,
      isDefault: typedUser?.profileImageUrl === defaultAvatar,
      telegramPhotoUrl: (typedUser as any)?.telegramPhotoUrl ? 'EXISTS' : 'NULL'
    });

    // Определяем источник аватара по приоритету: загруженный > Telegram > инкогнито
    let avatarSrc = defaultAvatar;

    // Проверяем наличие загруженного аватара - проверяем что это НЕ дефолтный и что он существует
    if (typedUser?.profileImageUrl && 
        typedUser.profileImageUrl.length > 100 && // Загруженная картинка должна быть больше 100 символов
        typedUser.profileImageUrl.startsWith('data:image/')) { // И начинаться с data:image/
      avatarSrc = typedUser.profileImageUrl;
      console.log('🎨 Using uploaded avatar');
    } else if ((typedUser as any)?.telegramPhotoUrl) {
      avatarSrc = (typedUser as any).telegramPhotoUrl;
      console.log('🎨 Using Telegram avatar');
    } else {
      console.log('🎨 Using default avatar');
    }

    return (
      <img 
        src={avatarSrc}
        alt="User Avatar"
        className="w-20 h-20 rounded-lg object-cover border border-purple-500/30"
        key={`${typedUser?.id}-${avatarSrc}`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (target.src !== defaultAvatar) {
            target.src = defaultAvatar;
          }
        }}
      />
    );
  };



  return (
    <>
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
              <h2 className="text-xl lg:text-2xl font-bold">Профиль пользователя</h2>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
                Информация об аккаунте и история операций
              </p>
            </div>
          </header>

          <main className="header-padding">
            <div className="max-w-7xl mx-auto p-3 lg:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Profile Info Sidebar */}
                <div className="lg:col-span-1">
                  <Card className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 shadow-lg sticky top-4">
                    <CardHeader>
                      <div className="text-center">
                        <div className="relative w-20 h-20 mx-auto mb-4">
                          {getAvatarContent()}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 border-purple-600 text-white p-0"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>

                        {avatarPreview && (
                          <div className="flex gap-2 justify-center mb-4">
                            <Button
                              size="sm"
                              onClick={saveAvatar}
                              disabled={updateAvatarMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {updateAvatarMutation.isPending ? "Сохранение..." : "Сохранить"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={removeAvatar}
                              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              Отмена
                            </Button>
                          </div>
                        )}

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarSelect}
                          className="hidden"
                        />

                        <h3 className="font-bold text-xl">
                          {[typedUser.firstName, typedUser.lastName].filter(name => name && name.trim()).join(" ") || typedUser.username}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">{typedUser.email}</p>
                        <div className="flex items-center justify-center mt-2">
                          <Badge className={`${getRoleBadgeColor(typedUser.role)} text-white`}>
                            {getRoleName(typedUser.role)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Баланс</span>
                          <span className="text-2xl font-bold text-green-600 flex items-center">
                            <Wallet className="w-5 h-5 mr-1" />
                            {typedUser.balance} ₽
                          </span>
                        </div>
                        
                        {/* Balance action buttons */}
                        <div className="flex gap-2 flex-wrap">
                          <Link href="/topup" className="flex-1 min-w-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs h-8"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Пополнить
                            </Button>
                          </Link>
                          
                          {['admin', 'moderator', 'watcher'].includes(typedUser.role) && parseFloat(String(typedUser.balance)) > 0 && (
                            <Button
                              onClick={() => setShowWithdrawalModal(true)}
                              variant="outline"
                              size="sm"
                              className="flex-1 min-w-0 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 text-xs h-8"
                            >
                              Вывод
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Дата регистрации</span>
                        <span className="text-sm">
                          {new Date(typedUser.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>

                      {myPendingApplications.length > 0 && (
                        <div className="flex items-center justify-center space-x-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <i className="fas fa-clock text-yellow-600 dark:text-yellow-400"></i>
                          <span className="text-sm text-yellow-600 dark:text-yellow-400">
                            {myPendingApplications.length} заявок ждут одобрения
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content with Tabs */}
                <div className="lg:col-span-3">
                  <Tabs defaultValue="statistics" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                      <TabsTrigger value="statistics" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Статистика
                      </TabsTrigger>
                      <TabsTrigger value="profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Профиль
                      </TabsTrigger>
                      <TabsTrigger value="settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Настройки
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="statistics" className="space-y-6">
                      <UserStatistics />
                    </TabsContent>

                    <TabsContent value="profile" className="space-y-6">
                      <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold">Информация профиля</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Username (non-editable) */}
                            <div>
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Имя пользователя</span>
                              <p className="text-lg font-medium mt-1">{typedUser.username}</p>
                            </div>

                            {/* Email (editable with verification) */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</span>
                                {!showEmailVerification && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleFieldEdit("email")}
                                    className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              {editingField === "email" && !showEmailVerification ? (
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="email"
                                    value={editValues.email}
                                    onChange={(e) => setEditValues(prev => ({ ...prev, email: e.target.value }))}
                                    className="text-sm"
                                    placeholder="Введите новый email"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveField("email")}
                                    disabled={sendEmailVerificationMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700 text-white px-2"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="px-2"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : showEmailVerification ? (
                                <div className="space-y-3">
                                  <p className="text-sm text-blue-600 dark:text-blue-400">
                                    Код отправлен на: {pendingEmail}
                                  </p>
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      type="text"
                                      value={verificationCode}
                                      onChange={(e) => setVerificationCode(e.target.value)}
                                      placeholder="Введите код"
                                      className="text-sm"
                                      maxLength={6}
                                    />
                                    <Button
                                      size="sm"
                                      onClick={handleVerifyEmail}
                                      disabled={verifyEmailMutation.isPending}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      {verifyEmailMutation.isPending ? "Проверка..." : "Подтвердить"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setShowEmailVerification(false);
                                        setEditingField(null);
                                        setVerificationCode("");
                                        setPendingEmail("");
                                      }}
                                    >
                                      Отмена
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-lg font-medium mt-1">{typedUser.email || "Не указан"}</p>
                              )}
                            </div>

                            {/* First Name (editable) */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Имя</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleFieldEdit("firstName")}
                                  className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                              {editingField === "firstName" ? (
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="text"
                                    value={editValues.firstName}
                                    onChange={(e) => setEditValues(prev => ({ ...prev, firstName: e.target.value }))}
                                    className="text-sm"
                                    placeholder="Введите имя"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveField("firstName")}
                                    disabled={updateProfileMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700 text-white px-2"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="px-2"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-lg font-medium mt-1">{typedUser.firstName || "Не указано"}</p>
                              )}
                            </div>

                            {/* Last Name (editable) */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Фамилия</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleFieldEdit("lastName")}
                                  className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                              {editingField === "lastName" ? (
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="text"
                                    value={editValues.lastName}
                                    onChange={(e) => setEditValues(prev => ({ ...prev, lastName: e.target.value }))}
                                    className="text-sm"
                                    placeholder="Введите фамилию"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveField("lastName")}
                                    disabled={updateProfileMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700 text-white px-2"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="px-2"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-lg font-medium mt-1">{typedUser.lastName || "Не указана"}</p>
                              )}
                            </div>

                            {/* Email Notifications */}
                            <div className="md:col-span-2">
                              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                  <div>
                                    <Label htmlFor="email-notifications" className="text-sm font-medium">
                                      Email уведомления
                                    </Label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Получать уведомления на электронную почту
                                    </p>
                                  </div>
                                </div>
                                <Switch
                                  id="email-notifications"
                                  checked={emailNotifications}
                                  onCheckedChange={setEmailNotifications}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-6">
                      <AccountConnections />

                      <SecuritySettings />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </main>
        </div>
        <BackToTopButton />
      </div>

      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        currentBalance={typedUser.balance}
      />

      

      <SEOFooter />
    </>
  );
}
