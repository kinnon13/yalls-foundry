import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperAdminCheck } from '@/hooks/useSuperAdminCheck';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Lock } from 'lucide-react';
import { toast } from 'sonner';

export function SuperAndyAccess() {
  const { isSuperAdmin } = useSuperAdminCheck();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  if (!isSuperAdmin) return null;

  const handleAccess = async () => {
    // Simple client-side password check (you can add server-side validation)
    setIsChecking(true);
    
    // Simulate checking
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (password === 'super-andy-2025') {
      navigate('/super-andy');
    } else {
      toast.error('Incorrect password');
    }
    
    setIsChecking(false);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle>Super Andy</CardTitle>
        </div>
        <CardDescription>
          Everything AI workspace with full access to knowledge, memory, tasks, files, and complete system control
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAccess()}
            disabled={isChecking}
          />
          <Button onClick={handleAccess} disabled={isChecking}>
            <Lock className="h-4 w-4 mr-2" />
            Access
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Password required for super admin access
        </p>
      </CardContent>
    </Card>
  );
}
