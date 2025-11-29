import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { FixedModal } from './FixedModal';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
}

export default function WithdrawalModal({ isOpen, onClose, currentBalance }: WithdrawalModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [requisites, setRequisites] = useState('');
  const { toast } = useToast();

  const withdrawalMutation = useMutation({
    mutationFn: async (data: { amount: number; method: string; requisites: string }) => {
      return await apiRequest('POST', '/api/withdrawal-requests', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'Успешно',
        description: 'Заявка на вывод средств создана',
      });
      setAmount('');
      setMethod('');
      setRequisites('');
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось создать заявку на вывод',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);

    if (!amount.trim() || isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Укажите корректную сумму',
        variant: 'destructive',
      });
      return;
    }

    if (numAmount > currentBalance) {
      toast({
        title: 'Ошибка',
        description: 'Недостаточно средств на балансе',
        variant: 'destructive',
      });
      return;
    }

    if (!method) {
      toast({
        title: 'Ошибка',
        description: 'Выберите способ вывода',
        variant: 'destructive',
      });
      return;
    }

    if (!requisites.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Укажите реквизиты для вывода',
        variant: 'destructive',
      });
      return;
    }

    withdrawalMutation.mutate({
      amount: numAmount,
      method,
      requisites: requisites.trim(),
    });
  };

  return (
    <FixedModal open={isOpen} onOpenChange={onClose}>
      <Card className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Вывод средств</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ×
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Доступно для вывода: <span className="font-semibold text-green-600">{currentBalance} ₽</span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                Сумма для вывода
              </Label>
              <Input
                type="number"
                placeholder="Введите сумму"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={currentBalance}
                className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <Label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                Способ вывода
              </Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                  <SelectValue placeholder="Выберите способ вывода" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Банковская карта</SelectItem>
                  <SelectItem value="qiwi">QIWI кошелек</SelectItem>
                  <SelectItem value="yoomoney">ЮMoney</SelectItem>
                  <SelectItem value="webmoney">WebMoney</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                Реквизиты
              </Label>
              <Input
                type="text"
                placeholder="Номер карты, кошелька или счета"
                value={requisites}
                onChange={(e) => setRequisites(e.target.value)}
                className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <div className="flex space-x-3">
            <Button
              onClick={handleSubmit}
              disabled={withdrawalMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {withdrawalMutation.isPending ? (
                <i className="fas fa-spinner fa-spin mr-2"></i>
              ) : (
                <i className="fas fa-paper-plane mr-2"></i>
              )}
              Отправить заявку
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
            >
              Отмена
            </Button>
          </div>
        </CardFooter>
      </Card>
    </FixedModal>
  );
}
