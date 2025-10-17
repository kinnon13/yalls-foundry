/**
 * ProfileChip - Compact user/entity avatar + name
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ProfileChipProps {
  name: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: { avatar: 'h-6 w-6', text: 'text-xs' },
  md: { avatar: 'h-8 w-8', text: 'text-sm' },
  lg: { avatar: 'h-10 w-10', text: 'text-base' },
};

export function ProfileChip({ 
  name, 
  avatar, 
  size = 'md', 
  className,
  onClick 
}: ProfileChipProps) {
  const sizes = sizeClasses[size];
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2',
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      <Avatar className={sizes.avatar}>
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback className="text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className={cn('font-medium', sizes.text)}>{name}</span>
    </div>
  );
}
