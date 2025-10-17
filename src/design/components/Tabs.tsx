import { tokens } from '../tokens';

type Tab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type TabsProps = {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
};

export const Tabs = ({ tabs, activeTab, onChange, className = '' }: TabsProps) => {
  return (
    <div className={className}>
      <div style={{ display: 'flex', gap: tokens.space.xs, borderBottom: `2px solid ${tokens.color.text.secondary}40` }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: `${tokens.space.s}px ${tokens.space.m}px`,
              fontSize: tokens.typography.size.m,
              fontWeight: activeTab === tab.id ? tokens.typography.weight.bold : tokens.typography.weight.regular,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? `2px solid ${tokens.color.brand}` : '2px solid transparent',
              color: activeTab === tab.id ? tokens.color.text.primary : tokens.color.text.secondary,
              cursor: 'pointer',
              transition: `all ${tokens.motion.duration.fast}ms`,
              marginBottom: '-2px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ marginTop: tokens.space.m }}>
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
};
