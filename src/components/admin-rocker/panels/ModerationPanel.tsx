/**
 * Admin Rocker Moderation Panel
 * Content review and moderation tools
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Search, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react';

export function ModerationPanel() {
  const [searchQuery, setSearchQuery] = useState('');

  const flaggedItems = [
    {
      id: 1,
      type: 'post',
      content: 'Check out this amazing stallion for sale...',
      author: 'john_doe',
      reason: 'Potential spam',
      priority: 'high',
      timestamp: '2 hours ago',
    },
    {
      id: 2,
      type: 'comment',
      content: 'This is the best deal ever!!!',
      author: 'jane_smith',
      reason: 'Excessive promotion',
      priority: 'medium',
      timestamp: '5 hours ago',
    },
    {
      id: 3,
      type: 'listing',
      content: 'Horse boarding services available',
      author: 'farm_owner',
      reason: 'Duplicate listing',
      priority: 'low',
      timestamp: '1 day ago',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
        <p className="text-muted-foreground mt-1">
          Review flagged content and manage platform safety
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Flagged Content Queue
          </CardTitle>
          <CardDescription>
            AI-powered content review with priority flagging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search flagged content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All (23)</TabsTrigger>
              <TabsTrigger value="high">High (8)</TabsTrigger>
              <TabsTrigger value="medium">Medium (10)</TabsTrigger>
              <TabsTrigger value="low">Low (5)</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-4">
              {flaggedItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                          <Badge variant="outline">{item.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            by {item.author}
                          </span>
                        </div>
                        
                        <p className="text-sm">{item.content}</p>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <AlertTriangle className="h-3 w-3" />
                          Reason: {item.reason}
                          <span className="ml-2">• {item.timestamp}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="default" className="gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="gap-2">
                          <XCircle className="h-4 w-4" />
                          Remove
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Eye className="h-4 w-4" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="high" className="mt-4">
              <p className="text-sm text-muted-foreground text-center py-8">
                High priority items will appear here
              </p>
            </TabsContent>

            <TabsContent value="medium" className="mt-4">
              <p className="text-sm text-muted-foreground text-center py-8">
                Medium priority items will appear here
              </p>
            </TabsContent>

            <TabsContent value="low" className="mt-4">
              <p className="text-sm text-muted-foreground text-center py-8">
                Low priority items will appear here
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Proactive Scan Results */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>AI Proactive Scan</CardTitle>
          <CardDescription>
            Automated content analysis and risk detection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/50 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Potential spam pattern detected</p>
              <p className="text-xs text-muted-foreground mt-1">
                15 similar posts from 3 accounts in the last 24 hours
              </p>
            </div>
            <Button size="sm" variant="outline">Investigate</Button>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/50 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Suspicious user activity</p>
              <p className="text-xs text-muted-foreground mt-1">
                User @suspicious_account mass-following 50+ accounts
              </p>
            </div>
            <Button size="sm" variant="outline">Review</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
