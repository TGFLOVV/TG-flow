
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

const BackToTopButton: React.FC = React.memo(() => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const toggleVisibility = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsVisible(window.pageYOffset > 300);
      }, 100);
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
      clearTimeout(timeoutId);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      onClick={scrollToTop}
      className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg transition-all duration-300 hover:scale-110"
      size="icon"
    >
      <i className="fas fa-arrow-up text-lg"></i>
    </Button>
  );
});

BackToTopButton.displayName = 'BackToTopButton';

export default BackToTopButton;
