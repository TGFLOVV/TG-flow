
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ListSkeletonProps {
  count?: number;
  itemHeight?: string;
  showAvatar?: boolean;
  showBadge?: boolean;
}

const ListSkeleton: React.FC<ListSkeletonProps> = ({ 
  count = 5,
  itemHeight = "h-16",
  showAvatar = true,
  showBadge = false
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`flex items-center space-x-4 p-4 bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-lg ${itemHeight}`}>
          {showAvatar && (
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-1/3" />
              {showBadge && <Skeleton className="h-5 w-16 rounded-full" />}
            </div>
            <Skeleton className="h-3 w-2/3" />
            <div className="flex space-x-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListSkeleton;
