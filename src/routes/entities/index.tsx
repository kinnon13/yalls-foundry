import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

type Entity = {
  id: string;
  kind: string;
  handle: string | null;
  display_name: string;
  status: 'unclaimed' | 'claimed' | 'verified';
  created_at: string;
  provenance: any;
};

export default function EntitiesList() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEntities();
  }, [kindFilter, statusFilter]);

  const fetchEntities = async () => {
    setLoading(true);
    
    let query = supabase
      .from('entities')
      .select('*')
      .order('created_at', { ascending: false });

    if (kindFilter !== 'all') {
      query = query.eq('kind', kindFilter as 'business' | 'horse' | 'person' | 'event');
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter as 'unclaimed' | 'claimed' | 'verified');
    }

    const { data, error } = await query;

    if (!error && data) {
      setEntities(data as Entity[]);
    }
    
    setLoading(false);
  };

  const filteredEntities = entities.filter((entity) =>
    entity.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entity.handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Entities</h1>
        <p className="text-muted-foreground">
          Browse and claim entities in the network
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name or handle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={kindFilter} onValueChange={setKindFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="horse">Horse</SelectItem>
                  <SelectItem value="person">Person</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unclaimed">Unclaimed</SelectItem>
                  <SelectItem value="claimed">Claimed</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : filteredEntities.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No entities found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredEntities.map((entity) => (
            <Link key={entity.id} to={`/entities/${entity.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">
                          {entity.display_name}
                        </h3>
                        {entity.handle && (
                          <span className="text-sm text-muted-foreground">
                            @{entity.handle}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Created {new Date(entity.created_at).toLocaleDateString()}</span>
                        {entity.provenance?.source && (
                          <>
                            <span>•</span>
                            <span>Source: {entity.provenance.source}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="capitalize">
                        {entity.kind}
                      </Badge>
                      <Badge
                        variant={
                          entity.status === 'verified'
                            ? 'default'
                            : entity.status === 'claimed'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="capitalize"
                      >
                        {entity.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
