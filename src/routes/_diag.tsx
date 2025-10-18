/**
 * Diagnostic Route - Context Health Check
 * Verifies Router, Auth, and React contexts are properly wired
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function Diag() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading } = useSession();

  const checks = [
    {
      name: 'React Router Context',
      pass: typeof navigate === 'function' && !!location,
      details: location?.pathname || 'No location',
    },
    {
      name: 'Auth Context',
      pass: !loading && (session !== undefined),
      details: session?.userId ? `User: ${session.userId.slice(0, 8)}...` : 'No session',
    },
    {
      name: 'Auth Provider',
      pass: loading !== undefined,
      details: loading ? 'Loading...' : 'Ready',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Context Diagnostic</CardTitle>
          <CardDescription>
            Verify React Router, Auth, and provider contexts are properly wired
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checks.map((check) => (
            <div
              key={check.name}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                {check.pass ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium">{check.name}</p>
                  <p className="text-sm text-muted-foreground">{check.details}</p>
                </div>
              </div>
              <Badge variant={check.pass ? 'default' : 'destructive'}>
                {check.pass ? 'PASS' : 'FAIL'}
              </Badge>
            </div>
          ))}

          <div className="mt-6 p-4 rounded-lg bg-muted">
            <p className="text-sm font-medium mb-2">Raw Context Data:</p>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(
                {
                  router: {
                    hasNavigate: typeof navigate === 'function',
                    pathname: location?.pathname,
                  },
                  auth: {
                    loading,
                    hasSession: !!session,
                    userId: session?.userId || null,
                  },
                },
                null,
                2
              )}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
