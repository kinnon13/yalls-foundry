import { tokens } from '../tokens';

type BadgeProps = {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
};

export const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => {
  const variants = {
    default: { bg: tokens.color.surface[1], color: tokens.color.text.secondary },
    success: { bg: tokens.color.success, color: tokens.color.text.primary },
    warning: { bg: tokens.color.warning, color: tokens.color.bg.dark },
    danger: { bg: tokens.color.danger, color: tokens.color.text.primary },
  };

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        padding: `${tokens.space.xxs}px ${tokens.space.xs}px`,
        fontSize: tokens.typography.size.xs,
        fontWeight: tokens.typography.weight.medium,
        background: variants[variant].bg,
        color: variants[variant].color,
        borderRadius: tokens.radius.s,
      }}
    >
      {children}
    </span>
  );
};
