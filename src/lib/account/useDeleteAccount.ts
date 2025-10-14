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
      const { data, error } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
      });

      if (error) {
        console.error('Delete account error:', error);
        toast.error('Failed to delete account', {
          description: error.message,
        });
        return { success: false, error: error.message };
      }

      if (!data.success) {
        // Sole admin or other blocking condition
        if (data.error === 'sole_admin') {
          toast.error('Cannot delete account', {
            description: data.message,
            duration: 8000,
          });
        }
        return data;
      }

      // Success - user will be logged out automatically
      toast.success('Account deleted', {
        description: data.message,
      });

      // Sign out (will redirect via auth listener)
      await supabase.auth.signOut();

      return { success: true, message: data.message };
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
