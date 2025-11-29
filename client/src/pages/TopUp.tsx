import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { Wallet, CreditCard, ArrowLeft, Shield, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { Separator } from "../components/ui/separator";

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

export default function TopUp() {
  const [amount, setAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPaymentMutation = useMutation({
    mutationFn: async (amount: number) => {
      console.log("Sending payment request with amount:", amount);
      const response = await apiRequest("POST", "/api/robokassa/create-payment", { amount });
      console.log("Payment response:", response);
      return response;
    },
    onSuccess: (data) => {
      console.log("Payment created successfully, redirecting to:", data.paymentUrl);
      window.location.href = data.paymentUrl;
    },
    onError: (error: any) => {
      console.error("Payment error:", error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать платеж",
        variant: "destructive",
      });
    },
  });

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
    setCustomAmount("");
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    setAmount(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);

    if (!amount || amountNum <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите сумму пополнения",
        variant: "destructive",
      });
      return;
    }

    if (amountNum < 10) {
      toast({
        title: "Ошибка",
        description: "Минимальная сумма пополнения - 10 рублей",
        variant: "destructive",
      });
      return;
    }

    if (amountNum > 100000) {
      toast({
        title: "Ошибка",
        description: "Максимальная сумма пополнения - 100,000 рублей",
        variant: "destructive",
      });
      return;
    }

    console.log("Submitting payment for amount:", amountNum);
    createPaymentMutation.mutate(amountNum);
  };

  const { isLoading } = useAuth();

  // Показываем лоадер пока проверяем авторизацию
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-gray-900 dark:text-white">Необходима авторизация</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Войдите в аккаунт для пополнения баланса
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth">
              <Button className="w-full">Войти</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/profile">
            <Button variant="ghost" className="mb-6 hover:bg-white/50 dark:hover:bg-gray-800/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к профилю
            </Button>
          </Link>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Пополнение баланса
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Текущий баланс: <span className="font-bold text-2xl text-green-600 dark:text-green-400">
                {parseFloat(user.balance || "0").toFixed(2)} ₽
              </span>
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <CreditCard className="w-6 h-6" />
                  Сумма пополнения
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Выберите сумму или введите свою
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Quick amounts */}
                  <div>
                    <Label className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4 block">
                      Быстрый выбор суммы
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {QUICK_AMOUNTS.map((quickAmount) => (
                        <Button
                          key={quickAmount}
                          type="button"
                          variant={amount === quickAmount.toString() ? "default" : "outline"}
                          onClick={() => handleQuickAmount(quickAmount)}
                          className="h-14 text-lg font-semibold transition-all hover:scale-105"
                        >
                          {quickAmount.toLocaleString()} ₽
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant={customAmount ? "default" : "outline"}
                        onClick={() => {
                          setCustomAmount("custom");
                          setAmount("");
                        }}
                        className="h-14 text-lg font-semibold transition-all hover:scale-105"
                      >
                        Другая сумма
                      </Button>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Custom amount input */}
                  <div>
                    <Label htmlFor="amount" className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                      Или введите свою сумму
                    </Label>
                    <div className="relative">
                      <Input
                        id="amount"
                        type="number"
                        min="10"
                        max="100000"
                        step="1"
                        placeholder="Введите сумму от 10 до 100,000 ₽"
                        value={customAmount ? amount : amount}
                        onChange={(e) => customAmount ? handleCustomAmount(e.target.value) : setAmount(e.target.value)}
                        className="h-14 text-lg pr-12 border-2 focus:border-blue-500"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-medium">₽</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      Минимум: 10 ₽ • Максимум: 100,000 ₽
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={!amount || createPaymentMutation.isPending}
                    className="w-full h-16 text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    {createPaymentMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Создание платежа...
                      </div>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Пополнить на {amount ? parseFloat(amount).toLocaleString() : "0"} ₽
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Payment Info */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  ROBOKASSA
                </CardTitle>
                <CardDescription className="text-green-100">
                  Безопасные платежи
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Мгновенное зачисление средств
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Безопасные SSL-соединения
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Поддержка всех банковских карт
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      СБП и электронные кошельки
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Способы оплаты
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Банковские карты (Visa, MasterCard, МИР)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Система быстрых платежей (СБП)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Электронные кошельки
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Интернет-банкинг
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Важная информация
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Комиссия платежной системы не взимается</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Средства зачисляются моментально</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Минимальная сумма: 10 рублей</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Максимальная сумма: 100,000 рублей</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
