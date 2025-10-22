import type { AppUnitProps } from '@/apps/types';

export default function AdminRockerEntry({ contextType }: AppUnitProps) {
  return (
    <div data-testid="app-admin-rocker" className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin Rocker <span className="opacity-60">({contextType})</span></h1>
      </header>

      <ul className="list-disc pl-5 space-y-2">
        <li>Audit trails (ai_action_ledger)</li>
        <li>Budget / breaker status</li>
        <li>Worker health & AI drift</li>
      </ul>
    </div>
  );
}
