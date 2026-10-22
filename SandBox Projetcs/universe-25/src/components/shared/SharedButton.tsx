import React from 'react';

interface SharedButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const SharedButton: React.FC<SharedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  loading = false,
  className = '',
  style,
}) => {
  // Base classes with snappy hardware-accelerated transitions and tactile active feedback
  const baseClasses = `flex items-center justify-center gap-2 rounded-lg font-cinzel font-bold transition-[transform,opacity,background-color,border-color,box-shadow] duration-75 ease-out select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100`;

  // Variant classes
  const variantClasses = {
    primary: `bg-[#ffd86b] text-black hover:bg-[#ffd86b]/90 active:scale-[0.98]`,
    secondary: `bg-[#1a1424] text-[#ffd86b] hover:bg-[#1a1424]/80 border border-[#ffd86b]/40 active:scale-[0.98]`,
    danger: `bg-[#ff6b6b] text-white hover:bg-[#ff6b6b]/90 active:scale-[0.98]`,
    ghost: `text-[#ffd86b] hover:bg-[#1a1424]/40 active:scale-[0.98]`,
  };

  // Size classes
  const sizeClasses = {
    sm: `px-3 py-1.5 text-xs`,
    md: `px-5 py-2.5 text-sm`,
    lg: `px-8 py-4 text-base`,
  };

  // Loading spinner class
  const loadingClass = loading ? `animate-spin` : '';

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    loadingClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      style={style}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeDasharray="80" strokeDashoffset="0" />
        </svg>
      )}
      {!loading && children}
    </button>
  );
};