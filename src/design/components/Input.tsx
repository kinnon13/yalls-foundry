import { tokens } from '../tokens';

type InputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'search';
  disabled?: boolean;
  className?: string;
};

export const Input = ({ value, onChange, placeholder, type = 'text', disabled, className = '' }: InputProps) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    className={className}
    style={{
      padding: `${tokens.space.s}px ${tokens.space.m}px`,
      fontSize: tokens.typography.size.m,
      fontWeight: tokens.typography.weight.regular,
      background: tokens.color.surface[1],
      color: tokens.color.text.primary,
      border: `1px solid ${tokens.color.text.secondary}`,
      borderRadius: tokens.radius.m,
      outline: 'none',
      transition: `all ${tokens.motion.duration.fast}ms`,
      width: '100%',
    }}
  />
);
