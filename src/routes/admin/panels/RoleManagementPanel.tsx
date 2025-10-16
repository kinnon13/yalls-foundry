/**
 * Role Management Panel - Super Admin & Admin Only
 * Allows super admins to grant/revoke any role
 * Allows admins to grant/revoke moderator role only
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { useSuperAdminCheck } from '@/hooks/useSuperAdminCheck';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, UserPlus, UserX, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';

type AppRole = 'super_admin' | 'admin' | 'moderator' | 'user';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  granted_by: string | null;
  granted_at: string;
}

export function RoleManagementPanel() {
  const { session } = useSession();
  const { isSuperAdmin } = useSuperAdminCheck();
  const queryClient = useQueryClient();
  
  const [targetUserId, setTargetUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  
  // Fetch all user roles
  const { data: userRoles, isLoading } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('granted_at', { ascending: false });
      
      if (error) throw error;
      return data as UserRole[];
    },
  });
  
  // Grant role mutation
  const grantRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role,
          granted_by: session?.userId,
        } as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('Role granted successfully');
      setTargetUserId('');
    },
    onError: (error: any) => {
      toast.error(`Failed to grant role: ${error.message}`);
    },
  });
  
  // Revoke role mutation
  const revokeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      toast.success('Role revoked successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to revoke role: ${error.message}`);
    },
  });
  
  const handleGrantRole = () => {
    if (!targetUserId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }
    
    grantRoleMutation.mutate({ userId: targetUserId, role: selectedRole });
  };
  
  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'super_admin': return 'default';
      case 'admin': return 'secondary';
      case 'moderator': return 'outline';
      default: return 'outline';
    }
  };
  
  const availableRoles: AppRole[] = isSuperAdmin 
    ? ['super_admin', 'admin', 'moderator', 'user']
    : ['moderator'];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Management
        </CardTitle>
        <CardDescription>
          {isSuperAdmin 
            ? 'Super Admin: Grant or revoke any role' 
            : 'Admin: Grant or revoke moderator roles'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {isSuperAdmin ? (
              <>
                As a super admin, you can grant any role. Only super admins can grant admin roles.
                Get user IDs from the backend database.
              </>
            ) : (
              <>
                As an admin, you can only grant or revoke moderator roles.
              </>
            )}
          </AlertDescription>
        </Alert>
        
        {/* Grant Role Form */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
          <h3 className="font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Grant Role
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              placeholder="Enter user ID (UUID)"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleGrantRole}
            disabled={grantRoleMutation.isPending}
            className="w-full"
          >
            {grantRoleMutation.isPending ? 'Granting...' : 'Grant Role'}
          </Button>
        </div>
        
        {/* Current Roles List */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Active Roles
          </h3>
          
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading roles...</div>
          ) : userRoles && userRoles.length > 0 ? (
            <div className="space-y-2">
              {userRoles.map((userRole) => (
                <div
                  key={userRole.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(userRole.role)}>
                        {userRole.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <code className="text-xs text-muted-foreground">
                        {userRole.user_id.substring(0, 8)}...
                      </code>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Granted: {new Date(userRole.granted_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => revokeRoleMutation.mutate(userRole.id)}
                    disabled={revokeRoleMutation.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No roles assigned yet
            </div>
          )}
        </div>
        
        {/* Warning for first setup */}
        {(!userRoles || userRoles.length === 0) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No roles found. You need to manually insert your first super_admin role via the backend SQL editor.
              Use: <code className="bg-muted px-1 py-0.5 rounded">
                INSERT INTO user_roles (user_id, role) VALUES ('your-user-id', 'super_admin');
              </code>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
