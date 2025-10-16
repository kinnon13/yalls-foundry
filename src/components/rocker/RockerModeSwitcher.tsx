/**
 * Rocker Mode Switcher
 * 
 * Allows admins to switch between user and admin modes
 * with confirmation and automatic conversation reset
 */

import { Shield, User, Brain, AlertTriangle } from 'lucide-react';
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
import { AI_PROFILES, type AIRole } from '@/lib/ai/rocker/config';

export function RockerModeSwitcher() {
  const { actorRole, setActorRole, clearMessages, createNewConversation } = useRockerGlobal();
  const { isAdmin } = useAdminCheck();
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetRole, setTargetRole] = useState<AIRole>('user');

  // Only admins can switch modes
  if (!isAdmin) return null;

  const handleSwitchRequest = (newRole: AIRole) => {
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

  const modes: { role: AIRole; icon: typeof User }[] = [
    { role: 'user', icon: User },
    { role: 'admin', icon: Shield },
    { role: 'knower', icon: Brain },
  ];

  return (
    <>
      <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
        <span className="text-xs font-medium text-muted-foreground">Mode:</span>
        <div className="flex gap-1">
          {modes.map(({ role, icon: Icon }) => {
            const profile = AI_PROFILES[role];
            const isActive = actorRole === role;
            
            return (
              <Button
                key={role}
                size="sm"
                variant={isActive ? (role === 'admin' ? 'destructive' : 'default') : 'ghost'}
                onClick={() => handleSwitchRequest(role)}
                className="h-7 gap-1.5 text-xs"
              >
                <Icon className="h-3 w-3" />
                {profile.name}
              </Button>
            );
          })}
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Switch to {AI_PROFILES[targetRole].name} Mode?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {targetRole === 'admin' && (
                <>
                  <p className="font-semibold text-destructive">⚠️ Admin mode grants full system access</p>
                  <p>You'll have access to:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                    {AI_PROFILES.admin.capabilities.map((cap) => (
                      <li key={cap}>{cap}</li>
                    ))}
                  </ul>
                  <p className="text-xs mt-2">All admin actions are logged and audited.</p>
                </>
              )}
              {targetRole === 'knower' && (
                <>
                  <p className="font-semibold">🧠 Knower mode accesses global intelligence</p>
                  <p>Andy can see:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                    {AI_PROFILES.knower.capabilities.slice(0, 4).map((cap) => (
                      <li key={cap}>{cap}</li>
                    ))}
                  </ul>
                  <p className="text-xs mt-2">Only anonymized, aggregated data - never individual user info.</p>
                </>
              )}
              {targetRole === 'user' && (
                <>
                  <p>Switching to User Mode will restrict access to admin and analytics tools.</p>
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
              Switch to {AI_PROFILES[targetRole].name} Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
