import { tokens } from '../tokens';

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 's' | 'm' | 'l';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

export const Button = ({ children, variant = 'primary', size = 'm', onClick, disabled, className = '' }: ButtonProps) => {
  const baseStyles = `
    font-family: system-ui, -apple-system, sans-serif;
    font-weight: ${tokens.typography.weight.medium};
    border: none;
    cursor: pointer;
    transition: all ${tokens.motion.duration.fast}ms;
    border-radius: ${tokens.radius.m}px;
  `;

  const variants = {
    primary: `background: ${tokens.color.brand}; color: ${tokens.color.text.primary};`,
    secondary: `background: ${tokens.color.surface[1]}; color: ${tokens.color.text.primary}; border: 1px solid ${tokens.color.text.secondary};`,
    ghost: `background: transparent; color: ${tokens.color.text.secondary};`,
  };

  const sizes = {
    s: `padding: ${tokens.space.xs}px ${tokens.space.s}px; font-size: ${tokens.typography.size.s}px;`,
    m: `padding: ${tokens.space.s}px ${tokens.space.m}px; font-size: ${tokens.typography.size.m}px;`,
    l: `padding: ${tokens.space.m}px ${tokens.space.l}px; font-size: ${tokens.typography.size.l}px;`,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        ...Object.fromEntries(baseStyles.split(';').filter(s => s.trim()).map(s => s.split(':').map(p => p.trim()))),
        ...Object.fromEntries(variants[variant].split(';').filter(s => s.trim()).map(s => s.split(':').map(p => p.trim()))),
        ...Object.fromEntries(sizes[size].split(';').filter(s => s.trim()).map(s => s.split(':').map(p => p.trim()))),
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
};
