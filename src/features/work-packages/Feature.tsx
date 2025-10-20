/**
 * Work Packages Feature
 * 
 * Manage scoped work assignments for projects
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/design/components/Button';
import { X, Briefcase, Clock, CheckCircle, Circle, Plus } from 'lucide-react';
import type { FeatureProps } from '@/feature-kernel/types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface WorkPackagesFeatureProps extends FeatureProps {
  project?: string;
  role?: 'plumber' | 'electrician' | 'framer' | 'general' | 'other';
  range?: 'week' | 'month';
  featureId: string;
  updateProps: (updates: Partial<FeatureProps>) => void;
  close: () => void;
}

// Mock work packages
const mockPackages = [
  {
    id: '1',
    title: 'Kitchen Renovation - Phase 1',
    project: 'Residential Build',
    role: 'plumber',
    status: 'in_progress',
    progress: 65,
    dueDate: '2024-01-20',
    tasks: 12,
    completed: 8,
  },
  {
    id: '2',
    title: 'Electrical Wiring - Second Floor',
    project: 'Commercial Office',
    role: 'electrician',
    status: 'pending',
    progress: 0,
    dueDate: '2024-01-25',
    tasks: 8,
    completed: 0,
  },
  {
    id: '3',
    title: 'Framing - North Wing',
    project: 'Residential Build',
    role: 'framer',
    status: 'completed',
    progress: 100,
    dueDate: '2024-01-15',
    tasks: 15,
    completed: 15,
  },
  {
    id: '4',
    title: 'Foundation Inspection',
    project: 'Commercial Office',
    role: 'general',
    status: 'in_progress',
    progress: 45,
    dueDate: '2024-01-18',
    tasks: 6,
    completed: 3,
  },
];

export default function WorkPackagesFeature({
  project,
  role,
  range = 'week',
  featureId,
  updateProps,
  close,
}: WorkPackagesFeatureProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500';
      case 'completed': return 'bg-green-500/10 text-green-500';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'in_progress':
        return <Circle size={16} className="text-blue-500" />;
      default:
        return <Clock size={16} className="text-yellow-500" />;
    }
  };

  const getRoleColor = (roleType: string) => {
    switch (roleType) {
      case 'plumber': return 'bg-blue-500/10 text-blue-500';
      case 'electrician': return 'bg-yellow-500/10 text-yellow-500';
      case 'framer': return 'bg-green-500/10 text-green-500';
      case 'general': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-muted';
    }
  };

  const filteredPackages = role 
    ? mockPackages.filter(pkg => pkg.role === role)
    : mockPackages;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Work Packages</CardTitle>
            <Badge variant="secondary">{filteredPackages.length} active</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={range === 'week' ? 'secondary' : 'ghost'}
              size="s"
              onClick={() => updateProps({ range: 'week' })}
            >
              Week
            </Button>
            <Button
              variant={range === 'month' ? 'secondary' : 'ghost'}
              size="s"
              onClick={() => updateProps({ range: 'month' })}
            >
              Month
            </Button>
            <Button variant="ghost" size="s" onClick={close}>
              <X size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Role Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={!role ? 'secondary' : 'ghost'}
              size="s"
              onClick={() => updateProps({ role: undefined })}
            >
              All Roles
            </Button>
            {['plumber', 'electrician', 'framer', 'general', 'other'].map((r) => (
              <Button
                key={r}
                variant={role === r ? 'secondary' : 'ghost'}
                size="s"
                onClick={() => updateProps({ role: r as any })}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Button>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Total Tasks</p>
              <p className="text-2xl font-bold">{filteredPackages.reduce((acc, pkg) => acc + pkg.tasks, 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{filteredPackages.reduce((acc, pkg) => acc + pkg.completed, 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{filteredPackages.filter(p => p.status === 'in_progress').length}</p>
            </div>
          </div>

          {/* Work Packages List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Packages</h4>
              <Button variant="primary" size="s">
                <Plus size={16} className="mr-1" />
                New Package
              </Button>
            </div>

            {filteredPackages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
                <p>No work packages found</p>
                <p className="text-xs mt-2">Try selecting a different role or range</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      selectedPackage === pkg.id ? 'bg-muted/50 border-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedPackage(pkg.id === selectedPackage ? null : pkg.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(pkg.status)}
                          <h4 className="font-semibold">{pkg.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{pkg.project}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getRoleColor(pkg.role)}>{pkg.role}</Badge>
                        <Badge className={getStatusColor(pkg.status)}>{pkg.status.replace('_', ' ')}</Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{pkg.completed}/{pkg.tasks} tasks</span>
                      </div>
                      <Progress value={pkg.progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between mt-3 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock size={14} />
                        <span>Due: {pkg.dueDate}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="s">View Details</Button>
                        {pkg.status !== 'completed' && (
                          <Button variant="primary" size="s">Update</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
