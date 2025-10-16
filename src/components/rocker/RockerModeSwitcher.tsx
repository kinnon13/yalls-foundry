/**
 * Rocker Mode Switcher
 * 
 * Allows admins to switch between user and admin modes
 * with confirmation and automatic conversation reset
 */

import { Shield, User, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useRockerGlobal } from '@/lib/ai/rocker/context';
import { useAdminCheck } from '@/hooks/useAdminCheck';

export function RockerModeSwitcher() {
  const { actorRole, setActorRole, clearMessages, createNewConversation } = useRockerGlobal();
  const { isAdmin } = useAdminCheck();
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetRole, setTargetRole] = useState<'user' | 'admin'>('user');

  // Only admins can switch modes
  if (!isAdmin) return null;

  const handleSwitchRequest = (newRole: 'user' | 'admin') => {
    if (newRole === actorRole) return;
    setTargetRole(newRole);
    setShowConfirm(true);
  };

  const handleConfirmSwitch = async () => {
    // Clear current conversation
    clearMessages();
    
    // Switch role
    setActorRole(targetRole);
    
    // Start new conversation in new mode
    await createNewConversation();
    
    setShowConfirm(false);
  };

  return (
    <>
      <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
        <span className="text-xs font-medium text-muted-foreground">Mode:</span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={actorRole === 'user' ? 'default' : 'ghost'}
            onClick={() => handleSwitchRequest('user')}
            className="h-7 gap-1.5 text-xs"
          >
            <User className="h-3 w-3" />
            User
          </Button>
          <Button
            size="sm"
            variant={actorRole === 'admin' ? 'destructive' : 'ghost'}
            onClick={() => handleSwitchRequest('admin')}
            className="h-7 gap-1.5 text-xs"
          >
            <Shield className="h-3 w-3" />
            Admin
          </Button>
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Switch to {targetRole === 'admin' ? 'Admin' : 'User'} Mode?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {targetRole === 'admin' ? (
                <>
                  <p className="font-semibold text-destructive">⚠️ Admin mode grants full system access</p>
                  <p>You'll have access to:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                    <li>System-wide data queries</li>
                    <li>User management operations</li>
                    <li>Platform configuration</li>
                    <li>Content moderation tools</li>
                  </ul>
                  <p className="text-xs mt-2">All admin actions are logged and audited.</p>
                </>
              ) : (
                <>
                  <p>Switching to User Mode will restrict access to admin-only tools.</p>
                  <p className="text-sm">Your conversation will restart in personal assistant mode.</p>
                </>
              )}
              <p className="font-medium mt-3">Your current conversation will be ended and a new one will start.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSwitch}
              className={targetRole === 'admin' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              Switch to {targetRole === 'admin' ? 'Admin' : 'User'} Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
