import React from 'react';
import { X } from 'lucide-react';

interface ModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  className?: string;
}

export const ModalContainer: React.FC<ModalContainerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = 'lg',
  className = '',
}) => {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full ${maxWidthClasses[maxWidth]} p-6 rounded-2xl bg-[#0e0a16] border border-[#2e2638] shadow-gold-md space-y-6 relative ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#231b2e] pb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd86b]/20 to-[#841822]/30 border border-[#ffd86b]/40 flex items-center justify-center text-[#ffd86b]">
                {icon}
              </div>
            )}
            <div>
              <h3 className="font-cinzel text-base font-bold text-white uppercase tracking-wider">
                {title}
              </h3>
              {subtitle && <p className="text-xs text-[#8c7a9e]">{subtitle}</p>}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1c1424] hover:bg-[#281d33] border border-[#4a3461] text-[#8c7a9e] hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
};