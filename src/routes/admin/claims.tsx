import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, AlertTriangle, FileText, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

type Claim = {
  id: string;
  entity_id: string;
  claimant_user_id: string;
  method: string;
  contact_target: string | null;
  evidence: any;
  status: string;
  created_at: string;
  first_seen_at: string | null;
  entities: {
    display_name: string;
    kind: string;
    provenance: any;
  };
  profiles: {
    display_name: string;
  } | null;
};

export default function AdminClaims() {
  const { toast } = useToast();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [conflicts, setConflicts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchClaims = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('entity_claims')
      .select(`
        *,
        entities!inner(display_name, kind, provenance)
      `)
      .order('created_at', { ascending: false })
      .then(async (result) => {
        if (result.error) return result;
        
        let filtered = result.data || [];
        
        if (statusFilter !== 'all') {
          filtered = filtered.filter(c => c.status === statusFilter);
        }
        
        if (kindFilter !== 'all') {
          filtered = filtered.filter(c => c.entities.kind === kindFilter);
        }
        
        // Fetch profiles separately
        const claimantIds = [...new Set(filtered.map(c => c.claimant_user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', claimantIds);
        
        const profilesMap = new Map(
          (profilesData || []).map(p => [p.user_id, p])
        );
        
        return {
          data: filtered.map(c => ({
            ...c,
            profiles: profilesMap.get(c.claimant_user_id) || null
          })),
          error: null
        };
      });

    if (error) {
      toast({ title: 'Error', description: 'Failed to load claims', variant: 'destructive' });
    } else {
      setClaims(data as any[]);
      
      // Calculate conflicts
      const entityCounts: Record<string, number> = {};
      (data || []).forEach(claim => {
        if (claim.status === 'pending') {
          entityCounts[claim.entity_id] = (entityCounts[claim.entity_id] || 0) + 1;
        }
      });
      setConflicts(entityCounts);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter, kindFilter]);

  const handleApprove = async (claimId: string) => {
    try {
      const { error } = await supabase.rpc('entity_claim_approve', { p_claim_id: claimId });
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Claim approved successfully' });
      fetchClaims();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve claim',
        variant: 'destructive'
      });
    }
  };

  const handleReject = async () => {
    if (!selectedClaim || !rejectReason.trim()) {
      toast({ title: 'Error', description: 'Please provide a reason', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.rpc('entity_claim_reject', {
        p_claim_id: selectedClaim.id,
        p_reason: rejectReason
      });
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Claim rejected' });
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedClaim(null);
      fetchClaims();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject claim',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', icon: Clock },
      approved: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: XCircle }
    };
    
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Claim Review Queue</h1>
        <p className="text-muted-foreground">Review and approve entity ownership claims</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Entity Type</Label>
              <Select value={kindFilter} onValueChange={setKindFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="horse">Horse</SelectItem>
                  <SelectItem value="person">Person</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading claims...
          </CardContent>
        </Card>
      ) : claims.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No claims found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <Card key={claim.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{claim.entities.display_name}</h3>
                          <Badge variant="outline">{claim.entities.kind}</Badge>
                          {conflicts[claim.entity_id] > 1 && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Conflict ({conflicts[claim.entity_id]})
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Claimant: {claim.profiles?.display_name || 'Unknown'}
                        </p>
                      </div>
                      {getStatusBadge(claim.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Method:</span>
                        <span className="ml-2 font-medium capitalize">{claim.method}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Submitted:</span>
                        <span className="ml-2 font-medium">
                          {formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {claim.contact_target && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Contact:</span>
                          <span className="ml-2 font-medium">{claim.contact_target}</span>
                        </div>
                      )}
                      {claim.entities.provenance && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Source:</span>
                          <span className="ml-2 font-medium">
                            {claim.entities.provenance.source || 'Unknown'}
                          </span>
                        </div>
                      )}
                    </div>

                    {claim.evidence?.notes && (
                      <div className="bg-muted/50 rounded p-3 text-sm">
                        <p className="font-medium mb-1">Notes:</p>
                        <p className="text-muted-foreground">{claim.evidence.notes}</p>
                      </div>
                    )}

                    {claim.evidence?.files && claim.evidence.files.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4" />
                        <span>{claim.evidence.files.length} supporting document(s)</span>
                      </div>
                    )}
                  </div>

                  {claim.status === 'pending' && (
                    <div className="flex flex-col gap-2 md:w-40">
                      <Button
                        onClick={() => handleApprove(claim.id)}
                        className="w-full"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedClaim(claim);
                          setRejectDialogOpen(true);
                        }}
                        variant="destructive"
                        className="w-full"
                        size="sm"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Claim</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this claim. The claimant will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this claim is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
