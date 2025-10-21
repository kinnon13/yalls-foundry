/**
 * Admin Rocker Feedback Panel
 * AI training data and user feedback management
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, ThumbsUp, ThumbsDown, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

export function FeedbackPanel() {
  const feedbackItems = [
    {
      id: 1,
      type: 'ai_response',
      content: 'AI suggested incorrect stallion pricing for regional market',
      user: 'farm_owner_123',
      category: 'pricing',
      status: 'pending',
      votes: 12,
      timestamp: '2 hours ago',
    },
    {
      id: 2,
      type: 'feature_request',
      content: 'Add bulk upload for horse pedigree data',
      user: 'breeder_pro',
      category: 'features',
      status: 'approved',
      votes: 45,
      timestamp: '1 day ago',
    },
    {
      id: 3,
      type: 'training_data',
      content: 'Equine health diagnosis example - should classify as emergency',
      user: 'vet_specialist',
      category: 'medical',
      status: 'pending',
      votes: 8,
      timestamp: '3 days ago',
    },
  ];

  const aiMetrics = [
    { label: 'Response Accuracy', value: '94.2%', change: '+2.1%' },
    { label: 'User Satisfaction', value: '4.7/5', change: '+0.3' },
    { label: 'Training Samples', value: '12,458', change: '+1,234' },
    { label: 'Model Version', value: 'v2.5.1', change: 'updated' },
  ];

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feedback & Training</h1>
        <p className="text-muted-foreground mt-1">
          Manage user feedback and curate AI training data
        </p>
      </div>

      {/* AI Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {aiMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feedback Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            User Feedback Queue
          </CardTitle>
          <CardDescription>
            Review and process user-submitted feedback and training examples
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending (15)</TabsTrigger>
              <TabsTrigger value="approved">Approved (48)</TabsTrigger>
              <TabsTrigger value="rejected">Rejected (12)</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-3 mt-4">
              {feedbackItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={item.status === 'approved' ? 'default' : 'secondary'}>
                              {item.status}
                            </Badge>
                            <Badge variant="outline">{item.type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              by {item.user}
                            </span>
                          </div>
                          
                          <p className="text-sm">{item.content}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {item.votes} votes
                            </div>
                            <span>Category: {item.category}</span>
                            <span>• {item.timestamp}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button size="sm" variant="default" className="gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" className="gap-2">
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="approved" className="mt-4">
              <p className="text-sm text-muted-foreground text-center py-8">
                Approved feedback items will appear here
              </p>
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              <p className="text-sm text-muted-foreground text-center py-8">
                Rejected feedback items will appear here
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Training Data Insights */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Training Data Insights
          </CardTitle>
          <CardDescription>
            AI-identified patterns and improvement opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">Inconsistent feedback detected</p>
            <p className="text-xs text-muted-foreground mt-1">
              12 conflicting examples found in "stallion pricing" category - review recommended
            </p>
            <Button size="sm" variant="outline" className="mt-2">
              Review Examples
            </Button>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">Low coverage in "farm operations"</p>
            <p className="text-xs text-muted-foreground mt-1">
              Only 45 training samples - consider requesting more user contributions
            </p>
            <Button size="sm" variant="outline" className="mt-2">
              Request Feedback
            </Button>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">High-quality contributor identified</p>
            <p className="text-xs text-muted-foreground mt-1">
              User @vet_specialist has 95% approval rate (28 contributions)
            </p>
            <Button size="sm" variant="outline" className="mt-2">
              View Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Curation Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Curation Tools</CardTitle>
          <CardDescription>
            Bulk actions and dataset management
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <CheckCircle className="h-5 w-5" />
            <span className="text-xs">Bulk Approve</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <XCircle className="h-5 w-5" />
            <span className="text-xs">Bulk Reject</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs">Export Dataset</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <MessageCircle className="h-5 w-5" />
            <span className="text-xs">Request More</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
