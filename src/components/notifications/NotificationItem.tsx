/**
 * Notification Item Component
 * Single notification with keyboard support
 */

import React from 'react';
import type { NotificationItem as NotificationItemType } from '@/ports/notifications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Props {
  notification: NotificationItemType;
  selected?: boolean;
  onToggleSelect?: () => void;
  onMarkRead?: () => void;
}

export function NotificationItem({ notification, selected, onToggleSelect, onMarkRead }: Props) {
  const navigate = useNavigate();
  const isUnread = !notification.read_at;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && notification.link) {
      navigate(notification.link);
    } else if (e.key === 'r' && isUnread && onMarkRead) {
      e.preventDefault();
      onMarkRead();
    } else if (e.key === ' ' && onToggleSelect) {
      e.preventDefault();
      onToggleSelect();
    }
  };

  return (
    <li
      role="listitem"
      className={`group relative rounded-lg border p-4 transition-colors ${
        isUnread ? 'bg-accent/20 border-primary/20' : 'bg-background border-border'
      } ${selected ? 'ring-2 ring-primary' : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start gap-3">
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="mt-1"
            aria-label={`Select ${notification.title}`}
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight">
              {notification.link ? (
                <a href={notification.link} className="hover:underline focus:outline-none focus:underline">
                  {notification.title}
                </a>
              ) : (
                notification.title
              )}
            </h3>
            {isUnread && (
              <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary" aria-label="Unread" />
            )}
          </div>
          
          {notification.body && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {notification.body}
            </p>
          )}
          
          <time
            className="mt-2 block text-xs text-muted-foreground"
            dateTime={notification.created_at}
          >
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </time>
        </div>

        {isUnread && onMarkRead && (
          <button
            onClick={onMarkRead}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 transition-opacity"
            aria-label="Mark as read"
          >
            Mark read
          </button>
        )}
      </div>
    </li>
  );
}
