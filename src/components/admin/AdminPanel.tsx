/**
 * Admin Panel Component
 * Only accessible to admin users
 */

import { useRoles } from '@/hooks/useRoles';
import { useSuperAdminCheck } from '@/hooks/useSuperAdminCheck';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminIcon } from './AdminIcon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Database, Settings, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function AdminPanel() {
  const { isAdmin, isLoading } = useRoles();
  const { isSuperAdmin } = useSuperAdminCheck();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="border-amber-500/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AdminIcon />
          <div>
            <CardTitle>Admin Panel</CardTitle>
            <CardDescription>System management and configuration</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <Shield className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="data">
              <Database className="h-4 w-4 mr-2" />
              Data
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Rocker AI Status</span>
                    <span className="text-sm font-semibold text-green-500">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Database Connection</span>
                    <span className="text-sm font-semibold text-green-500">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Users</span>
                    <span className="text-sm font-semibold">Loading...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  User management features coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Data management features coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isSuperAdmin && (
                  <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Lock className="h-5 w-5 text-red-500 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-foreground">Super Admin Controls</h3>
                        <p className="text-sm text-muted-foreground">
                          Manage Rocker's capabilities and permissions. Only accessible to super admins.
                        </p>
                        <Link to="/admin/super-admin-controls">
                          <Button variant="outline" size="sm" className="mt-2">
                            <Lock className="h-4 w-4 mr-2" />
                            Open Controls
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Settings panel coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
