/**
 * Context-aware kernel utilities
 * Helpers for opening features with context props and managing connections
 */

import { supabase } from '@/integrations/supabase/client';

export type ContextFeatureProps = Record<string, {
  horse?: string;
  program?: string;
  mode?: string;
  project?: string;
  role?: string;
  [key: string]: any;
}>;

/**
 * Open features with context props via URL params
 * 
 * @example
 * // Open incentives kernel with horse context
 * openFeaturesViaURL({
 *   features: ['incentives'],
 *   props: { 
 *     incentives: { horse: horseId, mode: 'nominate' }
 *   }
 * })
 * 
 * @example
 * // Open work_packages kernel for plumber
 * openFeaturesViaURL({
 *   features: ['work_packages'],
 *   props: {
 *     work_packages: { project: projectId, role: 'plumber' }
 *   }
 * })
 */
export function openFeaturesViaURL(options: {
  features: string[];
  props?: ContextFeatureProps;
  returnTo?: string;
}) {
  const params = new URLSearchParams(window.location.search);
  
  // Set active features
  params.set('f', options.features.join(','));
  
  // Set feature-specific props
  if (options.props) {
    for (const [featureId, featureProps] of Object.entries(options.props)) {
      for (const [key, value] of Object.entries(featureProps)) {
        params.set(`fx.${featureId}.${key}`, String(value));
      }
    }
  }
  
  // Set return URL if provided
  if (options.returnTo) {
    params.set('return_to', options.returnTo);
  }
  
  // Navigate
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState({}, '', newUrl);
  
  // Trigger a custom event for feature host to react
  window.dispatchEvent(new CustomEvent('features-updated'));
}

/**
 * Create a connection between entities
 * Used for follows, assignments, ownership tracking
 */
export async function createConnection(options: {
  subjectType: 'user' | 'entity' | 'horse' | 'profile';
  subjectId: string;
  relation: 'follows' | 'owns' | 'assigned' | 'member' | 'invited';
  objectType: 'incentive' | 'horse' | 'project' | 'page' | 'entity' | 'event' | 'listing' | 'work_package';
  objectId: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
}) {
  const { data, error } = await supabase
    .from('connections')
    .insert({
      subject_type: options.subjectType,
      subject_id: options.subjectId,
      relation: options.relation,
      object_type: options.objectType,
      object_id: options.objectId,
      metadata: options.metadata || {},
      expires_at: options.expiresAt,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove a connection
 */
export async function removeConnection(options: {
  subjectType: string;
  subjectId: string;
  relation: string;
  objectType: string;
  objectId: string;
}) {
  const { error } = await supabase
    .from('connections')
    .delete()
    .match({
      subject_type: options.subjectType,
      subject_id: options.subjectId,
      relation: options.relation,
      object_type: options.objectType,
      object_id: options.objectId,
    });

  if (error) throw error;
}

/**
 * Get connection-driven kernels for current user
 * Returns kernels that should be auto-mounted based on user's connections
 */
export async function getUserConnectionKernels() {
  const { data, error } = await supabase.rpc('get_user_connection_kernels');
  
  if (error) throw error;
  return data as Array<{
    kernel_type: string;
    object_id: string;
    context_data: Record<string, any>;
    priority: number;
    source: string;
  }>;
}

/**
 * Check if user can perform action on incentive/horse pair
 */
export async function hasIncentiveAction(options: {
  userId: string;
  horseId: string;
  incentiveId: string;
}) {
  const { data, error } = await supabase.rpc('has_incentive_action', {
    p_user_id: options.userId,
    p_horse_id: options.horseId,
    p_incentive_id: options.incentiveId,
  });
  
  if (error) throw error;
  return data as boolean;
}

/**
 * Nominate a horse for an incentive
 */
export async function nominateHorse(options: {
  horseId: string;
  incentiveId: string;
  metadata?: Record<string, any>;
}) {
  const { data, error } = await supabase.rpc('incentive_nominate', {
    p_horse_id: options.horseId,
    p_incentive_id: options.incentiveId,
    p_metadata: options.metadata || {},
  });
  
  if (error) {
    if (error.message.includes('not_entitled_or_ineligible')) {
      throw new Error('You are not entitled to perform this action or the horse is not eligible');
    }
    throw error;
  }
  
  return data as string; // nomination_id
}

/**
 * Parse feature props from URL params
 * Extracts fx.{featureId}.{key} params into structured object
 */
export function parseFeaturePropsFromURL(featureId: string): Record<string, any> {
  const params = new URLSearchParams(window.location.search);
  const props: Record<string, any> = {};
  const prefix = `fx.${featureId}.`;
  
  for (const [key, value] of params.entries()) {
    if (key.startsWith(prefix)) {
      const propKey = key.slice(prefix.length);
      props[propKey] = value;
    }
  }
  
  return props;
}

/**
 * Deep link builder for sharing context-aware features
 * 
 * @example
 * // Share incentive nomination link
 * const link = buildDeepLink({
 *   feature: 'incentives',
 *   props: { horse: horseId, program: programId, mode: 'nominate' },
 *   returnTo: '/dashboard?m=horses'
 * })
 */
export function buildDeepLink(options: {
  feature: string;
  props?: Record<string, any>;
  returnTo?: string;
}): string {
  const url = new URL(window.location.origin + '/dashboard');
  url.searchParams.set('f', options.feature);
  
  if (options.props) {
    for (const [key, value] of Object.entries(options.props)) {
      url.searchParams.set(`fx.${options.feature}.${key}`, String(value));
    }
  }
  
  if (options.returnTo) {
    url.searchParams.set('return_to', options.returnTo);
  }
  
  return url.toString();
}

/**
 * Kernel type registry - maps kernel_type to feature configuration
 */
export const contextKernelTypes = {
  incentive_entry: {
    featureId: 'incentives',
    propMap: (ctx: Record<string, any>) => ({
      program: ctx.class_id,
      horse: ctx.horse_id,
      mode: 'enter' as const,
    }),
  },
  team_workspace: {
    featureId: 'work_packages',
    propMap: (ctx: Record<string, any>) => ({
      project: ctx.business_id,
      role: ctx.role,
      range: 'week' as const,
    }),
  },
} as const;

export type KernelType = keyof typeof contextKernelTypes;

/**
 * Open a kernel by type and context data
 * Automatically resolves to the correct feature and props
 */
export function openKernel(options: {
  kernelType: string;
  contextData: Record<string, any>;
  returnTo?: string;
}) {
  const kernelConfig = contextKernelTypes[options.kernelType as KernelType];
  
  if (!kernelConfig) {
    console.warn(`Unknown kernel type: ${options.kernelType}`);
    return;
  }

  const props = kernelConfig.propMap(options.contextData);
  
  openFeaturesViaURL({
    features: [kernelConfig.featureId],
    props: { [kernelConfig.featureId]: props },
    returnTo: options.returnTo,
  });

  // Observability
  (supabase as any)
    .rpc('rpc_observe', {
      p_rpc_name: 'kernel_open',
      p_duration_ms: 0,
      p_status: 'ok',
      p_error_code: null,
      p_meta: {
        type: options.kernelType,
        feature: kernelConfig.featureId,
        surface: 'kernel',
      },
    })
    .catch(() => void 0);
}
