import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import TelegramAuth from "@/components/TelegramAuth";
import Sidebar from "@/components/Sidebar";
import { useLocation } from "wouter";

const loginSchema = z.object({
  usernameOrEmail: z.string()
    .min(1, "Введите логин или email")
    .transform(val => val.toLowerCase()),
  password: z.string().min(1, "Введите пароль"),
});

const registerSchema = z.object({
  username: z.string()
    .min(4, "Логин должен содержать минимум 4 символа")
    .max(20, "Логин не может быть длиннее 20 символов")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Логин должен начинаться с буквы и содержать только буквы, цифры и подчеркивания")
    .transform(val => val.toLowerCase()),
  email: z.string().email("Некорректный email").min(1, "Email обязателен для заполнения"),
  password: z.string()
    .min(8, "Пароль должен содержать минимум 8 символов")
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Пароль должен содержать заглавную букву, строчную букву и цифру"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

const verifyCodeSchema = z.object({
  verificationCode: z.string().min(6, "Код должен содержать 6 цифр").max(6, "Код должен содержать 6 цифр"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Некорректный email").min(1, "Email обязателен для заполнения"),
});

const resetPasswordSchema = z.object({
  resetCode: z.string().min(6, "Код должен содержать 6 цифр").max(6, "Код должен содержать 6 цифр"),
  newPassword: z.string()
    .min(8, "Пароль должен содержать минимум 8 символов")
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Пароль должен содержать заглавную букву, строчную букву и цифру"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [pendingRegistrationData, setPendingRegistrationData] = useState<any>(null);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [apiErrors, setApiErrors] = useState<{[key: string]: string}>({});
  const { toast } = useToast();
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  // Функция для обработки Telegram аутентификации
  const onTelegramAuth = async (user: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/telegram", user);

      toast({
        title: "Добро пожаловать!",
        description: "Вы успешно вошли через Telegram",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setLocation("/home");
    } catch (error: any) {
      let errorMessage = "Произошла ошибка при входе через Telegram";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Ошибка входа",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Оптимизированная инициализация Telegram Login Widget
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    timeoutId = setTimeout(() => {
      (window as any).onTelegramAuth = onTelegramAuth;

      if (document.querySelector('script[src*="telegram-widget.js"]')) {
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', 'tgflow_auth_bot');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');

      const loginContainer = document.getElementById('telegram-login-container');
      const registerContainer = document.getElementById('telegram-register-container');

      if (loginContainer && !loginContainer.hasChildNodes()) {
        const loginWidget = script.cloneNode(true);
        loginContainer.appendChild(loginWidget);
      }

      if (registerContainer && !registerContainer.hasChildNodes()) {
        const registerWidget = script.cloneNode(true);
        registerContainer.appendChild(registerWidget);
      }
    }, 100);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      delete (window as any).onTelegramAuth;
    };
  }, []);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const verifyCodeForm = useForm({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      verificationCode: "",
    },
  });

  const forgotPasswordForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetPasswordForm = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      resetCode: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setApiErrors({});
    try {
      const response = await apiRequest("POST", "/api/login", {
        usernameOrEmail: data.usernameOrEmail.trim(),
        password: data.password,
      });

      toast({
        title: "Добро пожаловать!",
        description: "Вы успешно вошли в систему",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setLocation("/home");
    } catch (error: any) {
      let errorMessage = "Произошла ошибка при входе. Пожалуйста, попробуйте снова.";
      let fieldErrors: {[key: string]: string} = {};

      // Извлекаем детальное сообщение от сервера
      const serverMessage = error.response?.data?.message || "";
      
      if (error.response?.status === 400) {
        // Валидационные ошибки
        if (serverMessage.includes("обязательны")) {
          errorMessage = "Необходимо заполнить все поля";
          if (!data.usernameOrEmail) fieldErrors.usernameOrEmail = "Поле обязательно для заполнения";
          if (!data.password) fieldErrors.password = "Поле обязательно для заполнения";
        } else if (serverMessage.includes("Google")) {
          errorMessage = "Данный аккаунт создан через Google. Используйте кнопку входа через Google";
          fieldErrors.usernameOrEmail = "Используйте вход через Google";
        } else if (serverMessage.includes("пустыми")) {
          errorMessage = "Поля не могут быть пустыми";
          fieldErrors.usernameOrEmail = "Поле не может быть пустым";
          fieldErrors.password = "Поле не может быть пустым";
        } else if (serverMessage.includes("формат")) {
          errorMessage = "Некорректный формат данных";
        } else if (serverMessage.includes("длинный")) {
          errorMessage = "Пароль слишком длинный";
          fieldErrors.password = "Пароль слишком длинный (максимум 128 символов)";
        } else {
          errorMessage = serverMessage || "Некорректные данные для входа";
        }
      } else if (error.response?.status === 401) {
        errorMessage = "Неверный логин/email или пароль";
        fieldErrors.usernameOrEmail = "Проверьте правильность логина или email";
        fieldErrors.password = "Проверьте правильность пароля";
      } else if (error.response?.status === 403) {
        if (serverMessage.includes("заблокирован") || serverMessage.includes("blocked")) {
          errorMessage = "Ваш аккаунт заблокирован администратором";
          fieldErrors.usernameOrEmail = "Аккаунт заблокирован";
        } else {
          errorMessage = serverMessage || "Доступ к аккаунту ограничен";
          fieldErrors.usernameOrEmail = "Доступ ограничен";
        }
      } else if (error.response?.status === 423) {
        errorMessage = "Аккаунт временно заблокирован из-за множественных неудачных попыток входа";
        fieldErrors.usernameOrEmail = "Слишком много попыток входа";
        fieldErrors.password = "Повторите попытку через 30 минут";
      } else if (error.response?.status === 429) {
        errorMessage = "Слишком много попыток входа. Попробуйте позже";
        fieldErrors.usernameOrEmail = "Подождите несколько минут";
      } else if (error.response?.status === 500) {
        if (serverMessage.includes("аутентификации")) {
          errorMessage = "Ошибка системы аутентификации. Обратитесь к администратору";
        } else {
          errorMessage = "Ошибка сервера. Попробуйте позже";
        }
      } else if (serverMessage) {
        errorMessage = serverMessage;
      }

      setApiErrors(fieldErrors);
      toast({
        title: "Ошибка входа",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    if (!agreedToPrivacy) {
      toast({
        title: "Ошибка регистрации",
        description: "Необходимо согласие на обработку персональных данных",
        variant: "destructive",
      });
      return;
    }

    await onSendVerificationCode(data);
  };

  const onSendVerificationCode = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    setApiErrors({});
    try {
      await apiRequest("POST", "/api/register/send-verification", data);
      setRegistrationEmail(data.email);
      setPendingRegistrationData(data);
      setShowEmailVerification(true);
      toast({
        title: "Код отправлен",
        description: `Код верификации отправлен на ${data.email}`,
      });
    } catch (error: any) {
      let errorMessage = "Не удалось отправить код верификации";
      let fieldErrors: {[key: string]: string} = {};

      const serverMessage = error.response?.data?.message || "";
      const errorCode = error.response?.data?.errorCode;

      if (error.response?.status === 400) {
        if (serverMessage.includes("обязательны")) {
          errorMessage = "Необходимо заполнить все обязательные поля";
          if (!data.username) fieldErrors.username = "Логин обязателен";
          if (!data.email) fieldErrors.email = "Email обязателен";
          if (!data.password) fieldErrors.password = "Пароль обязателен";
        } else if (serverMessage.includes("логин уже существует") || serverMessage.includes("username")) {
          errorMessage = "Пользователь с таким логином уже зарегистрирован";
          fieldErrors.username = "Этот логин уже занят";
        } else if (serverMessage.includes("email уже существует") || serverMessage.includes("email")) {
          errorMessage = "Пользователь с таким email уже зарегистрирован";
          fieldErrors.email = "Этот email уже зарегистрирован";
        } else if (serverMessage.includes("символов") && serverMessage.includes("логин")) {
          errorMessage = "Логин должен содержать от 3 до 30 символов";
          fieldErrors.username = "От 3 до 30 символов";
        } else if (serverMessage.includes("недоступен")) {
          errorMessage = "Данный логин недоступен для регистрации";
          fieldErrors.username = "Логин недоступен";
        } else if (serverMessage.includes("пароль") && serverMessage.includes("символов")) {
          errorMessage = "Пароль должен содержать от 8 до 128 символов";
          fieldErrors.password = "От 8 до 128 символов";
        } else if (serverMessage.includes("заглавную букву")) {
          errorMessage = "Пароль должен содержать заглавную букву, строчную букву и цифру";
          fieldErrors.password = "Заглавная + строчная буква + цифра";
        } else if (serverMessage.includes("простой")) {
          errorMessage = "Пароль слишком простой. Используйте более сложный пароль";
          fieldErrors.password = "Пароль слишком простой";
        } else if (serverMessage.includes("не должен совпадать с логином")) {
          errorMessage = "Пароль не должен совпадать с логином";
          fieldErrors.password = "Не должен совпадать с логином";
        } else if (serverMessage.includes("не должен совпадать с email")) {
          errorMessage = "Пароль не должен совпадать с email";
          fieldErrors.password = "Не должен совпадать с email";
        } else if (serverMessage.includes("некорректный email") || serverMessage.includes("email адрес")) {
          errorMessage = "Некорректный формат email адреса";
          fieldErrors.email = "Некорректный формат email";
        } else {
          errorMessage = serverMessage;
        }
      } else if (error.response?.status === 500) {
        if (errorCode === "EMAIL_SEND_FAILED") {
          errorMessage = "Не удалось отправить email. Проверьте правильность адреса";
          fieldErrors.email = "Ошибка отправки на этот email";
        } else {
          errorMessage = "Ошибка сервера. Попробуйте позже";
        }
      } else if (serverMessage) {
        errorMessage = serverMessage;
        
        // Определяем к какому полю относится ошибка
        if (errorMessage.includes("логин") || errorMessage.includes("username")) {
          fieldErrors.username = errorMessage;
        } else if (errorMessage.includes("email")) {
          fieldErrors.email = errorMessage;
        } else if (errorMessage.includes("пароль") || errorMessage.includes("password")) {
          fieldErrors.password = errorMessage;
        }
      }

      setApiErrors(fieldErrors);
      toast({
        title: "Ошибка регистрации",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyCode = async (data: z.infer<typeof verifyCodeSchema>) => {
    setIsLoading(true);
    setApiErrors({});
    try {
      await apiRequest("POST", "/api/register", data);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Регистрация успешна",
        description: "Добро пожаловать в TG Flow!",
      });
      setLocation("/home");
    } catch (error: any) {
      let errorMessage = "Не удалось завершить регистрацию";
      let fieldErrors: {[key: string]: string} = {};

      const serverMessage = error.response?.data?.message || "";

      if (error.response?.status === 400) {
        if (serverMessage.includes("код") && serverMessage.includes("обязателен")) {
          errorMessage = "Необходимо ввести код верификации";
          fieldErrors.verificationCode = "Поле обязательно для заполнения";
        } else if (serverMessage.includes("неверный код") || serverMessage.includes("Invalid code")) {
          errorMessage = "Введён неверный код верификации";
          fieldErrors.verificationCode = "Неверный код";
        } else if (serverMessage.includes("истек") || serverMessage.includes("expired")) {
          errorMessage = "Код верификации истёк. Запросите новый код";
          fieldErrors.verificationCode = "Код истёк";
        } else if (serverMessage.includes("данные регистрации не найдены")) {
          errorMessage = "Сессия регистрации истекла. Начните регистрацию заново";
          fieldErrors.verificationCode = "Начните регистрацию заново";
        } else if (serverMessage.includes("уже существует")) {
          if (serverMessage.includes("логин")) {
            errorMessage = "Пользователь с таким логином уже зарегистрирован";
            fieldErrors.verificationCode = "Логин уже занят";
          } else if (serverMessage.includes("email")) {
            errorMessage = "Пользователь с таким email уже зарегистрирован";
            fieldErrors.verificationCode = "Email уже зарегистрирован";
          }
        } else {
          errorMessage = serverMessage;
          fieldErrors.verificationCode = serverMessage;
        }
      } else if (error.response?.status === 500) {
        errorMessage = "Ошибка сервера при регистрации. Попробуйте позже";
        fieldErrors.verificationCode = "Ошибка сервера";
      } else if (serverMessage) {
        errorMessage = serverMessage;
        fieldErrors.verificationCode = serverMessage;
      }

      setApiErrors(fieldErrors);
      toast({
        title: "Ошибка верификации",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPassword = async (data: z.infer<typeof forgotPasswordSchema>) => {
    setIsLoading(true);
    setApiErrors({});
    try {
      const response = await apiRequest("POST", "/api/password-reset/send-code", data);
      setResetEmail(data.email);
      setShowForgotPassword(false);
      setShowPasswordReset(true);
      toast({
        title: "Код отправлен",
        description: `Код восстановления отправлен на ${data.email}`,
      });
    } catch (error: any) {
      let errorMessage = "Не удалось отправить код восстановления";
      let fieldErrors: {[key: string]: string} = {};

      if (error.response?.data) {
        const { message, errorCode } = error.response.data;
        errorMessage = message || errorMessage;

        switch (errorCode) {
          case "EMAIL_REQUIRED":
            fieldErrors.email = "Email обязателен для заполнения";
            break;
          case "INVALID_EMAIL_FORMAT":
            fieldErrors.email = "Некорректный формат email адреса";
            break;
          case "USER_NOT_FOUND":
            fieldErrors.email = "Пользователь с таким email не найден";
            errorMessage = "Пользователь с указанным email не зарегистрирован в системе";
            break;
          case "OAUTH_USER":
            fieldErrors.email = "Аккаунт создан через Google/Telegram";
            errorMessage = "Этот аккаунт был создан через внешний сервис. Используйте соответствующую кнопку для входа";
            break;
          case "NO_PASSWORD_SET":
            fieldErrors.email = "Пароль не установлен";
            errorMessage = "Для этого аккаунта не установлен пароль";
            break;
          case "USER_BLOCKED":
            fieldErrors.email = "Аккаунт заблокирован";
            errorMessage = "Ваш аккаунт заблокирован администратором";
            break;
          case "EMAIL_SEND_FAILED":
            fieldErrors.email = "Ошибка отправки email";
            errorMessage = "Не удалось отправить письмо. Попробуйте позже";
            break;
          case "SERVER_ERROR":
            errorMessage = "Ошибка сервера. Попробуйте позже";
            break;
          default:
            if (errorMessage.includes("не найден") || errorMessage.includes("not found")) {
              fieldErrors.email = "Пользователь с таким email не найден";
            } else if (errorMessage.includes("OAuth") || errorMessage.includes("Google") || errorMessage.includes("Telegram")) {
              fieldErrors.email = "Для этого аккаунта используется внешняя авторизация";
            } else if (errorMessage.includes("заблокирован") || errorMessage.includes("blocked")) {
              fieldErrors.email = "Аккаунт заблокирован";
            } else {
              fieldErrors.email = errorMessage;
            }
        }
      }

      setApiErrors(fieldErrors);
      toast({
        title: "Ошибка восстановления",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (data: z.infer<typeof resetPasswordSchema>) => {
    setIsLoading(true);
    setApiErrors({});
    try {
      await apiRequest("POST", "/api/password-reset/verify", data);
      setShowPasswordReset(false);
      setResetEmail("");
      resetPasswordForm.reset();
      setApiErrors({});
      toast({
        title: "Пароль изменен",
        description: "Ваш пароль успешно изменен. Теперь вы можете войти с новым паролем",
      });
    } catch (error: any) {
      let errorMessage = "Не удалось изменить пароль";
      let fieldErrors: {[key: string]: string} = {};

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;

        if (errorMessage.includes("Неверный код") || errorMessage.includes("Invalid code")) {
          fieldErrors.resetCode = "Неверный код восстановления";
        } else if (errorMessage.includes("истек") || errorMessage.includes("expired")) {
          fieldErrors.resetCode = "Код восстановления истек";
        } else {
          fieldErrors.resetCode = errorMessage;
        }
      }

      setApiErrors(fieldErrors);
      toast({
        title: "Ошибка изменения пароля",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    // Only process if there's an actual error parameter
    if (!error) return;

    let errorMessage = "Произошла ошибка при входе";

    switch (error) {
      case 'google_auth_failed':
        errorMessage = "Ошибка авторизации через Google. Попробуйте еще раз";
        break;
      case 'google_account_already_linked':
        errorMessage = "Этот Google аккаунт уже привязан к другому пользователю";
        break;
      case 'invalid_token':
        errorMessage = "Недействительный токен авторизации";
        break;
      case 'expired_token':
        errorMessage = "Токен авторизации истек";
        break;
      case 'user_not_found':
        errorMessage = "Пользователь не найден";
        break;
      case 'login_failed':
        errorMessage = "Ошибка входа в систему";
        break;
      case 'server_error':
        errorMessage = "Ошибка сервера. Попробуйте позже";
        break;
      default:
        errorMessage = "Неизвестная ошибка авторизации";
    }

    toast({
      title: "Ошибка входа",
      description: errorMessage,
      variant: "destructive",
    });

    // Clean URL only if there was an error parameter
    const newUrl = window.location.pathname;
    if (window.location.href !== newUrl) {
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []); // Remove toast dependency to prevent loops


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-paper-plane text-white text-2xl"></i>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                TG Flow
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Войдите в свой аккаунт или создайте новый
              </p>
            </div>

            <Card className="bg-white/80 dark:bg-gray-900/80 border-2 border-gray-300 dark:border-gray-700 shadow-lg">
              <CardContent className="p-6">
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger 
                      value="login" 
                      className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                    >
                      Вход
                    </TabsTrigger>
                    <TabsTrigger 
                      value="register"
                      className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                    >
                      Регистрация
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Логин или Email</Label>
                        <Input
                          {...loginForm.register("usernameOrEmail")}
                          placeholder="Введите логин или email"
                          className="mt-1 bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700"
                        />
                        {(loginForm.formState.errors.usernameOrEmail || apiErrors.usernameOrEmail) && (
                          <p className="text-red-500 text-sm mt-1">
                            {apiErrors.usernameOrEmail || loginForm.formState.errors.usernameOrEmail?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Пароль</Label>
                        <div className="relative mt-1">
                          <Input
                            {...loginForm.register("password")}
                            type={showLoginPassword ? "text" : "password"}
                            placeholder="Введите ваш пароль"
                            className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <i className={`fas ${showLoginPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                        {(loginForm.formState.errors.password || apiErrors.password) && (
                          <p className="text-red-500 text-sm mt-1">
                            {apiErrors.password || loginForm.formState.errors.password?.message}
                          </p>
                        )}
                      </div>

                      <Button 
                        onClick={loginForm.handleSubmit(onLogin)} 
                        disabled={isLoading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {isLoading ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Выполняется вход...
                          </>
                        ) : (
                          "Войти"
                        )}
                      </Button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-purple-600 hover:text-purple-800 underline"
                        >
                          Забыли пароль?
                        </button>
                      </div>

                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Или войдите через</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Button
                          onClick={() => window.location.href = "/api/auth/google"}
                          variant="outline"
                          className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Войти через Google
                        </Button>

                        <TelegramAuth type="login" />

                        <Button
                          onClick={() => setLocation('/pricing')}
                          variant="outline"
                          className="w-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-800/30 dark:hover:to-purple-800/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                        >
                          <i className="fas fa-money-bill-wave mr-2"></i>
                          Тарифы и цены
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="register" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Логин *</Label>
                        <Input
                          {...registerForm.register("username")}
                          placeholder="Придумайте логин"
                          className="mt-1 bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700"
                        />
                        {(registerForm.formState.errors.username || apiErrors.username) && (
                          <p className="text-red-500 text-sm mt-1">
                            {apiErrors.username || registerForm.formState.errors.username?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Email *</Label>
                        <Input
                          {...registerForm.register("email")}
                          type="email"
                          placeholder="your@email.com"
                          className="mt-1 bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700"
                        />
                        {(registerForm.formState.errors.email || apiErrors.email) && (
                          <p className="text-red-500 text-sm mt-1">
                            {apiErrors.email || registerForm.formState.errors.email?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Пароль *</Label>
                        <div className="relative mt-1">
                          <Input
                            {...registerForm.register("password")}
                            type={showRegisterPassword ? "text" : "password"}
                            placeholder="Придумайте пароль"
                            className="bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <i className={`fas ${showRegisterPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                        {registerForm.formState.errors.password && (
                          <p className="text-red-500 text-sm mt-1">
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Повторите пароль *</Label>
                        <Input
                          {...registerForm.register("confirmPassword")}
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="Повторите пароль"
                          className="mt-1 bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700"
                        />
                        {registerForm.formState.errors.confirmPassword && (
                          <p className="text-red-500 text-sm mt-1">
                            {registerForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>

                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="privacy-agreement"
                          checked={agreedToPrivacy}
                          onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                          className="mt-1 w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <label htmlFor="privacy-agreement" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                          Я согласен с{" "}
                          <a href="/privacy-policy" className="text-purple-600 hover:text-purple-800 underline" target="_blank" rel="noopener noreferrer">
                            обработкой персональных данных
                          </a>{" "}
                          и{" "}
                          <a href="/public-offer" className="text-purple-600 hover:text-purple-800 underline" target="_blank" rel="noopener noreferrer">
                            пользовательским соглашением
                          </a>
                        </label>
                      </div>

                      <Button 
                        onClick={registerForm.handleSubmit(onRegister)} 
                        disabled={isLoading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {isLoading ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Создание аккаунта...
                          </>
                        ) : (
                          "Создать аккаунт"
                        )}
                      </Button>

                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Или зарегистрируйтесь через</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Button
                          onClick={() => window.location.href = "/api/auth/google"}
                          variant="outline"
                          className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24```python
24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Зарегистрироваться через Google
                        </Button>

                        <TelegramAuth type="register" />

                        <Button
                          onClick={() => setLocation('/pricing')}
                          variant="outline"
                          className="w-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-800/30 dark:hover:to-purple-800/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                        >
                          <i className="fas fa-money-bill-wave mr-2"></i>
                          Тарифы и цены
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

      {/* Модальные окна */}
      {showEmailVerification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 shadow-lg max-w-md w-full p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                <i className="fas fa-envelope text-white text-2xl"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Подтвердите email</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Мы отправили код на <span className="font-medium text-blue-600">{registrationEmail}</span>
              </p>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Код из email</Label>
                  <Input
                    {...verifyCodeForm.register("verificationCode")}
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    className="mt-1 bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-center text-lg tracking-widest"
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      verifyCodeForm.setValue("verificationCode", value);
                    }}
                  />
                  {(verifyCodeForm.formState.errors.verificationCode || apiErrors.verificationCode) && (
                    <p className="text-red-500 text-sm mt-1">
                      {apiErrors.verificationCode || verifyCodeForm.formState.errors.verificationCode?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={verifyCodeForm.handleSubmit(onVerifyCode)}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Проверка...
                      </>
                    ) : (
                      "Подтвердить"
                    )}
                  </Button>

                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (pendingRegistrationData) {
                          onSendVerificationCode(pendingRegistrationData);
                        }
                      }}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? "Отправка..." : "Отправить ещё раз"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowEmailVerification(false);
                        setPendingRegistrationData(null);
                        setRegistrationEmail("");
                        verifyCodeForm.reset();
                        setApiErrors({});
                      }}
                      className="flex-1"
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Остальные модальные окна */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 shadow-lg max-w-md w-full p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto">
                <i className="fas fa-key text-white text-2xl"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Восстановление пароля</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Введите email адрес вашего аккаунта
              </p>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Email</Label>
                  <Input
                    {...forgotPasswordForm.register("email")}
                    type="email"
                    placeholder="your@email.com"
                    className="mt-1 bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700"
                  />
                  {(forgotPasswordForm.formState.errors.email || apiErrors.email) && (
                    <p className="text-red-500 text-sm mt-1">
                      {apiErrors.email || forgotPasswordForm.formState.errors.email?.message}
                    </p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForgotPassword(false);
                      forgotPasswordForm.reset();
                      setApiErrors({});
                    }}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={forgotPasswordForm.handleSubmit(onForgotPassword)}
                    disabled={isLoading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Отправка...
                      </>
                    ) : (
                      "Отправить код"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPasswordReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 shadow-lg max-w-md w-full p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                <i className="fas fa-lock text-white text-2xl"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Установить новый пароль</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Введите код из письма и новый пароль
              </p>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Код из email</Label>
                  <Input
                    {...resetPasswordForm.register("resetCode")}
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    className="mt-1 bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-center text-lg tracking-widest"
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      resetPasswordForm.setValue("resetCode", value);
                    }}
                  />
                  {(resetPasswordForm.formState.errors.resetCode || apiErrors.resetCode) && (
                    <p className="text-red-500 text-sm mt-1">
                      {apiErrors.resetCode || resetPasswordForm.formState.errors.resetCode?.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Новый пароль</Label>
                  <Input
                    {...resetPasswordForm.register("newPassword")}
                    type="password"
                    placeholder="Введите новый пароль"
                    className="mt-1 bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700"
                  />
                  {resetPasswordForm.formState.errors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {resetPasswordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300">Повторите пароль</Label>
                  <Input
                    {...resetPasswordForm.register("confirmPassword")}
                    type="password"
                    placeholder="Повторите новый пароль"
                    className="mt-1 bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700"
                  />
                  {resetPasswordForm.formState.errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {resetPasswordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordReset(false);
                      setResetEmail("");
                      resetPasswordForm.reset();
                      setApiErrors({});
                    }}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={resetPasswordForm.handleSubmit(onResetPassword)}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Изменение...
                      </>
                    ) : (
                      "Изменить пароль"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
