import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeleteAccountResult {
  success: boolean;
  error?: string;
  message?: string;
  business_ids?: string[];
}

export function useDeleteAccount() {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAccount = async (): Promise<DeleteAccountResult> => {
    setIsDeleting(true);

    try {
      // Step 1: Call prepare RPC (anonymize profile, clear claims, check sole admin)
      const { data, error: prepareError } = await supabase.rpc('delete_account_prepare');

      if (prepareError) {
        console.error('Delete prepare error:', prepareError);
        toast.error('Failed to delete account', {
          description: prepareError.message,
        });
        return { success: false, error: prepareError.message };
      }

      // Cast RPC response to expected shape
      const prepareData = data as unknown as DeleteAccountResult & { profile_id?: string };

      // Check if blocked by sole admin
      if (!prepareData.success) {
        if (prepareData.error === 'sole_admin') {
          toast.error('Cannot delete account', {
            description: prepareData.message,
            duration: 8000,
          });
          return { 
            success: false, 
            error: prepareData.error, 
            message: prepareData.message,
            business_ids: prepareData.business_ids 
          };
        }
        return { success: false, error: prepareData.error, message: prepareData.message };
      }

      // Step 2: Success - profile anonymized, entities unclaimed
      toast.success('Account anonymized', {
        description: prepareData.message || 'Account successfully deleted',
      });

      // Step 3: Sign out (auth user still exists but profile is tombstoned)
      await supabase.auth.signOut();

      return { success: true, message: prepareData.message };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Delete account exception:', err);
      toast.error('Failed to delete account', {
        description: message,
      });
      return { success: false, error: message };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteAccount,
    isDeleting,
  };
}
