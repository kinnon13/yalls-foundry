/**
 * Role Assignment Tool Page
 * Quick access page for assigning roles during testing
 */

import { RoleAssignment } from '@/components/admin/RoleAssignment';
import { Helmet } from 'react-helmet-async';

export default function RoleToolPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <Helmet>
        <title>Role Assignment Tool</title>
      </Helmet>
      
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Role Assignment Tool</h1>
          <p className="text-muted-foreground mt-2">
            Assign admin rocker and other roles for testing
          </p>
        </div>

        <RoleAssignment />

        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <h3 className="font-semibold">How to Test Admin Rocker:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Go to <code className="px-1 py-0.5 rounded bg-background">/auth?mode=signup</code> to create an account</li>
            <li>After creating account, return here to <code className="px-1 py-0.5 rounded bg-background">/admin/role-tool</code></li>
            <li>Select "Admin Rocker" role and click "Assign to Myself"</li>
            <li>Refresh the page</li>
            <li>Navigate to <code className="px-1 py-0.5 rounded bg-background">/admin-rocker</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
