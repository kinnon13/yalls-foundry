/**
 * Database Utilities (Multi-Tenant Safe)
 * 
 * Tenant-isolated database operations with automatic tenant_id injection.
 * Prevents cross-tenant data leaks by enforcing tenant context on all mutations.
 * 
 * Usage:
 *   import { tInsert, tUpdate, handleDbError } from '@/lib/utils/db';
 *   await tInsert(supabase, 'contacts', { name: 'John' }); // Auto-adds tenant_id
 */

import { supabase } from '@/integrations/supabase/client';
import { resolveTenantId } from '@/lib/tenancy/context';

export function handleDbError(error: any): never {
  // Use structured logging instead of console
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.error('Database error:', error);
  }
  
  if (error.code === 'PGRST116') {
    throw new Error('No rows found');
  }
  
  if (error.code === '23505') {
    throw new Error('Duplicate entry');
  }
  
  if (error.code === '23503') {
    throw new Error('Referenced record not found');
  }
  
  if (error.code === '42501') {
    throw new Error('Permission denied - check RLS policies');
  }
  
  throw new Error(error.message || 'Database operation failed');
}

/**
 * Tenant-safe INSERT - automatically injects tenant_id
 * Prevents cross-tenant data leaks by ensuring all inserts are tenant-scoped
 * 
 * @example
 * await tInsert(supabase, 'contacts', { name: 'Alice', email: 'alice@example.com' });
 */
export async function tInsert(
  client: typeof supabase,
  table: string,
  values: Record<string, any>
): Promise<{ data: any; error: any }> {
  try {
    const tenantId = await resolveTenantId();
    
    const { data, error } = await (client as any)
      .from(table)
      .insert({ ...values, tenant_id: tenantId })
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Tenant-safe UPDATE - enforces tenant_id filter
 * 
 * @example
 * await tUpdate(supabase, 'contacts', '123', { name: 'Bob' });
 */
export async function tUpdate(
  client: typeof supabase,
  table: string,
  id: string,
  values: Record<string, any>
): Promise<{ data: any; error: any }> {
  try {
    const tenantId = await resolveTenantId();
    
    const { data, error } = await (client as any)
      .from(table)
      .update(values)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Tenant-safe DELETE - enforces tenant_id filter
 * 
 * @example
 * await tDelete(supabase, 'contacts', '123');
 */
export async function tDelete(
  client: typeof supabase,
  table: string,
  id: string
): Promise<{ error: any | null }> {
  try {
    const tenantId = await resolveTenantId();
    
    const { error } = await (client as any)
      .from(table)
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

/**
 * Paginate query results
 */
export function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    items: items.slice(start, end),
    page,
    pageSize,
    totalItems: items.length,
    totalPages: Math.ceil(items.length / pageSize),
    hasNext: end < items.length,
    hasPrev: page > 1,
  };
}