import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, Trophy } from 'lucide-react';

interface IncentiveEnrollment {
  program_id: string;
  status: string;
  start_date?: string;
  end_date?: string;
  verified_at?: string;
  incentive_programs: {
    code: string;
    name: string;
    description?: string;
  };
}

interface IncentiveProgramsProps {
  enrollments: IncentiveEnrollment[];
}

export function IncentivePrograms({ enrollments }: IncentiveProgramsProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'eligible':
      case 'verified':
        return <Badge className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" />Eligible</Badge>;
      case 'expired':
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Not Eligible</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Incentive Programs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {enrollments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No incentive program enrollments
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid Dates</TableHead>
                <TableHead>Verified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => (
                <TableRow key={enrollment.program_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{enrollment.incentive_programs.name}</p>
                      <p className="text-sm text-muted-foreground">{enrollment.incentive_programs.code}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                  <TableCell className="text-sm">
                    {enrollment.start_date && (
                      <div>
                        {new Date(enrollment.start_date).toLocaleDateString()}
                        {enrollment.end_date && (
                          <> - {new Date(enrollment.end_date).toLocaleDateString()}</>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {enrollment.verified_at ? (
                      <Badge variant="outline" className="text-xs">
                        {new Date(enrollment.verified_at).toLocaleDateString()}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
