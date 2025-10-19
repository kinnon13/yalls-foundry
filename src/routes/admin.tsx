/**
 * Admin Dashboard Route
 * Only accessible to admin users
 */

import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { RockerSuggestions } from '@/components/ai/RockerSuggestions';
import { useRoles } from '@/hooks/useRoles';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const { isAdmin, isLoading } = useRoles();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminPanel />
          <RockerSuggestions />
        </div>
      </div>
    </div>
  );
}
