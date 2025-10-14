/**
 * Auth Panel for Control Room
 * 
 * Displays current session and provides impersonation tools.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession } from '@/lib/auth/context';
import type { Role } from '@/lib/auth/rbac';
import { User, LogOut, Shield } from 'lucide-react';

const roles: Role[] = ['admin', 'moderator', 'business_owner', 'rider', 'breeder', 'owner', 'guest'];

export function AuthPanel() {
  const { session, signIn, signOut } = useSession();
  const [selectedRole, setSelectedRole] = useState<Role>('guest');

  const handleImpersonate = async () => {
    const email = `dev-${selectedRole}@yalls.ai`;
    await signIn(email, selectedRole);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Auth Session
        </CardTitle>
        <CardDescription>Current session and impersonation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Session */}
        {session ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Signed in as:</span>
            </div>
            <div className="pl-6 space-y-1">
              <p className="text-sm">{session.email}</p>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="capitalize">
                  {session.role.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ID: {session.userId}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
              <Link to="/profile/horse_1">
                <Button variant="outline" size="sm">
                  View Sample Profile
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Not signed in</p>
            <Link to="/login">
              <Button size="sm" className="w-full">
                Go to Login
              </Button>
            </Link>
          </div>
        )}

        {/* Impersonation Tools */}
        <div className="pt-4 border-t space-y-3">
          <p className="text-sm font-medium">Quick Impersonate</p>
          <div className="flex gap-2">
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as Role)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleImpersonate} size="sm">
              Switch
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
