import { tokens } from '../tokens';

type Column<T> = {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  className?: string;
};

export const Table = <T,>({ columns, data, keyField, className = '' }: TableProps<T>) => {
  return (
    <table
      className={className}
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: tokens.typography.size.s,
      }}
    >
      <thead>
        <tr style={{ borderBottom: `1px solid ${tokens.color.text.secondary}40` }}>
          {columns.map((col) => (
            <th
              key={String(col.key)}
              style={{
                padding: `${tokens.space.s}px ${tokens.space.m}px`,
                textAlign: 'left',
                fontWeight: tokens.typography.weight.bold,
                color: tokens.color.text.secondary,
              }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={String(row[keyField])} style={{ borderBottom: `1px solid ${tokens.color.text.secondary}20` }}>
            {columns.map((col) => (
              <td
                key={String(col.key)}
                style={{
                  padding: `${tokens.space.s}px ${tokens.space.m}px`,
                  color: tokens.color.text.primary,
                }}
              >
                {col.render ? col.render(row[col.key], row) : String(row[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
