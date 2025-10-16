import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function ExportsPreview() {
  const mockExports = [
    { id: '1', type: 'Orders CSV', requested: '2025-01-16 10:30', status: 'completed', size: '2.4 MB' },
    { id: '2', type: 'Users JSON', requested: '2025-01-15 14:20', status: 'completed', size: '1.8 MB' },
    { id: '3', type: 'Transactions CSV', requested: '2025-01-15 09:15', status: 'processing', size: '—' },
  ];

  const handleExportRequest = () => {
    toast.success('Export request queued (preview only)');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Preview stub for data.yalls.ai exports. CSV/JSON export requests — read-only mock.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Data Exports (Preview)
            </CardTitle>
            <CardDescription>
              Request and download data exports in CSV or JSON format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button onClick={handleExportRequest}>Request New Export</Button>
              <p className="text-xs text-muted-foreground">
                Click to simulate export request (shows toast only)
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Export History</h3>
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="p-2 text-left text-sm font-medium">Type</th>
                      <th className="p-2 text-left text-sm font-medium">Requested</th>
                      <th className="p-2 text-left text-sm font-medium">Status</th>
                      <th className="p-2 text-left text-sm font-medium">Size</th>
                      <th className="p-2 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockExports.map((exp) => (
                      <tr key={exp.id} className="border-b last:border-0">
                        <td className="p-2 text-sm font-medium">{exp.type}</td>
                        <td className="p-2 text-sm">{exp.requested}</td>
                        <td className="p-2 text-sm">
                          <Badge variant={exp.status === 'completed' ? 'default' : 'secondary'}>
                            {exp.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-sm">{exp.size}</td>
                        <td className="p-2">
                          {exp.status === 'completed' && (
                            <Button size="sm" variant="ghost">
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
