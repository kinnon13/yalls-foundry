import { useParams } from 'react-router-dom';
import { Card } from '@/design/components/Card';
import { Badge } from '@/design/components/Badge';
import { tokens } from '@/design/tokens';

export default function BoarderProfile() {
  const { id: boarderId } = useParams();

  return (
    <div style={{ padding: tokens.space.m }}>
      <Card padding="m">
        <h2 style={{ fontSize: tokens.typography.size.xl, fontWeight: tokens.typography.weight.bold }}>
          Boarder Profile
        </h2>
        <div style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary, marginTop: tokens.space.s }}>
          ID: {boarderId}
        </div>
      </Card>

      <h3 style={{ fontSize: tokens.typography.size.l, fontWeight: tokens.typography.weight.semibold, margin: `${tokens.space.l} 0 ${tokens.space.s}` }}>
        Horses
      </h3>
      <Card padding="m">
        <div style={{ textAlign: 'center', opacity: 0.6, padding: tokens.space.m }}>
          No horses yet
        </div>
      </Card>

      <h3 style={{ fontSize: tokens.typography.size.l, fontWeight: tokens.typography.weight.semibold, margin: `${tokens.space.l} 0 ${tokens.space.s}` }}>
        Recent Invoices
      </h3>
      <Card padding="m">
        <div style={{ textAlign: 'center', opacity: 0.6, padding: tokens.space.m }}>
          No invoices yet
        </div>
      </Card>
    </div>
  );
}
