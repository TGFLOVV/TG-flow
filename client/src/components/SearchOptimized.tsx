
import React, { useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';

interface SearchOptimizedProps {
  onResults: (results: any[]) => void;
  placeholder?: string;
}

export const SearchOptimized: React.FC<SearchOptimizedProps> = ({ 
  onResults, 
  placeholder = "Поиск..." 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/search", debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm.trim()) return [];
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedSearchTerm)}`, {
        credentials: 'include'
      });
      
      if (!response.ok) return [];
      return response.json();
    },
    enabled: debouncedSearchTerm.length > 2,
    staleTime: 5 * 60 * 1000,
  });

  useMemo(() => {
    onResults(searchResults);
  }, [searchResults, onResults]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
};

export default React.memo(SearchOptimized);
