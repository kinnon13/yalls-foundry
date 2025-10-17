/**
 * Section Component
 * Lightweight layout helper
 */

import { ReactNode } from 'react';

interface SectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, description, children, className = '' }: SectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div>
          {title && <h2 className="text-2xl font-bold">{title}</h2>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
