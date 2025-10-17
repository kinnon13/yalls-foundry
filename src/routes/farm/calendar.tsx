import { useState } from 'react';
import { Card } from '@/design/components/Card';
import { Button } from '@/design/components/Button';
import { Badge } from '@/design/components/Badge';
import { tokens } from '@/design/tokens';
import { format, startOfWeek, addDays } from 'date-fns';

export default function FarmCalendar() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div style={{ padding: tokens.space.m }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.space.m }}>
        <h2 style={{ fontSize: tokens.typography.size.xl, fontWeight: tokens.typography.weight.bold }}>
          Barn Calendar
        </h2>
        <div style={{ display: 'flex', gap: tokens.space.s }}>
          <Button variant="secondary" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            ← Prev
          </Button>
          <Button variant="secondary" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Today
          </Button>
          <Button variant="secondary" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Next →
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: tokens.space.s }}>
        {days.map((day) => (
          <Card key={day.toISOString()} padding="s">
            <div style={{ fontSize: tokens.typography.size.s, fontWeight: tokens.typography.weight.semibold, marginBottom: tokens.space.xs }}>
              {format(day, 'EEE dd')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.xs }}>
              <div
                style={{
                  padding: tokens.space.xs,
                  background: tokens.color.surface[1],
                  borderRadius: tokens.radius.s,
                  fontSize: tokens.typography.size.xs,
                }}
              >
                <Badge variant="default">Task</Badge>
                <div>Sample task</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
