/**
 * Horses List Page
 * 
 * Browse all horses (entity_profiles with entity_type='horse')
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { entityProfileService } from '@/lib/profiles/entity-service';
import { Zap, Plus, Search } from 'lucide-react';
import { useState } from 'react';

export default function HorsesListPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: horses = [], isLoading } = useQuery({
    queryKey: ['horses', 'list'],
    queryFn: () => entityProfileService.list({ entity_type: 'horse', limit: 50 }),
  });

  const { data: searchResults = [], refetch: searchRefetch } = useQuery({
    queryKey: ['horses', 'search', searchTerm],
    queryFn: () => entityProfileService.search(searchTerm, { entity_type: 'horse', limit: 20 }),
    enabled: false,
  });

  const handleSearch = () => {
    if (searchTerm.trim()) {
      searchRefetch();
    }
  };

  const displayedHorses = searchTerm.trim() ? searchResults : horses;

  return (
    <>
      <GlobalHeader />
      <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8" />
            Horses
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse and manage horse profiles
          </p>
        </div>
        <Link to="/horses/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Horse
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search horses by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="max-w-md"
        />
        <Button onClick={handleSearch} variant="secondary" className="gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading horses...
        </div>
      ) : displayedHorses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No horses found matching your search.' : 'No horses yet. Create your first one!'}
            </p>
            {!searchTerm && (
              <Link to="/horses/create">
                <Button className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Horse
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayedHorses.map((horse) => (
            <Link key={horse.id} to={`/horses/${horse.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{horse.name}</span>
                    {horse.is_claimed && (
                      <Badge variant="secondary">Claimed</Badge>
                    )}
                  </CardTitle>
                  {horse.description && (
                    <CardDescription className="line-clamp-2">
                      {horse.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {horse.custom_fields && Object.keys(horse.custom_fields).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(horse.custom_fields).slice(0, 3).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="pt-2">
                      Created {new Date(horse.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      </div>
    </>
  );
}