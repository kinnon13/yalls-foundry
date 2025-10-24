import type { AppUnitProps } from '@/apps/types';
import { Feed } from './components/Feed';
import { useSession } from '@/lib/auth/context';

export default function YallsSocialEntry({ contextType }: AppUnitProps) {
  const { session } = useSession();
  const userId = session?.userId || 'anonymous';

  return (
    <section data-testid="app-yalls-social" aria-label="Yalls Social" className="p-4">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Yalls Social</h2>
        <small className="text-muted-foreground">{contextType}</small>
      </header>
      <Feed userId={userId} />
    </section>
  );
}
