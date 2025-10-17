import { tokens } from '../tokens';

type CardProps = {
  children: React.ReactNode;
  padding?: 's' | 'm' | 'l';
  className?: string;
};

export const Card = ({ children, padding = 'm', className = '' }: CardProps) => {
  const paddings = {
    s: tokens.space.s,
    m: tokens.space.m,
    l: tokens.space.l,
  };

  return (
    <div
      className={className}
      style={{
        background: tokens.color.surface[1],
        borderRadius: tokens.radius.l,
        padding: paddings[padding],
        border: `1px solid ${tokens.color.text.secondary}20`,
      }}
    >
      {children}
    </div>
  );
};
