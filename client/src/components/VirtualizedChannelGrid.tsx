import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { areEqual } from 'react-window';
import ChannelCard from './ChannelCard';
import ChannelCardSkeleton from './ChannelCardSkeleton';
import MyPublicationChannelCard from './MyPublicationChannelCard';

interface VirtualizedChannelGridProps {
  channels: any[];
  isLoading?: boolean;
  itemsPerRow?: number;
  itemWidth?: number;
  itemHeight?: number;
  containerHeight?: number;
  gap?: number;
  onChannelAction?: (action: string, channel: any, data?: any) => void;
  cardType?: 'default' | 'my-publications';
  // Для my-publications карточек
  onPromoteStart?: (channelId: number, type: 'top' | 'ultra-top') => void;
  onEdit?: (channel: any) => void;
  getTimeUntilExpiry?: (expiryDate: string | null) => string;
  isPromoting?: boolean;
}

const VirtualizedChannelGrid: React.FC<VirtualizedChannelGridProps> = ({
  channels,
  isLoading = false,
  itemsPerRow = 3,
  itemWidth = 300,
  itemHeight = 400,
  containerHeight = 600,
  gap = 16,
  onChannelAction,
  cardType = 'default',
  onPromoteStart,
  onEdit,
  getTimeUntilExpiry,
  isPromoting = false
}) => {
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  // Responsive items per row
  const responsiveItemsPerRow = useMemo(() => {
    if (containerWidth < 640) return 1;
    if (containerWidth < 1024) return 2;
    if (containerWidth < 1536) return 3;
    return 4;
  }, [containerWidth]);

  // Calculate grid dimensions
  const columnCount = responsiveItemsPerRow;
  const rowCount = Math.ceil(channels.length / columnCount);
  const columnWidth = (containerWidth - (gap * (columnCount - 1))) / columnCount;

  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const Cell = React.memo(({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex;
    const channel = channels[index];

    if (!channel) {
      return null;
    }

    if (isLoading) {
      return (
        <div style={{
          ...style,
          padding: gap / 2,
        }}>
          <ChannelCardSkeleton />
        </div>
      );
    }

    return (
      <div style={{
        ...style,
        padding: gap / 2,
      }}>
        {cardType === 'my-publications' ? (
          <MyPublicationChannelCard
            channel={channel}
            onPromoteStart={onPromoteStart!}
            onEdit={onEdit!}
            getTimeUntilExpiry={getTimeUntilExpiry!}
            isPromoting={isPromoting}
          />
        ) : (
          <ChannelCard channel={channel} />
        )}
      </div>
    );
  }, areEqual);

  if (channels.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Каналы не найдены</p>
      </div>
    );
  }

  return (
    <div className="w-full contain-layout">
      <Grid
        columnCount={columnCount}
        columnWidth={columnWidth}
        height={containerHeight}
        rowCount={rowCount}
        rowHeight={itemHeight + gap}
        width={containerWidth}
        className="perf-grid"
        overscanRowCount={2}
        overscanColumnCount={1}
      >
        {Cell}
      </Grid>
    </div>
  );
};

export default React.memo(VirtualizedChannelGrid);