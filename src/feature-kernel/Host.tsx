/**
 * Feature Host
 * 
 * Mounts features by ?f= with isolation + boundaries
 */

import { Suspense, useMemo, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { FeatureErrorBoundary } from './ErrorBoundary';
import { featureRegistry } from './registry';
import type { FeatureProps } from './types';

function tryParse(v: string): unknown {
  if (v.length > 1000) return v; // Cap size to prevent DoS
  try {
    const parsed = JSON.parse(v);
    if (parsed && typeof parsed === 'object') {
      // Shallow clone to avoid prototype pollution
      return Object.assign({}, parsed);
    }
    return parsed;
  } catch {
    return v;
  }
}

function UnknownFeature({ id }: { id: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">
          Unknown feature: <span className="font-mono">{id}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-3"></div>
          <div className="h-4 bg-muted rounded w-full mb-2"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FeatureHost() {
  const [sp, setSp] = useSearchParams();
  const ids = (sp.get('f') ?? '').split(',').filter(Boolean);

  const updateFeatureProps = (featureId: string, updates: Partial<FeatureProps>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(updates)) {
      const key = `fx.${featureId}.${k}`;
      if (v === null || v === undefined) {
        next.delete(key);
      } else {
        next.set(key, typeof v === 'string' ? v : JSON.stringify(v));
      }
    }
    setSp(next);
  };

  const closeFeature = (featureId: string) => {
    const next = new URLSearchParams(sp);
    const list = (next.get('f') ?? '').split(',').filter(id => id !== featureId);
    if (list.length === 0) {
      next.delete('f');
    } else {
      next.set('f', list.join(','));
    }
    
    // Remove all fx.* props for this feature
    const keysToDelete: string[] = [];
    next.forEach((_, key) => {
      if (key.startsWith(`fx.${featureId}.`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => next.delete(key));
    
    setSp(next);
  };

  const nodes = useMemo(() => {
    return ids.map((id) => {
      const def = featureRegistry[id];
      if (!def) {
        return <UnknownFeature key={id} id={id} />;
      }

      // Gather fx.<id>.* props from the URL and validate
      const raw: Record<string, unknown> = {};
      sp.forEach((v, k) => {
        const prefix = `fx.${id}.`;
        if (k.startsWith(prefix)) {
          raw[k.slice(prefix.length)] = tryParse(v);
        }
      });

      const parseResult = def.schema.safeParse(raw);
      const props = parseResult.success
        ? { ...def.defaults, ...parseResult.data }
        : def.defaults ?? {};

      const LazyFeature = lazy(def.loader);

      return (
        <FeatureErrorBoundary key={`${id}:${def.version}`} featureId={id}>
          <Suspense fallback={<FeatureSkeleton title={def.title} />}>
            <LazyFeature
              {...props}
              featureId={id}
              updateProps={(updates: Partial<FeatureProps>) => updateFeatureProps(id, updates)}
              close={() => closeFeature(id)}
            />
          </Suspense>
        </FeatureErrorBoundary>
      );
    });
  }, [ids, sp]);

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="mb-2">No features active</p>
        <p className="text-sm">Use the sidebar to add features to your dashboard</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {nodes}
    </div>
  );
}
