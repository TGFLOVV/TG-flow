
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface TwoFactorVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
  isLoading?: boolean;
}

export default function TwoFactorVerification({ 
  isOpen, 
  onClose, 
  onSuccess, 
  isLoading = false 
}: TwoFactorVerificationProps) {
  const [token, setToken] = useState('');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!token.trim() || token.length !== 6) {
      toast({
        title: "Ошибка",
        description: "Введите 6-значный код",
        variant: "destructive",
      });
      return;
    }

    onSuccess(token.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/90 dark:bg-gray-900/90 border-gray-200 dark:border-gray-700 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">
            Двухфакторная аутентификация
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Введите код из приложения Authenticator
            </p>
          </div>

          <div>
            <Label>Код аутентификации</Label>
            <Input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyPress={handleKeyPress}
              placeholder="123456"
              className="text-center text-lg tracking-widest"
              maxLength={6}
              autoFocus
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || token.length !== 6}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? "Проверка..." : "Подтвердить"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
