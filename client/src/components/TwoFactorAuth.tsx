
import React, { useState } from 'react';
import { FixedModal } from '@/components/FixedModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TwoFactorAuth({ isOpen, onClose, onSuccess }: TwoFactorAuthProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'setup' | 'verify' | 'success'>('setup');
  const [qrCode, setQrCode] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const setupTwoFactor = async () => {
    setIsLoading(true);
    try {
      // Имитируем настройку 2FA
      setTimeout(() => {
        setQrCode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        setSecretKey('ABCD EFGH IJKL MNOP');
        setStep('verify');
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Ошибка",
        description: "Не удалось настроить двухфакторную аутентификацию",
        variant: "destructive",
      });
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Ошибка",
        description: "Введите 6-значный код",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Имитируем проверку кода
      setTimeout(() => {
        setStep('success');
        setIsLoading(false);
        toast({
          title: "Успешно",
          description: "Двухфакторная аутентификация настроена",
        });
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Ошибка",
        description: "Неверный код подтверждения",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setStep('setup');
    setVerificationCode('');
    onClose();
  };

  const handleSuccess = () => {
    onSuccess();
    handleClose();
  };

  return (
    <FixedModal open={isOpen} onOpenChange={handleClose} className="max-w-md">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Двухфакторная аутентификация
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {step === 'setup' && 'Настройте 2FA для дополнительной безопасности'}
          {step === 'verify' && 'Отсканируйте QR-код и введите код подтверждения'}
          {step === 'success' && 'Двухфакторная аутентификация успешно настроена'}
        </p>
      </div>

      {step === 'setup' && (
        <div className="space-y-6">
          <div className="text-center">
            <i className="fas fa-shield-alt text-4xl text-blue-500 dark:text-blue-400 mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Двухфакторная аутентификация добавляет дополнительный уровень защиты к вашему аккаунту.
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left">
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Защита от несанкционированного доступа
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Совместимость с Google Authenticator
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Дополнительная безопасность аккаунта
              </li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={setupTwoFactor}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Настройка...
                </>
              ) : (
                <>
                  <i className="fas fa-cog mr-2"></i>
                  Настроить 2FA
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Отмена
            </Button>
          </div>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
              <img src={qrCode} alt="QR Code" className="w-32 h-32 mx-auto" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Отсканируйте QR-код с помощью приложения Google Authenticator
            </p>
            <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded border">
              {secretKey}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Код подтверждения
            </label>
            <Input
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="text-center font-mono text-lg tracking-widest"
              maxLength={6}
            />
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={verifyCode}
              disabled={isLoading || verificationCode.length !== 6}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Проверка...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2"></i>
                  Подтвердить
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('setup')}
              disabled={isLoading}
              className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Назад
            </Button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="space-y-6">
          <div className="text-center">
            <i className="fas fa-check-circle text-4xl text-green-500 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Готово!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Двухфакторная аутентификация успешно настроена. Теперь ваш аккаунт защищен дополнительным уровнем безопасности.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Сохраните резервные коды в безопасном месте
              </p>
            </div>
          </div>

          <Button
            onClick={handleSuccess}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <i className="fas fa-check mr-2"></i>
            Завершить настройку
          </Button>
        </div>
      )}
    </FixedModal>
  );
}
