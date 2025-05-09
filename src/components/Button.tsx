import React from 'react';
import { cn } from '../utils/cn';

type ElementType = keyof JSX.IntrinsicElements;

interface BaseProps {
  variant?: 'primary' | 'secondary' | 'destructive' | 'success';
  as?: ElementType;
  children: React.ReactNode;
  className?: string;
}

type PolymorphicProps<T extends ElementType> = BaseProps &
  Omit<React.ComponentPropsWithoutRef<T>, keyof BaseProps> & {
    as?: T;
  };

const variantClasses: Record<NonNullable<BaseProps['variant']>, string> = {
  primary:
    'bg-[#0F0]/20 text-[#0F0] hover:bg-[#0F0]/30 border border-[#0F0]/50',
  secondary:
    'bg-black/50 text-white hover:bg-black/70 border border-white/20',
  destructive:
    'bg-red-500/20 text-red-500 hover:bg-red-500/40 border border-red-500/50',
  success:
    'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/40 border border-emerald-500/50',
};

const Button = <T extends ElementType = 'button'>({
  as,
  variant = 'primary',
  className,
  children,
  ...props
}: PolymorphicProps<T>) => {
  const Component = as || 'button';

  return (
    <Component
      className={cn(
        'relative px-8 py-3 rounded font-mono transition-all duration-300 overflow-hidden group cursor-pointer',
        variantClasses[variant],
        'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Button;
