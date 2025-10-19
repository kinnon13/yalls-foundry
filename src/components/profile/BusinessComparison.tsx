/**
 * Business Comparison View
 * Side-by-side KPI comparison for multiple businesses/profiles
 */

import { useProfile } from '@/contexts/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, TrendingUp, TrendingDown, DollarSign, Users, Package, BarChart3 } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface KPI {
  label: string;
  value: string;
  change?: number;
  icon: any;
}

// Mock KPI data - replace with real data from backend
const getProfileKPIs = (profileId: string): KPI[] => {
  return [
    {
      label: 'Revenue',
      value: '$12,450',
      change: 12.5,
      icon: DollarSign,
    },
    {
      label: 'Customers',
      value: '156',
      change: 8.2,
      icon: Users,
    },
    {
      label: 'Orders',
      value: '89',
      change: -3.1,
      icon: Package,
    },
    {
      label: 'Conversion',
      value: '3.2%',
      change: 5.4,
      icon: BarChart3,
    },
  ];
};

export function BusinessComparison() {
  const { comparisonMode, setComparisonMode, comparisonProfiles, setComparisonProfiles } = useProfile();

  if (!comparisonMode || comparisonProfiles.length === 0) {
    return null;
  }

  const handleRemoveProfile = (profileId: string) => {
    setComparisonProfiles(comparisonProfiles.filter((p) => p.id !== profileId));
    if (comparisonProfiles.length <= 1) {
      setComparisonMode(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto h-full flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Business Comparison</h2>
            <p className="text-sm text-muted-foreground">
              Compare KPIs across {comparisonProfiles.length} profiles
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setComparisonMode(false)}
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>

        {/* Comparison Grid */}
        <ScrollArea className="flex-1">
          <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${comparisonProfiles.length}, minmax(280px, 1fr))` }}>
            {comparisonProfiles.map((profile) => {
              const kpis = getProfileKPIs(profile.id);
              return (
                <Card key={profile.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{profile.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1 capitalize">
                          {profile.type}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleRemoveProfile(profile.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {kpis.map((kpi) => {
                      const Icon = kpi.icon;
                      const isPositive = kpi.change ? kpi.change > 0 : null;
                      return (
                        <div key={kpi.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">{kpi.label}</p>
                              <p className="text-xl font-bold">{kpi.value}</p>
                            </div>
                          </div>
                          {kpi.change !== undefined && (
                            <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                              {isPositive ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              <span className="text-sm font-medium">
                                {Math.abs(kpi.change)}%
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Add More Profiles Hint */}
        {comparisonProfiles.length < 4 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Select more profiles from the menu to add them to comparison
          </div>
        )}
      </div>
    </div>
  );
}
