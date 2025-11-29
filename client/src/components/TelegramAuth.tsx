import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface TelegramAuthProps {
  type?: 'login' | 'register';
  onSuccess?: () => void;
}

export default function TelegramAuth({ type = 'login', onSuccess }: TelegramAuthProps) {
  const { toast } = useToast();

  const handleTelegramAuth = () => {
    // Перенаправляем пользователя в Telegram бота
    window.open('https://t.me/TG_FLOVV_BOT', '_blank');
    
    const message = type === 'login' 
      ? "Откройте бота и отправьте команду /start для входа в систему"
      : "Откройте бота и отправьте команду /start для создания аккаунта";
    
    toast({
      title: "Переход в Telegram",
      description: message,
    });
  };

  const buttonText = type === 'login' ? 'Войти через Telegram' : 'Регистрация через Telegram';

  return (
    <Button 
      onClick={handleTelegramAuth} 
      variant="outline"
      className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16c-.18 1.896-.96 6.728-1.356 8.92-.168.93-.5 1.24-.82 1.27-.697.06-1.226-.46-1.9-.9-1.056-.69-1.653-1.12-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
      {buttonText}
    </Button>
  );
}