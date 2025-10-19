/**
 * Auth Guards
 * 
 * React components for protecting UI based on authentication and permissions.
 */

import { useEffect, PropsWithChildren } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from './context';
import { supabase } from '@/integrations/supabase/client';
import type { Role, Action, Subject } from './rbac';
import { can } from './rbac';

/**
 * Require authentication - redirects to /auth with next param if not logged in
 */
export function RequireAuth({ children, fallback }: PropsWithChildren<{ fallback?: JSX.Element }>) {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (!loading && !session) {
      const currentPath = location.pathname + location.search;
      const nextParam = encodeURIComponent(currentPath);
      navigate(`/auth?mode=login&next=${nextParam}`, { replace: true });
    }
  }, [session, loading, location, navigate]);
  
  if (loading) return null;
  if (!session) return null;
  
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
