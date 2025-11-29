import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Crown, Wallet, Clock, Calendar } from "lucide-react";
import ConfirmationModal from './ConfirmationModal';

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (days?: number) => void;
  type: 'top' | 'ultra-top';
  isLoading: boolean;
  channelName: string;
  userBalance: number;
}

export default function PromotionModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  isLoading,
  channelName,
  userBalance
}: PromotionModalProps) {
  const [days, setDays] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const daysNumber = parseInt(days) || 1;

  const isUltraTop = type === 'ultra-top';
  const basePrice = isUltraTop ? 500 : 50;

  // Для ТОП - фиксированная цена 50 рублей, для Ультра ТОП - расчёт по дням
  let totalCost = isUltraTop ? basePrice * daysNumber : basePrice;

  // Применяем скидку 10% для УЛЬТРА ТОП при покупке на 7+ дней
  if (isUltraTop && daysNumber >= 7) {
    totalCost = Math.round(totalCost * 0.9); // Скидка 10%
  }

  const title = isUltraTop ? 'УЛЬТРА ТОП' : 'ТОП';
  const icon = isUltraTop ? <Crown className="w-6 h-6" /> : <Star className="w-6 h-6" />;
  const iconColor = isUltraTop ? 'text-yellow-500' : 'text-purple-500';
  const bgGradient = isUltraTop ? 'from-yellow-400 to-orange-500' : 'from-purple-500 to-purple-600';

  const hasEnoughFunds = userBalance >= totalCost;
  const isValidDays = days !== '' && daysNumber >= 1 && daysNumber <= 365;

    const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Убираем все нечисловые символы
    value = value.replace(/[^0-9]/g, '');

    // Убираем ведущие нули (кроме случая когда поле пустое или единственный ноль)
    if (value.length > 1 && value.startsWith('0')) {
      value = value.replace(/^0+/, '');
    }

    // Если после удаления нулей строка пустая, ставим 1
    if (value === '' || value === '0') {
      value = '1';
    }

    // Ограничиваем максимальное значение 365 днями
    const numValue = parseInt(value);
    if (numValue > 365) {
      value = '365';
    }

    setDays(value);
  };

  const handleConfirm = () => {
    setShowConfirmation(true);
  };

  const handleFinalConfirm = () => {
    onConfirm(isUltraTop ? daysNumber : undefined);
    setShowConfirmation(false);
    onClose();
  };

  const handleCloseModal = () => {
    setShowConfirmation(false);
    onClose();
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white text-center">
            Продвижение в {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Channel Name */}
          {!isUltraTop && (
            <Card className="border-0 shadow-none">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${bgGradient} flex items-center justify-center text-white`}>
                    {icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Поднять в {title}
                    </h3>
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-lg shadow-md">
                      <p className="text-white font-semibold">
                        {channelName}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isUltraTop && (
            <div className="text-center mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-white mb-1">
                  {channelName}
                </h3>
                <p className="text-blue-100 text-sm">
                  Продвижение канала
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-400 text-center">
              {isUltraTop 
                ? "Ультра ТОП размещает вашу публикацию в топе списка на выбранное количество дней"
                : "ТОП поднимает вашу публикацию на 1 место после Ультра ТОП публикаций до тех пор, пока её не перебьют"
              }
            </p>
          </div>

          {/* Days input for Ultra Top */}
          {isUltraTop && (
            <div className="space-y-2">
              <Label htmlFor="days" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Количество дней
              </Label>
              <Input
                id="days"
                type="text"
                min="1"
                max="365"
                value={days}
                onChange={handleDaysChange}
                placeholder="Введите количество дней"
                className="w-full"
                maxLength={3}
                pattern="[1-9][0-9]*"
                title="Введите число от 1 до 365"
              />
            </div>
          )}

          {/* Details */}
          <div className="space-y-4">
            {isUltraTop && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Продолжительность</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {daysNumber} {daysNumber === 1 ? 'день' : daysNumber < 5 ? 'дня' : 'дней'}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Стоимость</span>
              </div>
              <div className="text-right">
                {isUltraTop && daysNumber >= 7 ? (
                  <div>
                    <div className="text-xs text-gray-500 line-through">{basePrice * daysNumber} ₽</div>
                    <div className="text-sm font-medium text-green-600">
                      {totalCost} ₽ <span className="text-xs">(скидка 10%)</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {isUltraTop ? `${basePrice} ₽ × ${daysNumber} = ${totalCost} ₽` : `${totalCost} ₽`}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Ваш баланс</span>
              </div>
              <span className={`text-sm font-medium ${hasEnoughFunds ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {userBalance} ₽
              </span>
            </div>
          </div>

          {!hasEnoughFunds && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400 text-center">
                Недостаточно средств на балансе
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="flex-1"
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || !hasEnoughFunds || !isValidDays}
              className={`flex-1 bg-gradient-to-r ${bgGradient} hover:opacity-90 text-white border-0`}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Обработка...</span>
                </div>
              ) : (
                `Поднять за ${totalCost} ₽`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={handleCloseConfirmation}
        onConfirm={handleFinalConfirm}
        title={`Подтверждение продвижения в ${title}`}
        message={
          isUltraTop
            ? `Вы уверены, что хотите поднять "${channelName}" в УЛЬТРА ТОП на ${daysNumber} ${daysNumber === 1 ? 'день' : daysNumber < 5 ? 'дня' : 'дней'} за ${totalCost} ₽?`
            : `Вы уверены, что хотите поднять "${channelName}" в ТОП за ${totalCost} ₽?`
        }
        confirmText={`Оплатить ${totalCost} ₽`}
        cancelText="Отмена"
        isLoading={isLoading}
        variant="default"
      />
    </Dialog>
  );
}
