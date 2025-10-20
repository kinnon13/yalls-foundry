/**
 * Incentives Feature
 * 
 * Discover and nominate horses for incentive programs
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/design/components/Button';
import { X, Trophy, Search, DollarSign, Calendar } from 'lucide-react';
import type { FeatureProps } from '@/feature-kernel/types';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

interface IncentivesFeatureProps extends FeatureProps {
  horse?: string;
  program?: string;
  mode?: 'discover' | 'nominate' | 'enter' | 'pay' | 'draws';
  featureId: string;
  updateProps: (updates: Partial<FeatureProps>) => void;
  close: () => void;
}

// Mock programs
const mockPrograms = [
  {
    id: '1',
    name: 'State Breeders Stakes',
    prize: '$50,000',
    deadline: '2024-03-15',
    status: 'open',
    eligible: 12,
  },
  {
    id: '2',
    name: 'National Futurity',
    prize: '$100,000',
    deadline: '2024-04-01',
    status: 'open',
    eligible: 8,
  },
  {
    id: '3',
    name: 'Regional Derby',
    prize: '$25,000',
    deadline: '2024-02-28',
    status: 'closing',
    eligible: 15,
  },
];

const mockNominations = [
  { id: '1', horse: 'Thunder Strike', program: 'State Breeders Stakes', status: 'pending', fee: '$500' },
  { id: '2', horse: 'Lightning Bolt', program: 'National Futurity', status: 'approved', fee: '$750' },
  { id: '3', horse: 'Storm Runner', program: 'Regional Derby', status: 'entered', fee: '$350' },
];

export default function IncentivesFeature({
  horse,
  program,
  mode = 'discover',
  featureId,
  updateProps,
  close,
}: IncentivesFeatureProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500/10 text-green-500';
      case 'closing': return 'bg-yellow-500/10 text-yellow-500';
      case 'pending': return 'bg-blue-500/10 text-blue-500';
      case 'approved': return 'bg-green-500/10 text-green-500';
      case 'entered': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-muted';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Incentives</CardTitle>
            <Badge variant="secondary">{mockPrograms.length} programs</Badge>
          </div>
          <Button variant="ghost" size="s" onClick={close}>
            <X size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={mode} onValueChange={(v) => updateProps({ mode: v as any })}>
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="nominate">Nominate</TabsTrigger>
            <TabsTrigger value="enter">Enter</TabsTrigger>
            <TabsTrigger value="pay">Pay</TabsTrigger>
            <TabsTrigger value="draws">Draws</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-3">
              {mockPrograms.map((prog) => (
                <div key={prog.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <Trophy size={16} className="text-primary" />
                        {prog.name}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {prog.eligible} eligible horses
                      </p>
                    </div>
                    <Badge className={getStatusColor(prog.status)}>{prog.status}</Badge>
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign size={14} className="text-muted-foreground" />
                      <span className="font-medium">{prog.prize}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar size={14} className="text-muted-foreground" />
                      <span>Deadline: {prog.deadline}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button variant="primary" size="s" onClick={() => updateProps({ mode: 'nominate', program: prog.id })}>
                      Nominate Horse
                    </Button>
                    <Button variant="ghost" size="s">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="nominate" className="space-y-4">
            <div className="text-center py-8">
              <Trophy size={48} className="mx-auto text-muted-foreground mb-4" />
              <h4 className="font-semibold mb-2">Nominate Your Horse</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Select a horse and program to begin the nomination process
              </p>
              <Button variant="primary">Start Nomination</Button>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Recent Nominations</h4>
              <div className="space-y-2">
                {mockNominations.map((nom) => (
                  <div key={nom.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{nom.horse}</p>
                      <p className="text-sm text-muted-foreground">{nom.program}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{nom.fee}</span>
                      <Badge className={getStatusColor(nom.status)}>{nom.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="enter" className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              <p>Enter your nominated horses into upcoming events</p>
              <p className="text-xs mt-2">Feature coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="pay" className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              <p>Manage payments for nominations and entries</p>
              <p className="text-xs mt-2">Feature coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="draws" className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              <p>View draw results and race assignments</p>
              <p className="text-xs mt-2">Feature coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
