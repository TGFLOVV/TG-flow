import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard } from "lucide-react";

interface CloudPaymentsTestWidgetProps {
  amount: number;
  description: string;
  orderId: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}

declare global {
  interface Window {
    cp: any;
  }
}

export default function CloudPaymentsTestWidget({
  amount,
  description,
  orderId,
  onSuccess,
  onError
}: CloudPaymentsTestWidgetProps) {
  const [email, setEmail] = useState('test@example.com');
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!scriptLoaded) {
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
    }
  }, [scriptLoaded, toast]);

  const handlePayment = async () => {
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
          amount,
          description,
          email
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
        onSuccess: function(options: any) {
          console.log('CloudPayments Success:', options);
          setIsLoading(false);
          toast({
            title: "Платеж успешен!",
            description: `Платеж на сумму ${amount}₽ успешно обработан. Баланс будет обновлен автоматически.`,
          });
          onSuccess(options.transactionId || options.invoiceId);
        },
        onFail: function(reason: any, options: any) {
          console.log('CloudPayments Fail:', reason, options);
          setIsLoading(false);
          toast({
            title: "Ошибка платежа",
            description: reason || 'Платеж отклонен',
            variant: "destructive",
          });
          onError(reason || 'Платеж отклонен');
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
      onError('Ошибка инициализации платежа');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
            Оплата через CloudPayments
          </span>
        </div>
        <div className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
          <p>Сумма: <strong>{amount}₽</strong></p>
          <p>Описание: {description}</p>
          <p>Заказ: {orderId}</p>
        </div>
      </div>

      <div>
        <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email для чека
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="test@example.com"
          className="w-full"
        />
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-xs text-yellow-700 dark:text-yellow-300">
          <strong>Тестовый режим:</strong> Используйте карту 4242 4242 4242 4242 с любым CVV и сроком действия в будущем
        </p>
      </div>

      <Button
        onClick={handlePayment}
        disabled={isLoading || !scriptLoaded || !email}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Обработка платежа...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Оплатить {amount}₽
          </>
        )}
      </Button>
    </div>
  );
}