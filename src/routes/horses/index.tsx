/**
 * Horses Listing Page
 * 
 * Browse and filter horses with search facets.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEOHelmet } from '@/lib/seo/helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { entityProfileService } from '@/lib/profiles/entity-service';
import type { BaseProfile } from '@/entities/profile';
import type { HorseFields } from '@/entities/horse';
import { Search, Plus, Sparkles } from 'lucide-react';
import { useSession } from '@/lib/auth/context';

export default function HorsesIndex() {
  const { session } = useSession();
  const [horses, setHorses] = useState<BaseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadHorses();
  }, []);

  const loadHorses = async () => {
    setLoading(true);
    try {
      const results = await entityProfileService.list({
        type: 'horse',
        limit: 50,
      });
      setHorses(results);
    } catch (error) {
      console.error('Failed to load horses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadHorses();
      return;
    }

    setLoading(true);
    try {
      const results = await entityProfileService.search(searchQuery, 'horse', 20);
      setHorses(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseHorseFields = (customFields: any): HorseFields => {
    return customFields as HorseFields;
  };

  return (
    <>
      <SEOHelmet
        title="Horses"
        description="Browse horses, stallions, mares, and foals. Search by breed, discipline, and more."
      />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Sparkles className="h-8 w-8" />
                Horses
              </h1>
              <p className="text-muted-foreground">
                Browse {horses.length} horses in the registry
              </p>
            </div>
            {session && (
              <Link to="/horses/create">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Horse
                </Button>
              </Link>
            )}
          </div>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Horses
              </CardTitle>
              <CardDescription>
                Search by name, breed, or discipline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Search horses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Horse Grid */}
          {loading ? (
            <div className="text-center p-12">
              <p className="text-muted-foreground">Loading horses...</p>
            </div>
          ) : horses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  No horses found. {session && 'Be the first to add one!'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {horses.map((horse) => {
                const fields = parseHorseFields(horse.custom_fields);
                return (
                  <Link key={horse.id} to={`/horses/${horse.id}`}>
                    <Card className="hover:border-primary transition-colors h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{horse.name}</span>
                          {!horse.is_claimed && (
                            <Badge variant="outline" className="text-xs">
                              Unclaimed
                            </Badge>
                          )}
                        </CardTitle>
                        {fields.breed && (
                          <CardDescription>{fields.breed}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {fields.sex && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Sex:</span>
                            <span>{fields.sex}</span>
                          </div>
                        )}
                        {fields.dob && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Born:</span>
                            <span>{fields.dob}</span>
                          </div>
                        )}
                        {fields.discipline && fields.discipline.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {fields.discipline.map((d) => (
                              <Badge key={d} variant="secondary" className="text-xs">
                                {d}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
