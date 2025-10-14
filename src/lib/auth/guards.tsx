/**
 * Auth Guards
 * 
 * React components for protecting UI based on authentication and permissions.
 */

import { PropsWithChildren } from 'react';
import { useSession } from './context';
import type { Role, Action, Subject } from './rbac';
import { can } from './rbac';

/**
 * Require authentication to render children
 */
export function RequireAuth({ children, fallback }: PropsWithChildren<{ fallback?: JSX.Element }>) {
  const { session, loading } = useSession();
  
  if (loading) return null;
  if (!session) return fallback ?? <div className="p-4 text-center">Not authorized</div>;
  
  return <>{children}</>;
}

/**
 * Render children only if user has one of the specified roles
 */
export function WithRole({
  roles,
  children,
  fallback,
}: {
  roles: Role[];
  children: JSX.Element;
  fallback?: JSX.Element;
}) {
  const { session } = useSession();
  
  if (!session) return fallback ?? null;
  if (!roles.includes(session.role)) return fallback ?? null;
  
  return children;
}

/**
 * Render children only if user can perform action on subject
 */
export function Can({
  action,
  subject,
  children,
  fallback,
}: {
  action: Action;
  subject: Subject;
  children: JSX.Element;
  fallback?: JSX.Element;
}) {
  const { session } = useSession();
  
  if (!session) return fallback ?? null;
  if (!can(session.role, action, subject)) return fallback ?? null;
  
  return children;
}
