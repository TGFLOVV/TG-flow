
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface NewsSkeletonProps {
  count?: number;
  horizontal?: boolean;
}

const NewsSkeleton: React.FC<NewsSkeletonProps> = ({ 
  count = 3,
  horizontal = false
}) => {
  if (horizontal) {
    return (
      <div className="flex overflow-x-auto space-x-4 pb-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-96 bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <Skeleton className="w-32 h-32 rounded-lg mx-auto mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex justify-between items-center mt-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-24 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <Skeleton className="w-full h-48" />
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex justify-between items-center mt-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-24 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NewsSkeleton;
