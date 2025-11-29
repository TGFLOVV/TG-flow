import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

export const usePageTransition = () => {
  const [location] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prevLocation, setPrevLocation] = useState(location);

  useEffect(() => {
    if (location !== prevLocation) {
      setIsTransitioning(true);
      setPrevLocation(location);

      // Быстро убираем индикатор загрузки
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [location, prevLocation]);

  return { isTransitioning };
};