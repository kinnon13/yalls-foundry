import { useInfiniteQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Building2, Heart, Package, User, Search, Zap, Loader2, LucideIcon, RefreshCw } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';
import { syncUnknownsToEntities } from '@/lib/ai/rocker/learning';
import { useToast } from '@/hooks/use-toast';
import { useAdminCheck } from '@/hooks/useAdminCheck';

// Dynamic entity type configuration - add new types here and they auto-appear
interface EntityConfig {
  type: string;
  label: string;
  icon: LucideIcon;
  table: string;
  nameField: string;
  descriptionField: string | ((item: any) => string);
  unclaimedFilter: Record<string, any>;
  routeTemplate: string;
  pageSize: number;
}

const ENTITY_CONFIGS: EntityConfig[] = [
  {
    type: 'profiles',
    label: 'Profiles',
    icon: User,
    table: 'entity_profiles',
    nameField: 'name',
    descriptionField: 'entity_type',
    unclaimedFilter: { claimed_by: null },
    routeTemplate: '/profile',
    pageSize: 20,
  },
  {
    type: 'businesses',
    label: 'Businesses',
    icon: Building2,
    table: 'businesses',
    nameField: 'name',
    descriptionField: 'description',
    unclaimedFilter: { owner_id: null },
    routeTemplate: '/business/:id/hub',
    pageSize: 20,
  },
];

export default function UnclaimedEntitiesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAdminCheck();

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle sync unknowns to entities (admin only, auto-refreshes)
  const handleSync = async () => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can sync entities',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSyncing(true);
    try {
      const result = await syncUnknownsToEntities();
      if (result) {
        toast({
          title: 'Sync Complete',
          description: `Created ${result.created} entities, skipped ${result.skipped}`,
        });
        
        // Auto-refresh all queries after sync
        await Promise.all(entityQueries.map(({ query }) => query.refetch()));
      } else {
        toast({
          title: 'Sync Failed',
          description: 'Failed to sync unknowns to entities',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Error',
        description: 'An error occurred during sync',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Dynamic entity fetcher with infinite scroll (optimized with keyset pagination)
  const useEntityQuery = (config: EntityConfig) => {
    return useInfiniteQuery({
      queryKey: ['entities', 'unclaimed', config.type, debouncedSearch],
      queryFn: async ({ pageParam }) => {
        // Project only needed columns instead of SELECT *
        const selectFields = `id, ${config.nameField}, created_at${
          typeof config.descriptionField === 'string' ? `, ${config.descriptionField}` : ''
        }`;

        let query = supabase
          .from(config.table as any)
          .select(selectFields, { count: 'planned' }) // Use 'planned' instead of 'exact' for better performance
          .limit(config.pageSize)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false }); // Composite sort for stable keyset pagination

        // Keyset pagination: filter by last seen timestamp + id
        if (pageParam) {
          query = query.lt('created_at', pageParam.created_at)
            .neq('id', pageParam.id);
        }

        // Apply unclaimed filters dynamically
        Object.entries(config.unclaimedFilter).forEach(([key, value]) => {
          if (value === null) {
            query = query.is(key, null);
          } else if (value === false) {
            query = query.eq(key, false);
          } else {
            query = query.eq(key, value);
          }
        });

        // Apply search filter if present (uses trigram index)
        if (debouncedSearch) {
          query = query.ilike(config.nameField, `%${debouncedSearch}%`);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        
        const lastItem = data && data.length > 0 && data.length === config.pageSize ? data[data.length - 1] : null;
        
        return {
          data: data || [],
          count: count || 0,
          nextCursor: lastItem && 'created_at' in lastItem && 'id' in lastItem 
            ? { created_at: lastItem.created_at as string, id: lastItem.id as string } 
            : undefined,
        };
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: null as { created_at: string; id: string } | null,
    });
  };

  // Fetch all entity types dynamically
  const entityQueries = ENTITY_CONFIGS.map(config => ({
    config,
    query: useEntityQuery(config),
  }));

  // Flatten paginated results
  const entities = useMemo(() => {
    return entityQueries.map(({ config, query }) => ({
      config,
      items: query.data?.pages.flatMap(page => page.data) || [],
      totalCount: query.data?.pages[0]?.count || 0,
      isLoading: query.isLoading,
      isFetchingNextPage: query.isFetchingNextPage,
      hasNextPage: query.hasNextPage,
      fetchNextPage: query.fetchNextPage,
    }));
  }, [entityQueries.map(eq => eq.query.data).join(',')]);

  const totalCount = entities.reduce((sum, e) => sum + e.totalCount, 0);
  const isAnyLoading = entities.some(e => e.isLoading);

  // Render entity card helper
  const renderEntityCard = (item: any, config: EntityConfig) => {
    const description = typeof config.descriptionField === 'function' 
      ? config.descriptionField(item) 
      : item[config.descriptionField];
    
    const route = config.routeTemplate.replace(':id', item.id);

    return (
      <Card key={item.id} className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{item[config.nameField]}</CardTitle>
              <CardDescription>{description || 'No description'}</CardDescription>
            </div>
            <Badge variant="outline">Unclaimed</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button 
            size="sm" 
            className="w-full gap-2"
            onClick={() => navigate(route)}
          >
            <Zap className="h-4 w-4" />
            Claim
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Render entity section helper
  const renderEntitySection = (entityData: typeof entities[0], showHeader = true) => {
    const Icon = entityData.config.icon;
    
    if (entityData.items.length === 0 && !entityData.isLoading) {
      return null;
    }

    return (
      <div key={entityData.config.type}>
        {showHeader && (
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {entityData.config.label}
          </h3>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entityData.items.map((item) => renderEntityCard(item, entityData.config))}
        </div>
        {entityData.isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    );
  };

  // Infinite scroll trigger for active tab (debounced)
  const { ref: loadMoreRef, inView } = useInView();
  const activeEntity = entities.find(e => e.config.type === activeTab);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inView && activeEntity?.hasNextPage && !activeEntity?.isFetchingNextPage) {
        activeEntity.fetchNextPage();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [inView, activeEntity?.hasNextPage, activeEntity?.isFetchingNextPage]);

  if (isAnyLoading && entities.every(e => e.items.length === 0)) {
    return (
      <div className="container mx-auto py-8 space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Unclaimed Entities</h1>
        <p className="text-muted-foreground">
          Entities discovered by the platform that haven't been claimed yet.
          Claim them to manage and update their information.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search unclaimed entities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        {isAdmin && (
          <Button 
            onClick={handleSync} 
            disabled={isSyncing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync from Knowledge Base'}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All ({totalCount})
          </TabsTrigger>
          {entities.map(({ config, totalCount }) => {
            const Icon = config.icon;
            return (
              <TabsTrigger key={config.type} value={config.type}>
                <Icon className="h-4 w-4 mr-2" />
                {config.label} ({totalCount})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {totalCount === 0 && !isAnyLoading && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No unclaimed entities found
              </CardContent>
            </Card>
          )}

          {entities.map((entityData) => renderEntitySection(entityData, true))}
          
          {entities.some(e => e.hasNextPage) && (
            <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </TabsContent>

        {entities.map((entityData) => (
          <TabsContent key={entityData.config.type} value={entityData.config.type}>
            {entityData.items.length === 0 && !entityData.isLoading ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No unclaimed {entityData.config.label.toLowerCase()} found
                </CardContent>
              </Card>
            ) : (
              <>
                {renderEntitySection(entityData, false)}
                {entityData.hasNextPage && (
                  <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
