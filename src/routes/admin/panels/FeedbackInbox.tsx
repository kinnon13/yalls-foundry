/**
 * Feedback Inbox Panel
 * 
 * Control Room panel for viewing and managing user feedback.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  listFeedback, 
  onFeedbackChange, 
  clearFeedback, 
  exportFeedbackJSON, 
  exportFeedbackCSV, 
  markStatus 
} from '@/lib/feedback/store';
import type { FeedbackItem } from '@/lib/feedback/types';
import { MessageSquare } from 'lucide-react';

export default function FeedbackInbox() {
  const [items, setItems] = useState<FeedbackItem[]>(listFeedback());

  useEffect(() => onFeedbackChange(setItems), []);

  const severityColor = (s: string) => {
    switch (s) {
      case 'bug': return 'destructive';
      case 'confusing': return 'secondary';
      case 'idea': return 'default';
      default: return 'outline';
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'new': return 'default';
      case 'triaged': return 'secondary';
      case 'closed': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Feedback Inbox
        </CardTitle>
        <CardDescription>Quick reports from demo users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button onClick={exportFeedbackJSON} variant="outline" size="sm">
            Export JSON
          </Button>
          <Button onClick={exportFeedbackCSV} variant="outline" size="sm">
            Export CSV
          </Button>
          <Button onClick={clearFeedback} variant="outline" size="sm" className="ml-auto">
            Clear All
          </Button>
        </div>

        <div className="max-h-96 overflow-auto space-y-3 border rounded-md p-3">
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No feedback yet. Users can press Alt+F or click the Feedback button.
            </div>
          ) : (
            items.map(i => (
              <div key={i.id} className="border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant={severityColor(i.severity)} className="text-[10px]">
                    {i.severity}
                  </Badge>
                  <Badge variant={statusColor(i.status)} className="text-[10px]">
                    {i.status}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(i.ts).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {i.path}
                  </span>
                  <select
                    value={i.status}
                    onChange={e => markStatus(i.id, e.target.value as FeedbackItem['status'])}
                    className="ml-auto rounded border border-input bg-background px-2 py-0.5 text-xs"
                  >
                    <option value="new">new</option>
                    <option value="triaged">triaged</option>
                    <option value="closed">closed</option>
                  </select>
                </div>

                <div className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">
                  {i.message}
                </div>

                {(i.email || i.role || i.userAgent) && (
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    {i.email && <span>from {i.email} · </span>}
                    {i.role && <span>role {i.role} · </span>}
                    {i.userAgent && <span className="font-mono">{i.userAgent.slice(0, 60)}...</span>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
