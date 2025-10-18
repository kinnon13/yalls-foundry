/**
 * Stub Backlog Admin View
 * Shows all auto-generated stubs awaiting full implementation
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect } from 'react';

interface StubFeature {
  id: string;
  area: string;
  title: string;
  status: 'stub';
  routes: string[];
  rpc: string[];
  tables: string[];
  flag: 'on' | 'off';
  owner: string;
  notes: string;
}

export default function StubBacklog() {
  const [stubs, setStubs] = useState<StubFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaFilter, setAreaFilter] = useState<string>('all');

  useEffect(() => {
    loadStubs();
  }, []);

  async function loadStubs() {
    try {
      const response = await fetch('/catalog/autogen.backfill.json');
      if (!response.ok) {
        console.warn('No backfill file found - run catalog-backfill.mjs');
        setStubs([]);
        return;
      }
      const data = await response.json();
      setStubs(data.features || []);
    } catch (err) {
      console.error('Failed to load stubs:', err);
      setStubs([]);
    } finally {
      setLoading(false);
    }
  }

  const areas = Array.from(new Set(stubs.map(s => s.area)));
  const filteredStubs = areaFilter === 'all' 
    ? stubs 
    : stubs.filter(s => s.area === areaFilter);

  const groupedByArea = filteredStubs.reduce((acc, stub) => {
    if (!acc[stub.area]) acc[stub.area] = [];
    acc[stub.area].push(stub);
    return acc;
  }, {} as Record<string, StubFeature[]>);

  if (loading) {
    return <div className="p-8">Loading stub backlog...</div>;
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stub Backlog</h1>
          <p className="text-muted-foreground mt-2">
            Auto-generated stubs awaiting full implementation
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {stubs.length} stubs
        </Badge>
      </div>

      {stubs.length === 0 ? (
        <Alert>
          <AlertDescription>
            ✅ No stubs found! Either everything is fully implemented or the backfill script hasn't run yet.
            <br />
            <br />
            Run: <code className="text-sm bg-muted px-2 py-1 rounded">node scripts/catalog-backfill.mjs</code>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={areaFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setAreaFilter('all')}
            >
              All ({stubs.length})
            </Button>
            {areas.map(area => (
              <Button
                key={area}
                size="sm"
                variant={areaFilter === area ? 'default' : 'outline'}
                onClick={() => setAreaFilter(area)}
              >
                {area} ({stubs.filter(s => s.area === area).length})
              </Button>
            ))}
          </div>

          <div className="space-y-6">
            {Object.entries(groupedByArea).map(([area, areaStubs]) => (
              <Card key={area}>
                <CardHeader>
                  <CardTitle className="capitalize">{area}</CardTitle>
                  <CardDescription>{areaStubs.length} stubs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {areaStubs.map(stub => (
                      <div 
                        key={stub.id} 
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{stub.title}</h3>
                            <p className="text-sm text-muted-foreground">{stub.id}</p>
                          </div>
                          <Badge variant={stub.flag === 'on' ? 'default' : 'secondary'}>
                            {stub.flag === 'on' ? '🟢 ON' : '⚫ OFF'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {stub.routes.length > 0 && (
                            <div>
                              <span className="font-medium">Routes:</span>
                              <ul className="text-muted-foreground">
                                {stub.routes.map(r => <li key={r}>{r}</li>)}
                              </ul>
                            </div>
                          )}
                          {stub.rpc.length > 0 && (
                            <div>
                              <span className="font-medium">RPCs:</span>
                              <ul className="text-muted-foreground">
                                {stub.rpc.map(r => <li key={r}>{r}</li>)}
                              </ul>
                            </div>
                          )}
                          {stub.tables.length > 0 && (
                            <div>
                              <span className="font-medium">Tables:</span>
                              <ul className="text-muted-foreground">
                                {stub.tables.map(t => <li key={t}>{t}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>

                        {stub.notes && (
                          <p className="text-sm text-muted-foreground italic">
                            {stub.notes}
                          </p>
                        )}

                        <div className="text-sm">
                          <span className="font-medium">Owner:</span> {stub.owner}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
