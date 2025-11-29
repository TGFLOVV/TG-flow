
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FixedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const FixedModal: React.FC<FixedModalProps> = ({ 
  open, 
  onOpenChange, 
  children, 
  className 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Предотвращаем прокрутку фона
      document.body.style.overflow = 'hidden';
      // Сохраняем текущую позицию скролла
      document.body.style.position = 'fixed';
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Восстанавливаем прокрутку
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Очистка при размонтировании
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const modalContent = (
    <>
      {/* Overlay with flexbox centering */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={() => onOpenChange(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
      >
        {/* Modal Content */}
        <div 
          ref={modalRef}
          className={cn(
            // Убираем fixed позиционирование, используем relative внутри flex контейнера
            "relative z-[10000] bg-background border shadow-lg rounded-lg overflow-y-auto overflow-x-hidden",
            // Размеры
            "w-[500px] max-h-[80vh]",
            // Для мобильных устройств
            "max-md:w-full max-md:max-h-[80vh]",
            // Максимальные размеры
            "max-w-full",
            // Анимации
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};
