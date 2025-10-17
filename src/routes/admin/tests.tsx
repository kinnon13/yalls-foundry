/**
 * @feature(admin_tests)
 * Test Coverage Dashboard Admin Page
 * View test coverage by feature
 */

import React from 'react';
import featuresData from '../../../docs/features/features.json';
import { Badge } from '@/components/ui/badge';
import { TestTube, CheckCircle, XCircle } from 'lucide-react';

export default function TestsAdminPage() {
  const features = featuresData.features;

  const withE2E = features.filter(f => f.tests.e2e.length > 0).length;
  const withUnit = features.filter(f => f.tests.unit.length > 0).length;
  const withAny = features.filter(f => f.tests.e2e.length > 0 || f.tests.unit.length > 0).length;
  const coveragePct = (withAny / features.length) * 100;

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test Coverage</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {withAny}/{features.length} features covered · {coveragePct.toFixed(1)}%
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{withE2E}</div>
          <div className="text-sm text-muted-foreground">With E2E Tests</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{withUnit}</div>
          <div className="text-sm text-muted-foreground">With Unit Tests</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{features.length - withAny}</div>
          <div className="text-sm text-muted-foreground">No Tests</div>
        </div>
      </div>

      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Feature</th>
              <th className="text-left p-3 font-medium">E2E</th>
              <th className="text-left p-3 font-medium">Unit</th>
              <th className="text-left p-3 font-medium">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => {
              const hasE2E = feature.tests.e2e.length > 0;
              const hasUnit = feature.tests.unit.length > 0;
              const hasCoverage = hasE2E || hasUnit;

              return (
                <tr key={feature.id} className="border-b hover:bg-muted/30">
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{feature.title}</div>
                      <div className="text-xs text-muted-foreground">{feature.id}</div>
                    </div>
                  </td>
                  <td className="p-3 text-sm">
                    {hasE2E ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {feature.tests.e2e.length}
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <XCircle className="h-3 w-3 mr-1" />
                        None
                      </Badge>
                    )}
                  </td>
                  <td className="p-3 text-sm">
                    {hasUnit ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {feature.tests.unit.length}
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <XCircle className="h-3 w-3 mr-1" />
                        None
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    {hasCoverage ? (
                      <Badge className="bg-green-500">
                        <TestTube className="h-3 w-3 mr-1" />
                        Covered
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <TestTube className="h-3 w-3 mr-1" />
                        Missing
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
