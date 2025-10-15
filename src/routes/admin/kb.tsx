import { KnowledgeBrowser } from '@/components/kb/KnowledgeBrowser';
import { useSession } from '@/lib/auth/context';
import { Navigate } from 'react-router-dom';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Loader2 } from 'lucide-react';

export default function KnowledgeBasePage() {
  const { session } = useSession();
  const { isAdmin, isLoading } = useAdminCheck();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4">
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse, search, and manage knowledge items
          </p>
        </div>
      </header>

      <div className="container py-6">
        <KnowledgeBrowser />
      </div>
    </div>
  );
}
