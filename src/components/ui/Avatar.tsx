// Created: 2026-02-13
// Last Updated: 2026-02-13

import { User } from 'lucide-react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-caption',
  sm: 'w-8 h-8 text-body-sm',
  md: 'w-10 h-10 text-body',
  lg: 'w-12 h-12 text-body-lg',
  xl: 'w-16 h-16 text-heading-3',
};

const iconSizes: Record<AvatarSize, number> = {
  xs: 12,
  sm: 14,
  md: 18,
  lg: 22,
  xl: 28,
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  src,
  alt = 'User avatar',
  name,
  size = 'md',
  className = '',
}: AvatarProps) {
  const hasImage = src && src.trim() !== '';
  const hasName = name && name.trim() !== '';

  if (hasImage) {
    return (
      <img
        src={src}
        alt={alt}
        className={`
          ${sizeStyles[size]}
          rounded-full object-cover
          ring-2 ring-navy-700
          ${className}
        `}
      />
    );
  }

  if (hasName) {
    const initials = getInitials(name);
    const bgColor = stringToColor(name);

    return (
      <div
        className={`
          ${sizeStyles[size]}
          ${bgColor}
          rounded-full
          flex items-center justify-center
          text-white font-medium
          ring-2 ring-navy-700
          ${className}
        `}
        title={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`
        ${sizeStyles[size]}
        bg-navy-700
        rounded-full
        flex items-center justify-center
        text-content-muted
        ring-2 ring-navy-600
        ${className}
      `}
    >
      <User size={iconSizes[size]} />
    </div>
  );
}

interface AvatarGroupProps {
  avatars: Array<{ src?: string | null; name?: string }>;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = 'sm',
  className = '',
}: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          size={size}
          className="border-2 border-navy-900"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={`
            ${sizeStyles[size]}
            bg-navy-700
            rounded-full
            flex items-center justify-center
            text-content-inverse text-caption font-medium
            border-2 border-navy-900
          `}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
