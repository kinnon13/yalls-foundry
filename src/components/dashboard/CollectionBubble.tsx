import { Folder } from 'lucide-react';
import './AppBubble.css';

type CollectionBubbleProps = {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  itemCount: number;
  onClick: () => void;
  className?: string;
};

export function CollectionBubble({
  name,
  emoji,
  color,
  itemCount,
  onClick,
  className,
}: CollectionBubbleProps) {
  const style = color ? { ['--bubble-accent' as any]: color } : {};

  return (
    <button
      onClick={onClick}
      className={`app-bubble ${className ?? ''}`}
      style={style}
      aria-label={`Open ${name} collection`}
    >
      <div className="app-bubble__inner">
        <div className="app-bubble__icon" aria-hidden>
          {emoji || <Folder size={24} />}
        </div>
        <div>
          <div className="app-bubble__title">{name}</div>
          <div className="app-bubble__meta">{itemCount} items</div>
        </div>
      </div>
      {itemCount > 0 && (
        <div className="app-bubble__badge" aria-label={`${itemCount} items`}>
          {itemCount > 99 ? '99+' : itemCount}
        </div>
      )}
    </button>
  );
}
