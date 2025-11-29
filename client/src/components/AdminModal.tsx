
import React from 'react';
import { FixedModal } from '@/components/FixedModal';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function AdminModal({ isOpen, onClose, title, children, className = "max-w-md" }: AdminModalProps) {
  return (
    <FixedModal 
      open={isOpen} 
      onOpenChange={onClose} 
      className={`${className} fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`}
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
      </div>
      {children}
    </FixedModal>
  );
}
