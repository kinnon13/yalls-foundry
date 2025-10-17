import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/lib/auth/context';

type ClaimMethod = 'email' | 'sms' | 'manual';

type Entity = {
  id: string;
  kind: string;
  display_name: string;
  status: string;
  provenance: any;
};

export default function ClaimEntity() {
  const { entityId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useSession();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<ClaimMethod>('email');
  const [contactTarget, setContactTarget] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [claimId, setClaimId] = useState<string | null>(null);

  useEffect(() => {
    if (!entityId) return;
    
    supabase
      .from('entities')
      .select('*')
      .eq('id', entityId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          toast({ title: 'Error', description: 'Failed to load entity', variant: 'destructive' });
          navigate('/');
        } else {
          setEntity(data);
          if (data.status !== 'unclaimed') {
            toast({ title: 'Notice', description: 'This entity has already been claimed' });
            navigate('/');
          }
        }
      });
  }, [entityId, navigate, toast]);

  const handleMethodSelect = () => {
    if (!method) {
      toast({ title: 'Error', description: 'Please select a claim method', variant: 'destructive' });
      return;
    }
    setStep(2);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const uploadEvidence = async (claimId: string): Promise<string[]> => {
    const uploadedPaths: string[] = [];
    
    for (const file of files) {
      const filePath = `${session?.userId}/${claimId}/${file.name}`;
      const { error } = await supabase.storage
        .from('entity-claims')
        .upload(filePath, file);
      
      if (!error) {
        uploadedPaths.push(filePath);
      }
    }
    
    return uploadedPaths;
  };

  const handleSubmit = async () => {
    if (!session?.userId) {
      toast({ title: 'Error', description: 'Please sign in to claim', variant: 'destructive' });
      return;
    }

    setLoading(true);
    
    try {
      const { data: newClaimId, error: claimError } = await supabase.rpc('entity_claim_start', {
        p_entity_id: entityId,
        p_method: method,
        p_contact_target: contactTarget || null
      });

      if (claimError) throw claimError;

      const evidencePaths = await uploadEvidence(newClaimId);

      await supabase
        .from('entity_claims')
        .update({
          evidence: {
            files: evidencePaths.map(path => ({ path })),
            notes
          }
        })
        .eq('id', newClaimId);

      await supabase.rpc('rocker_log_action', {
        p_user_id: session.userId,
        p_agent: 'rocker',
        p_action: 'claim_entity_submitted',
        p_input: { entity_id: entityId, method, claim_id: newClaimId },
        p_output: { success: true },
        p_result: 'success'
      });

      setClaimId(newClaimId);
      setStep(3);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit claim',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!entity) return null;

  const progress = (step / 3) * 100;

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6">
        <Progress value={progress} className="mb-2" />
        <p className="text-sm text-muted-foreground">Step {step} of 3</p>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Claim: {entity.display_name}</CardTitle>
            <CardDescription>
              Choose how you'd like to verify your claim to this {entity.kind}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base mb-3 block">Verification Method</Label>
              <RadioGroup value={method} onValueChange={(v) => setMethod(v as ClaimMethod)}>
                <div className="flex items-center space-x-2 border rounded-lg p-4">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="flex-1 cursor-pointer">
                    <div className="font-medium">Email Verification</div>
                    <div className="text-sm text-muted-foreground">We'll send a code to verify ownership</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4">
                  <RadioGroupItem value="sms" id="sms" />
                  <Label htmlFor="sms" className="flex-1 cursor-pointer">
                    <div className="font-medium">SMS Verification</div>
                    <div className="text-sm text-muted-foreground">Verify via text message</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="flex-1 cursor-pointer">
                    <div className="font-medium">Manual Review</div>
                    <div className="text-sm text-muted-foreground">Upload documents for admin review</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleMethodSelect} className="flex-1">
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Provide Verification Details</CardTitle>
            <CardDescription>
              {method === 'email' && 'Enter the email address associated with this entity'}
              {method === 'sms' && 'Enter the phone number associated with this entity'}
              {method === 'manual' && 'Upload supporting documents and provide details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(method === 'email' || method === 'sms') && (
              <div>
                <Label htmlFor="contact">{method === 'email' ? 'Email Address' : 'Phone Number'}</Label>
                <Input
                  id="contact"
                  type={method === 'email' ? 'email' : 'tel'}
                  placeholder={method === 'email' ? 'contact@example.com' : '+1 (555) 000-0000'}
                  value={contactTarget}
                  onChange={(e) => setContactTarget(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Provide any additional context or information about your claim..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="files">Supporting Documents (Optional)</Label>
              <div className="mt-2 border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <input
                  id="files"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Label htmlFor="files" className="cursor-pointer">
                  <span className="text-sm text-primary hover:underline">Click to upload</span>
                  <span className="text-sm text-muted-foreground"> or drag and drop</span>
                </Label>
                {files.length > 0 && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    {files.length} file(s) selected
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? 'Submitting...' : 'Submit Claim'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <CardTitle>Claim Submitted Successfully!</CardTitle>
                <CardDescription>Your claim is pending review</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm">
                <strong>What happens next?</strong>
              </p>
              <ul className="text-sm space-y-1 ml-4 list-disc text-muted-foreground">
                <li>Our team will review your claim within 2-3 business days</li>
                <li>You'll receive a notification once your claim is approved or if we need more information</li>
                <li>Once approved, you'll have full control over this profile</li>
              </ul>
            </div>

            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <p className="text-sm font-medium mb-2">🤖 Rocker can help!</p>
              <p className="text-sm text-muted-foreground mb-3">
                While you wait, I can help you prepare your storefront and create your first posts.
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                Get Started with Rocker
              </Button>
            </div>

            <Button onClick={() => navigate('/')} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
