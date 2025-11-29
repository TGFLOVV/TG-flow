import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Key } from "lucide-react";

export default function SecuritySettings() {
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
        description: "Ваш пароль успешно обновлен"
      });
    },
    onError: (error: any) => {
      console.error("Error changing password:", error);
      let errorMessage = "Не удалось изменить пароль";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Ошибка смены пароля",
        description: errorMessage,
        variant: "destructive"
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

  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      await apiRequest("DELETE", "/api/user/delete-account", {
        password: deletePassword
      });

      toast({
        title: "Аккаунт удален",
        description: "Ваш аккаунт был успешно удален",
      });

      // Redirect to home page
      window.location.href = "/";
    } catch (error: any) {
      console.error("Delete account error:", error);

      let errorMessage = "Не удалось удалить аккаунт";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Key className="h-5 w-5" />
          Безопасность
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Управление паролем и настройками безопасности аккаунта
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
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
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button 
          onClick={handleChangePassword}
          disabled={changePasswordMutation.isPending || !newPassword || !confirmPassword}
          className="bg-green-600 hover:bg-green-700 text-white w-full"
        >
          {changePasswordMutation.isPending ? (
            "Изменение..."
          ) : (
            "Изменить пароль"
          )}
        </Button>

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              <p className="font-medium mb-1">Советы по безопасности:</p>
              <ul className="space-y-1 text-xs">
                <li>• Используйте уникальный пароль для этого аккаунта</li>
                <li>• Не используйте личную информацию в пароле</li>
                <li>• Обновляйте пароль регулярно</li>
                <li>• Включите двухфакторную аутентификацию если доступно</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4">
            <Label>Подтвердите пароль для удаления аккаунта</Label>
            <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Введите ваш пароль"
            />
            <Button
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword}
                className="bg-red-600 hover:bg-red-700 text-white w-full mt-2"
            >
                {isDeleting ? "Удаление..." : "Удалить аккаунт"}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
