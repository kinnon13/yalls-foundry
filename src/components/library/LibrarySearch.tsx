/**
 * Library Search Component
 * Search across entities, apps, and actions
 */

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { libraryRegistry } from '@/library/registry';
import { usePinboard } from '@/library/pinboard';
import { useContextManager } from '@/kernel/context-manager';

export function LibrarySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(libraryRegistry.getAll());
  const { pin } = usePinboard();
  const { activeType, activeId } = useContextManager();

  const handleSearch = (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults(libraryRegistry.getAll());
      return;
    }
    setResults(libraryRegistry.search(q));
  };

  const handlePin = (appId: string) => {
    pin(appId, activeType, activeId || 'home');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search apps, actions, entities..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {results.map((entry) => (
          <div
            key={entry.contract.id}
            className="p-3 border rounded-lg hover:bg-accent cursor-pointer flex items-start justify-between"
            onClick={() => handlePin(entry.contract.id)}
          >
            <div className="flex-1">
              <h3 className="font-medium">{entry.contract.name}</h3>
              <p className="text-sm text-muted-foreground">{entry.contract.description}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {entry.contract.intents.slice(0, 3).map((intent) => (
                  <span key={intent} className="text-xs px-2 py-0.5 bg-secondary rounded">
                    {intent}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No results found for "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
