import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, AlertTriangle, Download, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface AccountDeletionFlowProps {
  userId: string;
}

export function AccountDeletionFlow({ userId }: AccountDeletionFlowProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleDeleteAccount = async () => {
    if (!understood) {
      toast({
        title: 'Please confirm',
        description: 'You must acknowledge the consequences before proceeding',
        variant: 'destructive'
      });
      return;
    }

    setIsDeleting(true);

    try {
      // Call the stored procedure to close the account
      const { data, error } = await supabase.rpc('sp_close_account' as any, {
        _profile_id: userId,
        _closure_reason: 'User requested account deletion',
        _export_data: true
      });

      if (error) throw error;

      toast({
        title: 'Account closed successfully',
        description: 'Your private data has been erased. Public records remain for historical accuracy.',
      });

      // Clear all cached data
      queryClient.clear();

      // Sign out and redirect
      await supabase.auth.signOut();
      
      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();
      
      navigate('/login');
    } catch (error: any) {
      console.error('Error closing account:', error);
      toast({
        title: 'Error closing account',
        description: error.message || 'Please try again or contact support',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportData = async () => {
    toast({
      title: 'Preparing export',
      description: 'Your data export will be ready shortly',
    });
    // TODO: Implement data export functionality
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">Delete Account</CardTitle>
        </div>
        <CardDescription>
          Permanently close your account and erase your private data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Export Data First */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-start gap-3">
            <Download className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <h4 className="font-medium mb-1">Before you go: Export your data</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Download a copy of your private information, messages, and memories before deletion
              </p>
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export My Data
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* What Stays Public */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            What stays public
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
            <li>Your name on event results and leaderboards</li>
            <li>Competition placings and public earnings</li>
            <li>Public event participation records</li>
            <li>Memories shared with others (anonymized authorship)</li>
          </ul>
        </div>

        {/* What Gets Erased */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            What gets erased
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
            <li>Email address, phone number, and contact information</li>
            <li>Private messages and conversations</li>
            <li>Private memories and personal notes</li>
            <li>Payment information and billing history</li>
            <li>Login credentials and device data</li>
          </ul>
        </div>

        {/* Shared Content Notice */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <h4 className="font-medium mb-2">Shared content</h4>
          <p className="text-sm text-muted-foreground">
            Memories you've shared with others will remain visible to them, but your authorship will be anonymized as "Former user"
          </p>
        </div>

        {/* Show detailed consequences */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full"
        >
          {showDetails ? 'Hide' : 'Show'} detailed consequences
        </Button>

        {showDetails && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <div>
              <h5 className="font-medium text-sm mb-1">Businesses & Horses</h5>
              <p className="text-sm text-muted-foreground">
                Entities you solely own will become "Unclaimed" unless transferred to another user beforehand
              </p>
            </div>
            <div>
              <h5 className="font-medium text-sm mb-1">Relationships</h5>
              <p className="text-sm text-muted-foreground">
                Connections you created will be removed, but relationships others verified about you may remain
              </p>
            </div>
            <div>
              <h5 className="font-medium text-sm mb-1">Historical Records</h5>
              <p className="text-sm text-muted-foreground">
                Event results are historical records and cannot be removed. Your profile will show as "Profile Closed"
              </p>
            </div>
          </div>
        )}

        <Separator />

        {/* Confirmation */}
        <div className="flex items-start gap-2">
          <Checkbox
            id="understand"
            checked={understood}
            onCheckedChange={(checked) => setUnderstood(checked as boolean)}
          />
          <label
            htmlFor="understand"
            className="text-sm leading-tight cursor-pointer"
          >
            I understand that this action is permanent and that my public records will remain for historical accuracy
          </label>
        </div>

        {/* Delete Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="w-full"
              disabled={!understood || isDeleting}
            >
              {isDeleting ? 'Closing Account...' : 'Delete My Account'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently erase your private data and close your account. 
                Public records will remain for historical accuracy. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, Delete My Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
