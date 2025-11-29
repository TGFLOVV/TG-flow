import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Calendar, Star, Crown, Clock, Wallet, Eye, Edit } from "lucide-react";
import { useLocation } from "wouter";
import OptimizedImage from "./OptimizedImage";
import React, { memo, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ConfirmationModal from './ConfirmationModal';

interface MyPublicationChannelCardProps {
  channel: {
    id: number;
    name: string;
    username: string;
    description?: string;
    avatarUrl?: string;
    imageUrl?: string;
    subscriberCount: number;
    views?: number;
    viewCount?: number;
    rating: string;
    category: {
      name: string;
      id: number;
    };
    status: string;
    createdAt: string;
    isTop?: boolean;
    isUltraTop?: boolean;
    ultraTopExpiresAt?: string;
    topPromotedAt?: string;
    userRating?: number;
    type?: string;
  };
  onEdit: (channel: any) => void;
  onPromoteStart: (channelId: number, type: 'top' | 'ultra-top') => void;
  onPromoteConfirm: (channelId: number, type: 'top' | 'ultra-top', days?: number) => void;
  isPromoting: boolean;
  userBalance: number;
}

const MyPublicationChannelCard = memo(function MyPublicationChannelCard({ 
  channel, 
  onEdit, 
  onPromoteStart, 
  onPromoteConfirm,
  isPromoting,
  userBalance
}: MyPublicationChannelCardProps) {
  const [, setLocation] = useLocation();
  const [promotionMode, setPromotionMode] = useState<'top' | 'ultra-top' | null>(null);
  const [showPromotionConfirm, setShowPromotionConfirm] = useState(false);
  const [days, setDays] = useState<number>(1);
  const [editMode, setEditMode] = useState(false);

  const formatSubscribers = (count: number | string | null | undefined): string => {
    if (!count) return '0';
    const num = typeof count === 'string' ? parseInt(count) : count;
    if (isNaN(num)) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTimeUntilExpiry = (expiryDate: string | null | undefined): string => {
    if (!expiryDate) return 'Истёк';

    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry.getTime() - now.getTime();

    if (diffMs <= 0) return 'Истёк';

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays}д ${diffHours}ч`;
    } else {
      return `${diffHours}ч`;
    }
  };

  // Get real 24h views from API
  const { data: views24hData } = useQuery({
    queryKey: [`/api/channels/${channel.id}/views-24h`],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const views24h = views24hData?.views24h || 0;

  const totalViews = channel.views || channel.viewCount || 0;

  const isUltraTop = promotionMode === 'ultra-top';
  const basePrice = isUltraTop ? 500 : 50;

  let totalCost = isUltraTop ? basePrice * days : basePrice;
    const daysNumber = Number(days);

  if (isUltraTop && days >= 7) {
    totalCost = Math.round(totalCost * 0.9);
  }

  const hasEnoughFunds = userBalance >= totalCost;

  const handlePromoteClick = (type: 'top' | 'ultra-top') => {
    setPromotionMode(type);
  };

  const handleFinalPromoteConfirm = () => {
    if (promotionMode) {
      onPromoteConfirm(channel.id, promotionMode, isUltraTop ? days : undefined);
      setPromotionMode(null);
    }
  };



  const handleCancel = () => {
    setPromotionMode(null);
    setDays(1);
  };



  return (
    <Card className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-purple-500/40 rounded-xl overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl h-full flex flex-col">
      {/* Ultra Top Badge */}
      {channel.isUltraTop && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white px-1.5 py-0.5 rounded-full text-[8px] font-bold shadow-lg flex items-center gap-0.5">
            <Crown className="w-2 h-2" />
            УЛЬТРА ТОП
          </div>
        </div>
      )}

      <CardContent className="p-6 relative flex-1 flex flex-col">
        {/* Edit Interface */}
        {editMode && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="text-center mb-4">
              <div className="bg-gradient-to-r from-green-500 to-blue-600 p-3 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-white mb-1">
                  {channel.name}
                </h3>
                <p className="text-green-100 text-sm">
                  Редактирование публикации
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="p-3 bg-green-100 dark:bg-green-800/30 border border-green-200 dark:border-green-700 rounded-lg mb-4">
              <p className="text-sm text-green-700 dark:text-green-400 text-center">
                Нажмите "Редактировать", чтобы изменить информацию о вашей публикации
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setEditMode(false)}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                onClick={() => {
                  onEdit(channel);
                  setEditMode(false);
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:opacity-90 text-white border-0"
              >
                Редактировать
              </Button>
            </div>
          </div>
        )}

        {/* Promotion Interface */}
        {promotionMode && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-center mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-white mb-1">
                  {channel.name}
                </h3>
                <p className="text-blue-100 text-sm">
                  Продвижение в {promotionMode === 'ultra-top' ? 'УЛЬТРА ТОП' : 'ТОП'}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="p-3 bg-blue-100 dark:bg-blue-800/30 border border-blue-200 dark:border-blue-700 rounded-lg mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-400 text-center">
                {isUltraTop 
                  ? "Ультра ТОП размещает вашу публикацию в топе списка на выбранное количество дней"
                  : "ТОП поднимает вашу публикацию на 1 место после Ультра ТОП публикаций до тех пор, пока её не перебьют"
                }
              </p>
            </div>

            {/* Days input for Ultra Top */}
            {isUltraTop && (
              <div className="space-y-2 mb-4">
                <Label htmlFor="days" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Количество дней
                </Label>
                <Input
                  id="days"
                  type="number"
                  min="1"
                  max="365"
                  value={days}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Validate the input to prevent leading zeros and ensure it's within the valid range
                    if (/^(0*[1-9]\d*(\.\d+)?|0\.\d+)$/.test(value) || value === "") {
                      const parsedValue = value === "" ? 1 : parseInt(value, 10);
                      if (parsedValue >= 1 && parsedValue <= 365) {
                        setDays(parsedValue);
                      }
                    }
                  }}
                  placeholder="Введите количество дней"
                  className="w-full"
                />
              </div>
            )}

            {/* Cost details */}
            <div className="space-y-3 mb-4">
              {isUltraTop && (
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Продолжительность</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Стоимость</span>
                </div>
                <div className="text-right">
                  {isUltraTop && days >= 7 ? (
                    <div>
                      <div className="text-xs text-gray-500 line-through">{basePrice * days} ₽</div>
                      <div className="text-sm font-medium text-green-600">
                        {totalCost} ₽ <span className="text-xs">(скидка 10%)</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {isUltraTop ? `${basePrice} ₽ × ${days} = ${totalCost} ₽` : `${totalCost} ₽`}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                <p className="text-sm text-red-700 dark:text-red-400 text-center">
                  Недостаточно средств на балансе
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
                disabled={isPromoting}
              >
                Отмена
              </Button>
              <Button
                      onClick={() => onPromoteConfirm(channel.id, promotionMode, isUltraTop ? days : undefined)}
                      disabled={isPromoting || !hasEnoughFunds || (isUltraTop && (!days || daysNumber < 1))}
                      className={`flex-1 ${
                        hasEnoughFunds && (!isUltraTop || (days && daysNumber >= 1))
                          ? (isUltraTop ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:opacity-90' : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:opacity-90')
                          : 'bg-gray-400 cursor-not-allowed'
                      } text-white border-0`}
              >
                {isPromoting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Обработка...</span>
                  </div>
                ) : (
                  `Оплатить ${totalCost} ₽`
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Regular card content - only show when not in promotion or edit mode */}
        {!promotionMode && !editMode && (
          <>
            <div className="flex items-start mb-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full mr-4 flex-shrink-0 overflow-hidden border-2 border-gray-300 dark:border-purple-500/40">
                {(channel.imageUrl || channel.avatarUrl) ? (
                  <OptimizedImage 
                    src={channel.imageUrl || channel.avatarUrl} 
                    alt={channel.name}
                    className="w-full h-full"
                    width={48}
                    height={48}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                    {channel.type === 'bot' ? (
                      <i className="fas fa-robot text-blue-500 dark:text-blue-400 text-lg"></i>
                    ) : channel.type === 'group' ? (
                      <i className="fas fa-users text-green-500 dark:text-green-400 text-lg"></i>
                    ) : (
                      <i className="fas fa-paper-plane text-purple-500 dark:text-purple-400 text-lg"></i>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{channel.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">@{channel.username}</p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                  {channel.description || "Описание канала отсутствует"}
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-300">
                  {channel.type !== 'bot' && (
                    <span className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {formatSubscribers(channel.subscriberCount)}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {channel.views || channel.viewCount || 0}
                  </span>
                  <span className="flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    {channel.rating}
                  </span>
                  <Badge className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 leading-tight">
                    {String(channel.category?.name || 'Без категории')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {totalViews.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Всего просмотров</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {views24h.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">За 24 часа</div>
              </div>
            </div>

            {/* Promotion Details */}
            {(channel.isUltraTop || channel.isTop) && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                {/* Ultra Top */}
                {channel.isUltraTop && (
                  <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Crown className="w-4 h-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                        <span className="font-semibold">УЛЬТРА ТОП</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-yellow-600 dark:text-yellow-400">Осталось:</div>
                        <div className="font-bold text-xs">
                          {getTimeUntilExpiry(channel.ultraTopExpiresAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top */}
                {channel.isTop && (
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300 bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 p-3 rounded-lg border border-purple-200 dark:border-purple-700/50">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                      <span className="font-semibold">ТОП</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            {channel.status === "approved" && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3 space-y-2">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handlePromoteClick('top')}
                    disabled={
                      isPromoting ||
                      (channel.isUltraTop && channel.ultraTopExpiresAt && new Date(channel.ultraTopExpiresAt) > new Date())
                    }
                    className={`text-white text-xs flex-1 ${
                      (channel.isUltraTop && channel.ultraTopExpiresAt && new Date(channel.ultraTopExpiresAt) > new Date())
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    ТОП
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handlePromoteClick('ultra-top')}
                    disabled={isPromoting}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs flex-1"
                  >
                    <Crown className="w-3 h-3 mr-1" />
                    УЛЬТРА ТОП
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {new Date(channel.createdAt).toLocaleDateString("ru-RU")}
              </div>
            </div>

            {/* Type badge */}
            <div className="absolute bottom-3 right-3">
              <div className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${
                channel.type === 'bot' ? 'bg-blue-500/90 text-white' : 
                channel.type === 'group' ? 'bg-green-500/90 text-white' : 'bg-purple-500/90 text-white'
              }`}>
                <i className={`${
                  channel.type === 'bot' ? 'fas fa-robot' : 
                  channel.type === 'group' ? 'fas fa-users' : 'fas fa-paper-plane'
                }`}></i>
                <span>
                  {channel.type === 'bot' ? 'БОТ' : 
                   channel.type === 'group' ? 'ГРУППА' : 'КАНАЛ'}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});

export default MyPublicationChannelCard;
