import React from 'react';
import { cn } from '../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={cn(
        'relative px-8 py-3 rounded font-mono transition-all duration-300 overflow-hidden group',
        variant === 'primary'
          ? 'bg-[#0F0]/20 text-[#0F0] hover:bg-[#0F0]/30 border border-[#0F0]/50'
          : 'bg-black/50 text-white hover:bg-black/70 border border-white/20',
        'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-[#0F0]/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
