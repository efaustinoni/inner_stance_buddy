// Created: 2026-02-13
// Last Updated: 2026-02-13

import { type ReactNode } from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'gold';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  pill?: boolean;
  className?: string;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-content-secondary',
  primary: 'bg-accent-blue text-white',
  success: 'bg-status-success text-white',
  warning: 'bg-status-warning text-white',
  error: 'bg-status-error text-white',
  gold: 'bg-accent-gold text-white',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-caption',
  md: 'px-2.5 py-1 text-body-sm',
};

export function Badge({
  variant = 'default',
  size = 'sm',
  pill = true,
  className = '',
  children,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center justify-center font-medium
        ${pill ? 'rounded-pill' : 'rounded-md'}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  className?: string;
}

export function NotificationBadge({
  count,
  maxCount = 99,
  className = '',
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count;

  return (
    <span
      className={`
        absolute -top-1 -right-1
        min-w-5 h-5 px-1.5
        flex items-center justify-center
        bg-status-error text-white text-caption font-medium
        rounded-pill
        ${className}
      `}
    >
      {displayCount}
    </span>
  );
}

interface StatusDotProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

const statusColors: Record<StatusDotProps['status'], string> = {
  online: 'bg-status-success',
  offline: 'bg-gray-400',
  busy: 'bg-status-error',
  away: 'bg-status-warning',
};

export function StatusDot({ status, className = '' }: StatusDotProps) {
  return (
    <span
      className={`
        inline-block w-2.5 h-2.5 rounded-full
        ${statusColors[status]}
        ${status === 'online' ? 'animate-pulse-slow' : ''}
        ${className}
      `}
    />
  );
}
