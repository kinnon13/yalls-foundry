/**
 * Rocker Debug Route
 * Standalone page for debugging AI learning (can be opened in new window)
 */

import { useSession } from '@/lib/auth/context';
import { RockerDebugPanel } from '@/components/rocker/RockerDebugPanel';
import { Navigate } from 'react-router-dom';

export default function RockerDebugRoute() {
  const { session } = useSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <RockerDebugPanel userId={session.userId} />;
}
