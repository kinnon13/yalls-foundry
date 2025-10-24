import type { AppUnitProps } from '@/apps/types';

export default function YallbraryEntry({ contextType }: AppUnitProps) {
  return (
    <section data-testid="app-yallbrary" aria-label="Yallbrary" className="p-4">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Yallbrary</h2>
        <small className="text-muted-foreground">{contextType}</small>
      </header>
      <div 
        role="region" 
        aria-label="Yallbrary Content"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <p className="text-muted-foreground">App registry and pinning system</p>
      </div>
    </section>
  );
}
