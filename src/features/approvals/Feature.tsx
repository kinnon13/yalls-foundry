/**
 * Approvals Feature
 * 
 * Review and approve pending content
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/design/components/Button';
import { X, Check, XCircle, Eye, Download } from 'lucide-react';
import type { FeatureProps } from '@/feature-kernel/types';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ApprovalsFeatureProps extends FeatureProps {
  entity?: string;
  filter?: 'all' | 'pending' | 'approved' | 'rejected';
  featureId: string;
  updateProps: (updates: Partial<FeatureProps>) => void;
  close: () => void;
}

// Mock data
const mockItems = [
  { id: '1', title: 'New Post: Spring Training Update', type: 'post', status: 'pending', author: 'John Smith', date: '2024-01-15' },
  { id: '2', title: 'Event: Annual Gala', type: 'event', status: 'pending', author: 'Sarah Johnson', date: '2024-01-14' },
  { id: '3', title: 'Media Upload: Training Photos', type: 'media', status: 'approved', author: 'Mike Wilson', date: '2024-01-13' },
  { id: '4', title: 'Comment: Great event!', type: 'comment', status: 'rejected', author: 'Jane Doe', date: '2024-01-12' },
];

export default function ApprovalsFeature({
  entity,
  filter = 'pending',
  featureId,
  updateProps,
  close,
}: ApprovalsFeatureProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const filteredItems = filter === 'all' 
    ? mockItems 
    : mockItems.filter(item => item.status === filter);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItems(newSet);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500';
      case 'approved': return 'bg-green-500/10 text-green-500';
      case 'rejected': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Feed Approvals</CardTitle>
            <Badge variant="secondary">{filteredItems.length} items</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="s" onClick={close}>
              <X size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(v) => updateProps({ filter: v as any })}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="space-y-3">
            {selectedItems.size > 0 && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">{selectedItems.size} selected</span>
                <div className="flex gap-2 ml-auto">
                  <Button variant="primary" size="s">
                    <Check size={16} className="mr-1" />
                    Approve
                  </Button>
                  <Button variant="ghost" size="s">
                    <XCircle size={16} className="mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No {filter !== 'all' ? filter : ''} items found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => toggleSelect(item.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelect(item.id);
                      }}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <Badge variant="secondary" className="text-xs">{item.type}</Badge>
                        <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        By {item.author} • {item.date}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="s">
                        <Eye size={16} />
                      </Button>
                      {filter === 'pending' && (
                        <>
                          <Button variant="ghost" size="s">
                            <Check size={16} className="text-green-500" />
                          </Button>
                          <Button variant="ghost" size="s">
                            <XCircle size={16} className="text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" size="s">
                <Download size={16} className="mr-1" />
                Export
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
