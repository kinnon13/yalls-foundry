import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { useEntityLookup } from '@/hooks/useEntityLookup';
import { EntityPreviewCard } from '@/components/EntityPreviewCard';

export const EntitySearchPanel = () => {
  const [query, setQuery] = useState('');
  const [previews, setPreviews] = useState<any[]>([]);
  const { loading, results, searchEntities, generatePreview } = useEntityLookup();

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    const searchResults = await searchEntities(query);
    
    // Generate previews for top results
    if (searchResults.length > 0) {
      const previewPromises = searchResults.slice(0, 3).map(result =>
        generatePreview(result.entity_type, result.entity_id)
      );
      const generatedPreviews = await Promise.all(previewPromises);
      setPreviews(generatedPreviews.filter(Boolean));
    }
  };

  const handleAction = async (action: string, entity: any) => {
    console.log('Action:', action, 'Entity:', entity);
    // Handle actions like claim, message, etc.
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Universal Entity Search
        </CardTitle>
        <CardDescription>
          Search across all profiles, horses, and businesses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search for a person, horse, or business..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              Found {results.length} result{results.length !== 1 ? 's' : ''}
            </h3>
            <div className="space-y-2">
              {previews.map((preview, index) => (
                <EntityPreviewCard
                  key={`${preview.type}-${preview.id}`}
                  entity={preview}
                  onAction={handleAction}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No results found for "{query}"
          </p>
        )}
      </CardContent>
    </Card>
  );
};
