import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function ReportsPreview() {
  const mockReports = [
    { id: '1', name: 'Monthly Sales Report', schedule: 'Monthly', lastRun: '2025-01-01', status: 'active' },
    { id: '2', name: 'Weekly Commission Report', schedule: 'Weekly', lastRun: '2025-01-13', status: 'active' },
    { id: '3', name: 'Quarterly Tax Report', schedule: 'Quarterly', lastRun: '2024-10-01', status: 'paused' },
  ];

  const handleScheduleReport = () => {
    toast.success('Report scheduled (preview only)');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="fixed top-4 right-4 bg-yellow-500 text-black px-3 py-1 text-xs font-bold uppercase tracking-wider rotate-12 shadow-lg z-50">
        Preview
      </div>
      <div className="max-w-5xl mx-auto space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Preview of data.yalls.ai reports. Scheduled reports — read-only mock.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Scheduled Reports (Preview)
            </CardTitle>
            <CardDescription>
              Configure and manage automated report generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button onClick={handleScheduleReport}>Schedule New Report</Button>
              <p className="text-xs text-muted-foreground">
                Click to simulate report scheduling (shows toast only)
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Active Reports</h3>
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="p-2 text-left text-sm font-medium">Report Name</th>
                      <th className="p-2 text-left text-sm font-medium">Schedule</th>
                      <th className="p-2 text-left text-sm font-medium">Last Run</th>
                      <th className="p-2 text-left text-sm font-medium">Status</th>
                      <th className="p-2 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockReports.map((report) => (
                      <tr key={report.id} className="border-b last:border-0">
                        <td className="p-2 text-sm font-medium">{report.name}</td>
                        <td className="p-2 text-sm">{report.schedule}</td>
                        <td className="p-2 text-sm">{report.lastRun}</td>
                        <td className="p-2 text-sm">
                          <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
                            {report.status}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Button size="sm" variant="outline">Configure</Button>
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
