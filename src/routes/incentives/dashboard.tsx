import { Card } from '@/design/components/Card';
import { Badge } from '@/design/components/Badge';
import { tokens } from '@/design/tokens';

export default function IncentiveDashboard() {
  return (
    <div style={{ padding: tokens.space.m }}>
      <h2 style={{ fontSize: tokens.typography.size.xl, fontWeight: tokens.typography.weight.bold, marginBottom: tokens.space.m }}>
        Incentive Programs
      </h2>

      <h3 style={{ fontSize: tokens.typography.size.l, fontWeight: tokens.typography.weight.semibold, marginBottom: tokens.space.s }}>
        Active Programs
      </h3>
      <Card padding="m">
        <div style={{ textAlign: 'center', opacity: 0.6, padding: tokens.space.m }}>
          No active programs yet
        </div>
      </Card>

      <h3 style={{ fontSize: tokens.typography.size.l, fontWeight: tokens.typography.weight.semibold, margin: `${tokens.space.l} 0 ${tokens.space.s}` }}>
        My Nominations
      </h3>
      <Card padding="m">
        <div style={{ textAlign: 'center', opacity: 0.6, padding: tokens.space.m }}>
          No nominations yet
        </div>
      </Card>

      <h3 style={{ fontSize: tokens.typography.size.l, fontWeight: tokens.typography.weight.semibold, margin: `${tokens.space.l} 0 ${tokens.space.s}` }}>
        My Bonus Payouts
      </h3>
      <Card padding="m">
        <div style={{ textAlign: 'center', opacity: 0.6, padding: tokens.space.m }}>
          No payouts yet
        </div>
      </Card>
    </div>
  );
}
