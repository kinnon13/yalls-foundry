import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Hammer } from 'lucide-react';
import { CapabilityBrowserPanel } from '@/routes/admin/panels/CapabilityBrowserPanel';

export default function CapabilitiesPreview() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Preview of admin.yalls.ai Capability Browser. Feature catalog, gaps, and usage — read-only.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hammer className="h-5 w-5" />
              Capability Browser (Preview)
            </CardTitle>
            <CardDescription>
              View feature catalog, capability gaps, and adoption metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CapabilityBrowserPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
