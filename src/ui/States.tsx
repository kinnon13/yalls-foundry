/**
 * Universal UI States
 * Skeleton, Empty, Error
 */

import React from 'react';

export const Skeleton = ({ rows = 4 }: { rows?: number }) => (
  <div aria-busy className="animate-pulse space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-4 rounded bg-muted" />
    ))}
  </div>
);

export const EmptyState = ({ 
  title, 
  action 
}: { 
  title: string; 
  action?: React.ReactNode 
}) => (
  <div role="status" className="text-center p-8 text-muted-foreground">
    {title}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { error?: Error }
> {
  state = { error: undefined as Error | undefined };
  
  static getDerivedStateFromError(e: Error) {
    return { error: e };
  }
  
  render() {
    return this.state.error ? (
      <div role="alert" className="p-4 border border-destructive rounded-lg">
        <h3 className="font-semibold text-destructive">Something went wrong</h3>
        <code className="text-xs mt-2 block">{this.state.error.message}</code>
      </div>
    ) : (
      this.props.children
    );
  }
}
