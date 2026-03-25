// Created: 2026-02-13
// Last Updated: 2026-02-13

import { type ReactNode } from 'react';

type CardVariant = 'light' | 'dark' | 'glass';

interface CardProps {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  className?: string;
  children: ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  light: 'bg-surface-light text-content-primary',
  dark: 'bg-navy-800 text-content-inverse',
  glass: 'bg-navy-800/50 backdrop-blur-sm text-content-inverse border border-navy-700',
};

const paddingStyles: Record<'none' | 'sm' | 'md' | 'lg', string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  variant = 'light',
  padding = 'md',
  hover = false,
  className = '',
  children,
}: CardProps) {
  return (
    <div
      className={`
        rounded-card-lg
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${hover ? 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  className?: string;
  children: ReactNode;
}

export function CardHeader({ className = '', children }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  className?: string;
  children: ReactNode;
}

export function CardTitle({ as: Component = 'h3', className = '', children }: CardTitleProps) {
  return (
    <Component className={`text-heading-3 font-semibold ${className}`}>
      {children}
    </Component>
  );
}

interface CardContentProps {
  className?: string;
  children: ReactNode;
}

export function CardContent({ className = '', children }: CardContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  className?: string;
  children: ReactNode;
}

export function CardFooter({ className = '', children }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
}
