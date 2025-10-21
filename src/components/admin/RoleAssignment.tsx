/**
 * Quick Role Assignment Tool
 * For assigning admin rocker roles to test accounts
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, UserPlus } from 'lucide-react';

export function RoleAssignment() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'moderator' | 'super_admin'>('admin');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignRole = async () => {
    if (!email) {
      toast.error('Please enter an email');
      return;
    }

    setIsAssigning(true);
    try {
      // Since we can't easily lookup by email in auth schema,
      // this is mainly for manual role assignment via user ID
      toast.info('Use "Assign to Myself" button if you are logged in, or contact admin for role assignment');
    } catch (error: any) {
      console.error('Role assignment error:', error);
      toast.error(error.message || 'Failed to assign role');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignToCurrentUser = async () => {
    setIsAssigning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Not logged in');
        return;
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: role,
        });

      if (error) {
        if (error.message?.includes('duplicate')) {
          toast.info('You already have this role');
        } else {
          throw error;
        }
      } else {
        toast.success(`Successfully assigned ${role} role to yourself!`);
      }
    } catch (error: any) {
      console.error('Role assignment error:', error);
      toast.error(error.message || 'Failed to assign role');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Assignment Tool
        </CardTitle>
        <CardDescription>
          Assign admin rocker or other roles to test accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">User Email (for reference)</label>
          <Input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled
          />
          <p className="text-xs text-muted-foreground">
            For security, email lookup is disabled. Use "Assign to Myself" instead.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Role</label>
          <Select value={role} onValueChange={(v: any) => setRole(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin Rocker</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleAssignToCurrentUser}
            disabled={isAssigning}
            className="w-full gap-2"
          >
            <Shield className="h-4 w-4" />
            Assign {role} Role to Myself
          </Button>
        </div>

        <div className="p-3 rounded-lg bg-muted/50 text-xs">
          <p className="font-medium mb-1">Quick Setup:</p>
          <ol className="space-y-1 list-decimal list-inside">
            <li>Create account at /auth?mode=signup</li>
            <li>Come back here and assign yourself the role</li>
            <li>Refresh and access /admin-rocker</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
