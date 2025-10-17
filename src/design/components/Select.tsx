import { tokens } from '../tokens';

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export const Select = ({ value, onChange, options, placeholder, disabled, className = '' }: SelectProps) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
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
      cursor: 'pointer',
      width: '100%',
    }}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);
