/**
 * What I Know Panel - Unified search across everything
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, BookOpen, Brain, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function WhatIKnowPanel() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search terms, docs, and my memories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 text-base"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button variant="default" size="sm">All</Button>
        <Button variant="outline" size="sm">Definitions</Button>
        <Button variant="outline" size="sm">Docs</Button>
        <Button variant="outline" size="sm">My Memories</Button>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {!searchQuery ? (
          <Card className="bg-card/50">
            <CardContent className="pt-12 pb-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">Start searching to find terms, docs, and memories</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="bg-card/50 hover:border-primary transition-colors cursor-pointer">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-primary mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">TERM</Badge>
                      <span className="font-semibold">Pink Buckle</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Premier women's rodeo and equestrian event series...
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">95% confidence</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 hover:border-primary transition-colors cursor-pointer">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-blue-500 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="default">MEMORY</Badge>
                      <span className="font-semibold">family_mom</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Personal relationship information stored from conversation
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">Source: chat</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
