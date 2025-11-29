import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CreditCard, X } from "lucide-react";

interface CloudPaymentsWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount: number) => void;
  minAmount?: number;
  maxAmount?: number;
}

declare global {
  interface Window {
    cp: any;
  }
}

export default function CloudPaymentsWidget({
  isOpen,
  onClose,
  onSuccess,
  minAmount = 50,
  maxAmount = 500000
}: CloudPaymentsWidgetProps) {
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { toast } = useToast();
  const { refreshBalance, user } = useAuth();

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && !scriptLoaded) {
      const script = document.createElement('script');
      script.src = 'https://widget.cloudpayments.ru/bundles/cloudpayments.js';
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => {
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить платежный виджет CloudPayments",
          variant: "destructive",
        });
      };
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [isOpen, scriptLoaded, toast]);

  const handlePayment = async () => {
    const amountNum = parseFloat(amount);

    if (!amount || isNaN(amountNum) || amountNum < minAmount) {
      toast({
        title: "Ошибка",
        description: `Минимальная сумма пополнения: ${minAmount.toLocaleString()} рублей`,
        variant: "destructive",
      });
      return;
    }

    if (!email || !email.trim()) {
      toast({
        title: "Ошибка",
        description: "Email обязателен для получения чека",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "Ошибка",
        description: "Введите корректный email адрес",
        variant: "destructive",
      });
      return;
    }

    if (!scriptLoaded || !window.cp) {
      toast({
        title: "Ошибка",
        description: "Платежный виджет не загружен",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Получаем данные для платежа с сервера
      const response = await fetch('/api/cloudpayments/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountNum,
          description: `Пополнение баланса TG Flow на ${amountNum} рублей`,
          email: email.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка создания платежа');
      }

      const paymentData = await response.json();
      
      const widget = new window.cp.CloudPayments();
      
      widget.pay('charge', {
        publicId: paymentData.publicId,
        description: paymentData.description,
        amount: paymentData.amount,
        currency: paymentData.currency,
        invoiceId: paymentData.invoiceId,
        accountId: paymentData.accountId,
        email: paymentData.email,
        skin: 'modern',
        data: paymentData.data
      }, {
        onSuccess: async function(options: any) {
          console.log('CloudPayments Success:', options);
          setIsLoading(false);
          
          try {
            // Отправляем данные о успешном платеже на сервер
            const successResponse = await fetch('/api/cloudpayments/success', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                transactionId: options.TransactionId,
                amount: amountNum,
                invoiceId: paymentData.invoiceId,
                email: paymentData.email
              }),
            });

            if (successResponse.ok) {
              const result = await successResponse.json();
              toast({
                title: "Платеж успешен!",
                description: `Баланс пополнен на ${amountNum}₽`,
              });
              
              // Обновляем баланс пользователя
              if (refreshBalance) {
                await refreshBalance();
              }
              
              if (onSuccess) {
                onSuccess(amountNum);
              }
            } else {
              throw new Error('Ошибка обновления баланса');
            }
          } catch (error) {
            console.error('Error processing payment success:', error);
            toast({
              title: "Платеж прошел, но возникла ошибка",
              description: "Обратитесь в поддержку",
              variant: "destructive",
            });
          }
          
          onClose();
        },
        onFail: function(reason: any, options: any) {
          console.log('CloudPayments Fail:', reason, options);
          setIsLoading(false);
          toast({
            title: "Ошибка платежа",
            description: reason || 'Платеж отклонен',
            variant: "destructive",
          });
        },
        onComplete: function(paymentResult: any, options: any) {
          console.log('CloudPayments Complete:', paymentResult, options);
          setIsLoading(false);
        }
      });

    } catch (error) {
      console.error('CloudPayments Error:', error);
      setIsLoading(false);
      toast({
        title: "Ошибка",
        description: "Ошибка инициализации платежа",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
         style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl 
                      flex flex-col max-h-[90vh] overflow-hidden z-[100000]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Пополнение баланса
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div>
            <Label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Сумма пополнения (рубли) *
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50"
              min={minAmount}
              step="1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Минимум: {minAmount.toLocaleString()}₽
            </p>
          </div>

          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email для чека *
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
              required
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Безопасная оплата
              </span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Платеж обрабатывается через CloudPayments. Ваши данные защищены.
            </p>
          </div>

          <div className="text-xs text-gray-500 text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <span className="text-yellow-700 dark:text-yellow-300">
              Тестовый режим. Используйте тестовые карты CloudPayments
            </span>
          </div>

          <div className="flex space-x-4 pt-4 pb-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isLoading || !scriptLoaded || !amount || !email}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Оплатить {amount ? `${parseFloat(amount).toLocaleString()}₽` : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}