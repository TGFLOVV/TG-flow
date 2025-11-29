import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { extractErrorMessage } from "@/lib/errorMessageCleaner";
import { useTheme } from "next-themes";
import TelegramLinkModal from "@/components/TelegramLinkModal";
import { useAuth } from "@/hooks/useAuth";
import SEOFooter from "@/components/SEOFooter";

// Password Change Form Component
function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", "/api/user/password", data),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Пароль изменен",
        description: "Ваш пароль успешно обновлен",
      });
    },
    onError: (error: any) => {
      console.error("Error changing password:", error);
      let errorMessage = "Не удалось изменить пароль";
      
      const serverMessage = error?.response?.data?.message || "";
      const errorCode = error?.response?.data?.errorCode;
      
      if (error?.response?.status === 400) {
        if (serverMessage.includes("неверный текущий пароль") ||
            serverMessage.includes("current password") ||
            errorCode === "INVALID_CURRENT_PASSWORD") {
          errorMessage = "Неверный текущий пароль";
        } else if (serverMessage.includes("пароль должен содержать") ||
                   serverMessage.includes("заглавную букву")) {
          errorMessage = "Новый пароль должен содержать заглавную букву, строчную букву и цифру";
        } else if (serverMessage.includes("8") && serverMessage.includes("символов")) {
          errorMessage = "Пароль должен содержать от 8 до 128 символов";
        } else if (serverMessage.includes("совпадать с логином")) {
          errorMessage = "Пароль не должен совпадать с логином";
        } else if (serverMessage.includes("совпадать с email")) {
          errorMessage = "Пароль не должен совпадать с email";
        } else if (serverMessage.includes("простой")) {
          errorMessage = "Пароль слишком простой. Используйте более сложный пароль";
        } else if (serverMessage.includes("обязателен")) {
          errorMessage = "Все поля обязательны для заполнения";
        } else if (serverMessage.includes("пустым")) {
          errorMessage = "Поля не могут быть пустыми";
        } else {
          errorMessage = serverMessage || "Некорректные данные для смены пароля";
        }
      } else if (error?.response?.status === 401) {
        errorMessage = "Сессия истекла. Войдите в систему заново";
      } else if (error?.response?.status === 403) {
        errorMessage = "Нет прав для изменения пароля";
      } else if (error?.response?.status === 422) {
        errorMessage = "Некорректный формат данных";
      } else if (error?.response?.status === 500) {
        errorMessage = "Ошибка сервера при изменении пароля";
      } else if (serverMessage) {
        errorMessage = serverMessage;
      }

      toast({
        title: "Ошибка смены пароля",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleChangePassword = () => {
    if (!newPassword.trim()) {
      toast({
        title: "Ошибка",
        description: "Поле нового пароля обязательно для заполнения",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Ошибка",
        description: "Пароли не совпадают",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Ошибка",
        description: "Пароль должен содержать минимум 8 символов",
        variant: "destructive",
      });
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()_+=\-\[\]{}|;:,.<>?]+$/;
    if (!passwordRegex.test(newPassword)) {
      toast({
        title: "Ошибка",
        description: "Пароль должен содержать хотя бы одну заглавную букву, одну строчную букву и одну цифру",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: currentPassword.trim() || undefined,
      newPassword: newPassword.trim(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Show current password field only if user has a password */}
      {user?.email && (
        <div>
          <Label>Текущий пароль</Label>
          <div className="relative">
            <Input
              type={showPasswords ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Введите текущий пароль"
              className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <i className={`fas ${showPasswords ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>
      )}
      
      <div>
        <Label>Новый пароль</Label>
        <div className="relative">
          <Input
            type={showPasswords ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Введите новый пароль"
            className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <i className={`fas ${showPasswords ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Минимум 8 символов, должен содержать заглавную букву, строчную букву и цифру
        </p>
      </div>
      
      <div>
        <Label>Подтвердите новый пароль</Label>
        <div className="relative">
          <Input
            type={showPasswords ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Подтвердите новый пароль"
            className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <i className={`fas ${showPasswords ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
      </div>
      
      <Button 
        onClick={handleChangePassword}
        disabled={changePasswordMutation.isPending || !newPassword || !confirmPassword}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {changePasswordMutation.isPending ? (
          <>
            <i className="fas fa-spinner fa-spin mr-2"></i>
            Изменение...
          </>
        ) : (
          <>
            <i className="fas fa-key mr-2"></i>
            Изменить пароль
          </>
        )}
      </Button>
    </div>
  );
}

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [telegramBotUrl, setTelegramBotUrl] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationStep, setShowVerificationStep] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme } = useTheme();

  const { data: userData } = useQuery({
    queryKey: ["/api/user"],
  });

  useEffect(() => {
    if (userData) {
      setFirstName((userData as any).firstName || "");
      setLastName((userData as any).lastName || "");
      setEmail((userData as any).email || "");
    }
  }, [userData]);

  // Обработка параметров URL для отображения сообщений об ошибках и успехе
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');

    // Only process if there are actual parameters to handle
    if (!error && !success) return;

    if (error) {
      let errorMessage = "Произошла ошибка";

      switch (error) {
        case 'google_already_linked_to_other':
          errorMessage = "Этот Google аккаунт уже привязан к другому пользователю";
          break;
        case 'user_already_has_google':
          errorMessage = "К вашему аккаунту уже привязан другой Google аккаунт";
          break;
        case 'email_has_different_google':
          errorMessage = "К этому email уже привязан другой Google аккаунт";
          break;
        default:
          errorMessage = "Ошибка привязки Google аккаунта";
      }

      toast({
        title: "Ошибка привязки",
        description: errorMessage,
        variant: "destructive",
      });
    }

    if (success === 'google_linked') {
      toast({
        title: "Успешно!",
        description: "Google аккаунт успешно привязан к вашему профилю",
      });

      // Обновляем данные пользователя
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    }

    // Очищаем URL только если были параметры
    if (error || success) {
      const newUrl = window.location.pathname;
      if (window.location.href !== newUrl) {
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []); // Remove toast dependency to prevent loops

  const saveSettingsMutation = useMutation({
    mutationFn: (settings: any) => apiRequest("PATCH", "/api/user/settings", settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Настройки сохранены",
        description: "Ваши настройки успешно обновлены",
      });
    },
    onError: (error: any) => {
      console.error("Error saving settings:", error);
      let errorMessage = "Не удалось сохранить настройки";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.status === 401) {
        errorMessage = "Сессия истекла. Войдите в систему заново";
      } else if (error?.response?.status === 403) {
        errorMessage = "Нет прав для изменения настроек";
      } else if (error?.response?.status === 422) {
        errorMessage = "Некорректные данные настроек";
      }
      
      toast({
        title: "Ошибка сохранения настроек",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const linkTelegramMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/telegram/link", {}),
    onSuccess: (data: any) => {
      if (data.botUrl) {
        setTelegramBotUrl(data.botUrl);
        setShowTelegramModal(true);
      }
    },
    onError: (error: any) => {
      console.error("Error linking Telegram:", error);
      let errorMessage = "Не удалось создать ссылку для привязки";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.status === 401) {
        errorMessage = "Сессия истекла. Войдите в систему заново";
      } else if (error?.response?.status === 409) {
        errorMessage = "Telegram аккаунт уже привязан к другому пользователю";
      } else if (error?.response?.status === 400) {
        errorMessage = "Некорректные данные для привязки Telegram";
      }
      
      toast({
        title: "Ошибка привязки Telegram",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const unlinkTelegramMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/telegram/unlink", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Telegram отвязан",
        description: "Ваш Telegram аккаунт успешно отвязан",
      });
    },
    onError: (error: any) => {
      console.error("Error unlinking Telegram:", error);
      let errorMessage = "Не удалось отвязать Telegram аккаунт";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.status === 401) {
        errorMessage = "Сессия истекла. Войдите в систему заново";
      } else if (error?.response?.status === 404) {
        errorMessage = "Telegram аккаунт не привязан к профилю";
      } else if (error?.response?.status === 400) {
        errorMessage = "Некорректный запрос на отвязку";
      }
      
      toast({
        title: "Ошибка отвязки Telegram",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleLinkTelegram = () => {
    linkTelegramMutation.mutate();
  };

  const handleUnlinkTelegram = () => {
    unlinkTelegramMutation.mutate();
  };

  const updateProfileMutation = useMutation({
    mutationFn: (profileData: any) => apiRequest("PATCH", "/api/user/profile", profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Профиль обновлен",
        description: "Ваши данные успешно сохранены",
      });
    },
    onError: (error: any) => {
      console.error("Error updating profile:", error);
      let errorMessage = extractErrorMessage(error);

      if (error?.response?.status === 400) {
        errorMessage = "Неверные данные профиля. Проверьте введенную информацию";
      } else if (error?.response?.status === 401) {
        errorMessage = "Сессия истекла. Пожалуйста, войдите в систему заново";
      } else if (error?.response?.status === 413) {
        errorMessage = "Данные профиля слишком большие";
      } else if (error?.response?.status >= 500) {
        errorMessage = "Ошибка сервера при обновлении профиля";
      } else if (errorMessage === "Произошла неожиданная ошибка") {
        errorMessage = "Не удалось обновить профиль";
      }

      toast({
        title: "Ошибка обновления профиля",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const sendVerificationCodeMutation = useMutation({
    mutationFn: (emailData: any) => apiRequest("POST", "/api/user/email/send-verification", emailData),
    onSuccess: (data: any) => {
      setPendingEmail(data.email);
      setShowVerificationStep(true);
      setIsCodeSent(true);
      toast({
        title: "Код отправлен",
        description: `Код верификации отправлен на ${data.email}`,
      });
    },
    onError: (error: any) => {
      console.error("Error sending verification code:", error);
      let errorMessage = "Не удалось отправить код верификации";
      
      const serverMessage = error?.response?.data?.message || "";
      const errorCode = error?.response?.data?.errorCode;
      
      if (error?.response?.status === 400) {
        if (errorCode === "EMAIL_ALREADY_EXISTS" || 
            serverMessage.includes("уже привязан к другому аккаунту") ||
            serverMessage.includes("уже используется") || 
            serverMessage.includes("уже занят") ||
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

  const verifyEmailCodeMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/user/email/verify", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setShowVerificationStep(false);
      setIsCodeSent(false);
      setVerificationCode("");
      setPendingEmail("");
      toast({
        title: "Email подтвержден",
        description: "Ваш email успешно подтвержден и обновлен",
      });
    },
    onError: (error: any) => {
      console.error("Error verifying email code:", error);
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

  const updateEmailMutation = useMutation({
    mutationFn: (emailData: any) => apiRequest("PATCH", "/api/user/email", emailData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Email обновлен",
        description: "Ваш email успешно изменен",
      });
    },
    onError: (error: any) => {
      console.error("Error updating email:", error);
      let errorMessage = "Не удалось обновить email";
      let errorDetails = "";

      if (error.response?.data) {
        const responseData = error.response.data;

        // Use detailed server response
        if (responseData.message) {
          errorMessage = responseData.message;
        }

        if (responseData.details) {
          errorDetails = responseData.details;
        }

        // Handle specific error codes
        switch (responseData.errorCode) {
          case "EMAIL_ALREADY_EXISTS":
            errorMessage = "Этот email уже привязан к другому аккаунту";
            errorDetails = "Пожалуйста, используйте другой email адрес";
            break;
          case "EMAIL_UNIQUE_CONSTRAINT":
            errorMessage = "Этот email уже привязан к другому аккаунту";
            errorDetails = "Попробуйте другой email или обратитесь в поддержку";
            break;
          case "EMAIL_REQUIRED":
            errorMessage = "Email не может быть пустым";
            errorDetails = "Введите корректный email адрес";
            break;
          case "USER_NOT_FOUND":
            errorMessage = "Пользователь не найден";
            errorDetails = "Попробуйте войти в систему заново";
            break;
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 400) {
        errorMessage = "Неверные данные email";
        errorDetails = "Проверьте правильность введенного email";
      } else if (error.response?.status === 401) {
        errorMessage = "Сессия истекла";
        errorDetails = "Пожалуйста, войдите в систему заново";
      } else if (error.response?.status >= 500) {
        errorMessage = "Ошибка сервера";
        errorDetails = "Попробуйте позже или обратитесь в поддержку";
      }

      toast({
        title: "Ошибка обновления email",
        description: errorDetails ? `${errorMessage}. ${errorDetails}` : errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
      emailNotifications,
      pushNotifications,
    });
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
  };

  const handleSendVerificationCode = () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      toast({
        title: "Ошибка",
        description: "Поле email обязательно для заполнения",
        variant: "destructive",
      });
      return;
    }

    // Enhanced email validation on client side
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: "Ошибка",
        description: "Введите корректный email адрес",
        variant: "destructive",
      });
      return;
    }

    // Check for valid domain extensions
    const validDomains = ['.com', '.ru', '.org', '.net', '.edu', '.gov', '.mil', '.int', '.co', '.io', '.me', '.info', '.biz', '.name', '.pro'];
    const hasValidDomain = validDomains.some(domain => trimmedEmail.endsWith(domain));
    if (!hasValidDomain) {
      toast({
        title: "Ошибка",
        description: "Email должен иметь корректное доменное имя (например, .com, .ru, .org)",
        variant: "destructive",
      });
      return;
    }

    sendVerificationCodeMutation.mutate({
      email: trimmedEmail,
    });
  };

  const handleVerifyCode = () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите код верификации",
        variant: "destructive",
      });
      return;
    }

    if (verificationCode.trim().length !== 6) {
      toast({
        title: "Ошибка",
        description: "Код должен состоять из 6 цифр",
        variant: "destructive",
      });
      return;
    }

    verifyEmailCodeMutation.mutate({
      email: pendingEmail,
      code: verificationCode.trim(),
    });
  };

  const handleSaveEmail = () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      toast({
        title: "Ошибка",
        description: "Поле email обязательно для заполнения",
        variant: "destructive",
      });
      return;
    }

    // Enhanced email validation on client side
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: "Ошибка",
        description: "Введите корректный email адрес",
        variant: "destructive",
      });
      return;
    }

    // Check for valid domain extensions
    const validDomains = ['.com', '.ru', '.org', '.net', '.edu', '.gov', '.mil', '.int', '.co', '.io', '.me', '.info', '.biz', '.name', '.pro'];
    const hasValidDomain = validDomains.some(domain => trimmedEmail.endsWith(domain));
    if (!hasValidDomain) {
      toast({
        title: "Ошибка",
        description: "Email должен иметь корректное доменное имя (например, .com, .ru, .org)",
        variant: "destructive",
      });
      return;
    }

    updateEmailMutation.mutate({
      email: trimmedEmail,
    });
  };

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
        <main className="pt-6 px-3 pb-3 lg:p-6 header-padding">
          <div className="max-w-2xl space-y-3">
            {/* Theme Settings */}
            <Card className="bg-white/80 dark:bg-gray-900/80 border-2 border-gray-300 dark:border-gray-700 shadow-lg">
              <CardHeader>
                <CardTitle>Внешний вид</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Текущая тема</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {theme === 'dark' ? 'Темная' : 'Светлая'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-white/80 dark:bg-gray-900/80 border-2 border-gray-300 dark:border-gray-700 shadow-lg">
              <CardHeader>
                <CardTitle>Уведомления</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email уведомления</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Получать уведомления на email
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                    className="bg-gray-200/80 dark:bg-gray-700/80"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push уведомления</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Получать push уведомления в браузере
                    </p>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                    className="bg-gray-200/80 dark:bg-gray-700/80"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Profile Settings */}
            <Card className="bg-white/80 dark:bg-gray-900/80 border-2 border-gray-300 dark:border-gray-700 shadow-lg">
              <CardHeader>
                <CardTitle>Профиль</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Имя</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Введите ваше имя"
                    className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700"
                  />
                </div>
                <div>
                  <Label>Фамилия</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Введите вашу фамилию"
                    className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700"
                  />
                </div>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user mr-2"></i>
                      Сохранить профиль
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Password Settings */}
            <Card className="bg-white/80 dark:bg-gray-900/80 border-2 border-gray-300 dark:border-gray-700 shadow-lg">
              <CardHeader>
                <CardTitle>Безопасность</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Управление паролем аккаунта
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <PasswordChangeForm />
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="bg-white/80 dark:bg-gray-900/80 border-2 border-gray-300 dark:border-gray-700 shadow-lg">
              <CardHeader>
                <CardTitle>Аккаунт</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email</Label>
                  {!showVerificationStep && !user?.email ? (
                    <div className="space-y-2">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Введите ваш email"
                        className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700"
                      />
                      <Button 
                        onClick={handleSendVerificationCode}
                        disabled={sendVerificationCodeMutation.isPending}
                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        {sendVerificationCodeMutation.isPending ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Отправка...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane mr-2"></i>
                            Отправить код
                          </>
                        )}
                      </Button>
                    </div>
                  ) : !showVerificationStep && user?.email ? (
                    <div className="space-y-2">
                      <Input
                        type="email"
                        value={user.email}
                        disabled
                        className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                      />
                      <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                        <i className="fas fa-check-circle mr-2"></i>
                        Email подтвержден
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center text-blue-800 dark:text-blue-300">
                        <i className="fas fa-envelope mr-2"></i>
                        <p className="text-sm font-medium">
                          Код отправлен на: {pendingEmail}
                        </p>
                      </div>
                      <div>
                        <Label>Код верификации</Label>
                        <Input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="123456"
                          className="text-center text-lg tracking-widest bg-white dark:bg-gray-800"
                          maxLength={6}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Введите 6-значный код из email
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => {
                            setShowVerificationStep(false);
                            setIsCodeSent(false);
                            setVerificationCode("");
                            setPendingEmail("");
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          Отмена
                        </Button>
                        <Button 
                          onClick={handleVerifyCode}
                          disabled={verifyEmailCodeMutation.isPending || verificationCode.length !== 6}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          {verifyEmailCodeMutation.isPending ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Проверка...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-check mr-2"></i>
                              Проверить
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Логин</Label>
                  <Input
                    value={(userData as any)?.username || ""}
                    disabled
                    className="bg-gray-100/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Connected Accounts */}
            <Card className="bg-white/80 dark:bg-gray-900/80 border-2 border-gray-300 dark:border-gray-700 shadow-lg">
              <CardHeader>
                <CardTitle>Привязанные аккаунты</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Управляйте подключенными внешними аккаунтами
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Telegram Account */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16c-.18 1.896-.96 6.728-1.356 8.92-.168.93-.5 1.24-.82 1.27-.697.06-1.226-.46-1.9-.9-1.056-.69-1.653-1.12-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                          <i className="fab fa-telegram-plane mr-2 text-blue-500"></i>
                          Telegram
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(userData as any)?.telegramId ? (
                            <>
                              Привязан: @{(userData as any)?.telegramUsername || 'telegram_user'}
                            </>
                          ) : (
                            'Привяжите Telegram для удобного входа'
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {(userData as any)?.telegramId ? (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full text-sm font-medium">
                            <i className="fas fa-check mr-2"></i>
                            Привязан
                          </div>
                          <Button
                            onClick={handleUnlinkTelegram}
                            disabled={unlinkTelegramMutation.isPending}
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            size="sm"
                          >
                            {unlinkTelegramMutation.isPending ? (
                              <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Отвязка...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-unlink mr-2"></i>
                                Отвязать
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={handleLinkTelegram}
                          disabled={linkTelegramMutation.isPending}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          size="sm"
                        >
                          {linkTelegramMutation.isPending ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Привязка...
                            </>
                          ) : (
                            <>
                              <i className="fab fa-telegram-plane mr-2"></i>
                              Привязать
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {(userData as any)?.telegramId && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                      <div className="flex items-center text-green-800 dark:text-green-400">
                        <i className="fas fa-info-circle mr-2"></i>
                        <p className="text-sm font-medium">
                          Telegram аккаунт привязан
                        </p>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Вы можете входить в систему через Telegram бота @TG_FLOVV_BOT
                      </p>
                    </div>
                  )}
                </div>

                {/* Google Account - скрываем если email подтвержден */}
                {!user?.email && (
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                            <i className="fab fa-google mr-2 text-red-500"></i>
                            Google
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {(userData as any)?.googleId ? (
                              'Привязан к Google аккаунту'
                            ) : (
                              'Привяжите Google для удобного входа'
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {(userData as any)?.googleId ? (
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full text-sm font-medium">
                              <i className="fas fa-check mr-2"></i>
                              Привязан
                            </div>
                            <Button
                              onClick={() => {
                                // Можно добавить функцию отвязки Google аккаунта
                                toast({
                                  title: "Информация",
                                  description: "Функция отвязки Google аккаунта будет добавлена в следующем обновлении",
                                });
                              }}
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              size="sm"
                            >
                              <i className="fas fa-unlink mr-2"></i>
                              Отвязать
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => {
                              // Сохраняем в сессии информацию о попытке привязки
                              fetch('/api/auth/google', {
                                method: 'GET',
                                credentials: 'include'
                              }).then(() => {
                                window.location.href = '/api/auth/google';
                              }).catch(() => {
                                window.location.href = '/api/auth/google';
                              });
                            }}
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            <i className="fab fa-google mr-2"></i>
                            Привязать
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-start space-x-2">
                    <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-0.5"></i>
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                      <p className="font-medium">Зачем привязывать аккаунты?</p>
                      <p className="mt-1">
                        Привязанные аккаунты позволяют быстро входить в систему и обеспечивают дополнительную безопасность.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <TelegramLinkModal
              isOpen={showTelegramModal}
              onClose={() => {
                setShowTelegramModal(false);
                queryClient.invalidateQueries({ queryKey: ["/api/user"] });
              }}
              botUrl={telegramBotUrl}
            />

            <Button 
              onClick={handleSaveSettings}
              disabled={saveSettingsMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {saveSettingsMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Сохранение...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Сохранить настройки
                </>
              )}
            </Button>


          </div>
        </main>
      </div>
    </div>
  );

  const handleGoogleLink = async () => {
    try {
      // Устанавливаем флаг попытки привязки в localStorage
      localStorage.setItem('google_link_attempt', 'true');

      // Перенаправляем на Google OAuth
      window.location.href = '/api/auth/google';
    } catch (error) {
      console.error('Error linking Google account:', error);
      toast({
        title: "Ошибка привязки",
        description: "Не удалось привязать Google аккаунт. Попробуйте еще раз.",
        variant: "destructive",
      });
    }
  };

  const handleTelegramLink = async () => {
    try {
      const response = await fetch('/api/telegram/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTelegramBotUrl(data.botUrl);
        setShowTelegramModal(true);
      } else {
        toast({
          title: "Ошибка привязки Telegram",
          description: data.error || "Не удалось создать ссылку для привязки",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error linking Telegram:', error);
      toast({
        title: "Ошибка сети",
        description: "Произошла ошибка при привязке Telegram. Проверьте подключение к интернету.",
        variant: "destructive",
      });
    }
  };

  const handleTelegramUnlink = async () => {
    try {
      const response = await fetch('/api/telegram/unlink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        toast({
          title: "Успех",
          description: "Telegram аккаунт успешно отвязан",
        });
      } else {
        toast({
          title: "Ошибка отвязки Telegram",
          description: data.error || "Не удалось отвязать Telegram аккаунт",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error unlinking Telegram:', error);
      toast({
        title: "Ошибка сети",
        description: "Произошла ошибка при отвязке Telegram. Проверьте подключение к интернету.",
        variant: "destructive",
      });
    }
  };

  const sendEmailVerification = () => {
    const trimmedEmail = email.trim().toLowerCase();
    sendVerificationCodeMutation.mutate({
      email: trimmedEmail,
    });
  };

  const verifyEmailCode = () => {
    verifyEmailCodeMutation.mutate({
      email: pendingEmail,
      code: verificationCode.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Sidebar />
      <div className="lg:ml-64 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Настройки</h1>

          {/* Ваши существующие компоненты настроек */}
          {/* ... остальной JSX ... */}
        </div>
      </div>
      <SEOFooter />
    </div>
  );
}
