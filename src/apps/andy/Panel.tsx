import type { AppUnitProps } from '@/apps/types';

export default function AndyPanel({}: AppUnitProps) {
  return (
    <div data-testid="panel-andy" className="p-3">
      <h3 className="text-sm font-semibold mb-2">Super Andy</h3>
      <div className="text-xs text-muted-foreground mb-3">Quick actions</div>
      <div className="grid gap-2">
        <button 
          className="px-3 py-2 rounded text-xs bg-muted hover:bg-muted/80 transition-colors"
          onClick={() => window.dispatchEvent(new CustomEvent('rocker:action', { 
            detail: { action: { kind: 'open-app', app: 'andy' }} 
          }))}
        >
          Open Chat
        </button>
        <button 
          className="px-3 py-2 rounded text-xs bg-muted hover:bg-muted/80 transition-colors"
          onClick={() => window.dispatchEvent(new CustomEvent('rocker:action', { 
            detail: { action: { kind: 'search-yallbrary', query: 'halter' }} 
          }))}
        >
          Search Yallbrary: "halter"
        </button>
      </div>
    </div>
  );
}
