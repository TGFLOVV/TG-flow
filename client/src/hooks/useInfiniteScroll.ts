
import { useState, useEffect, useCallback } from 'react';

interface UseInfiniteScrollProps {
  fetchMore: (page: number) => Promise<any[]>;
  initialPage?: number;
  pageSize?: number;
}

export const useInfiniteScroll = ({ 
  fetchMore, 
  initialPage = 1, 
  pageSize = 12 
}: UseInfiniteScrollProps) => {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newData = await fetchMore(page);
      
      if (newData.length === 0 || newData.length < pageSize) {
        setHasMore(false);
      }

      setData(prevData => [...prevData, ...newData]);
      setPage(prevPage => prevPage + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [fetchMore, page, loading, hasMore, pageSize]);

  const reset = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
  }, [initialPage]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let rafId: number;
    
    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      
      rafId = requestAnimationFrame(() => {
        clearTimeout(timeoutId);
        
        timeoutId = setTimeout(() => {
          if (
            window.innerHeight + document.documentElement.scrollTop >= 
            document.documentElement.offsetHeight - 800 &&
            !loading && hasMore
          ) {
            loadMore();
          }
        }, 100);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [loadMore, loading, hasMore]);

  return { data, loading, hasMore, error, loadMore, reset };
};
