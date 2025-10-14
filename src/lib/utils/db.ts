/**
 * Database Utilities
 * 
 * Common patterns for database operations.
 * 
 * Usage:
 *   import { handleDbError } from '@/lib/utils/db';
 */

export function handleDbError(error: any): never {
  console.error('Database error:', error);
  
  if (error.code === 'PGRST116') {
    throw new Error('No rows found');
  }
  
  if (error.code === '23505') {
    throw new Error('Duplicate entry');
  }
  
  if (error.code === '23503') {
    throw new Error('Referenced record not found');
  }
  
  throw new Error(error.message || 'Database operation failed');
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