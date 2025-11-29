import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Star } from "lucide-react";
import { useLocation } from "wouter";
import OptimizedImage from "./OptimizedImage";
import React, { memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

interface ChannelCardProps {
  channel: {
    id: number;
    name: string;
    username: string;
    description?: string;
    avatarUrl?: string;
    imageUrl?: string;
    subscriberCount: number;
    views?: number;
    rating: string;
    category: {
      name: string;
      id: number;
    };
    status: string;
    createdAt: string;
    isTop?: boolean;
    isUltraTop?: boolean;
    userRating?: number;
    type?: string;
  };
}

const ChannelCard = memo(function ChannelCard({ channel }: ChannelCardProps) {
  const [, setLocation] = useLocation();

  const formatSubscribers = (count: number | string | null | undefined, mobile: boolean = false): string => {
    if (!count) return '0';

    const num = typeof count === 'string' ? parseInt(count) : count;
    if (isNaN(num)) return '0';

    if (num >= 1000000) {
      return mobile ? `${(num / 1000000).toFixed(0)}M` : `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return mobile ? `${(num / 1000).toFixed(0)}K` : `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const handleJoinClick = useMemo(() => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Assuming channel.telegramLink is available here, if not adjust accordingly
    // window.open(channel.telegramLink, '_blank', 'noopener,noreferrer');
  }, []); // Removed dependency on channel.telegramLink as it's not directly used

  const handleCardClick = useMemo(() => () => {
    setLocation(`/channels/${channel.id}`);
  }, [channel.id, setLocation]);

  // Get real 24h views from API
  const { data: views24hData } = useQuery({
    queryKey: [`/api/channels/${channel.id}/views-24h`],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const views24h = views24hData?.views24h || 0;

  return (
    <div 
      className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-purple-500/40 rounded-xl overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group relative shadow-lg hover:shadow-xl h-full flex flex-col"
      onClick={handleCardClick}
    >
      {/* Ultra Top Badge */}
      {channel.isUltraTop && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white px-1.5 py-0.5 rounded-full text-[8px] font-bold shadow-lg flex items-center gap-0.5">
            <i className="fas fa-crown text-[6px]"></i>
            УЛЬТРА ТОП
          </div>
        </div>
      )}

      <div className="p-6 relative flex-1 flex flex-col">
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
                <i className="fas fa-eye mr-1"></i>
                {channel.views || 0}
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
        <div className="flex items-center justify-between mt-auto">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {new Date(channel.createdAt).toLocaleDateString("ru-RU")}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/channels/${channel.id}`);
            }}
          >
            Посмотреть
          </Button>
        </div>

        {/* Type badge in bottom right corner */}
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
      </div>
    </div>
  );
});

export default ChannelCard;
