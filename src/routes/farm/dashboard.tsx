import { Card } from '@/design/components/Card';
import { Badge } from '@/design/components/Badge';
import { tokens } from '@/design/tokens';
import { Link } from 'react-router-dom';

export default function FarmDashboard() {
  return (
    <div style={{ padding: tokens.space.m }}>
      <h2 style={{ fontSize: tokens.typography.size.xl, fontWeight: tokens.typography.weight.bold, marginBottom: tokens.space.m }}>
        Barn Dashboard
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: tokens.space.m, marginBottom: tokens.space.l }}>
        <Card padding="m">
          <div style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>Occupancy</div>
          <div style={{ fontSize: tokens.typography.size.xxl, fontWeight: tokens.typography.weight.bold }}>
            0
          </div>
          <div style={{ fontSize: tokens.typography.size.xs, color: tokens.color.text.secondary }}>active boarders</div>
        </Card>

        <Card padding="m">
          <div style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>Tasks Due</div>
          <div style={{ fontSize: tokens.typography.size.xxl, fontWeight: tokens.typography.weight.bold }}>
            0
          </div>
          <Link to="/farm/calendar" style={{ fontSize: tokens.typography.size.xs, color: tokens.color.accent }}>
            View calendar →
          </Link>
        </Card>

        <Card padding="m">
          <div style={{ fontSize: tokens.typography.size.s, color: tokens.color.text.secondary }}>AR Pending</div>
          <div style={{ fontSize: tokens.typography.size.xxl, fontWeight: tokens.typography.weight.bold }}>
            $0
          </div>
          <div style={{ fontSize: tokens.typography.size.xs, color: tokens.color.text.secondary }}>invoices unpaid</div>
        </Card>
      </div>

      <Card padding="m">
        <h3 style={{ fontSize: tokens.typography.size.l, fontWeight: tokens.typography.weight.semibold, marginBottom: tokens.space.m }}>
          Upcoming Tasks
        </h3>
        <div style={{ textAlign: 'center', opacity: 0.6, padding: tokens.space.m }}>
          No pending tasks
        </div>
      </Card>
    </div>
  );
}
