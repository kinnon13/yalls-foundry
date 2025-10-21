import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Secret {
  id: string;
  provider: string;
  name: string;
  masked_key: string;
  last_used_at: string | null;
  created_at: string;
}

export default function SecretsManagement() {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadSecrets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('secrets-manage', {
        method: 'GET'
      });

      if (error) throw error;
      setSecrets(data?.secrets || []);
    } catch (error: any) {
      toast.error('Failed to load secrets: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSecret = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase.functions.invoke('secrets-manage', {
        body: { id },
        method: 'DELETE'
      });

      if (error) throw error;
      toast.success('Secret deleted successfully');
      await loadSecrets();
    } catch (error: any) {
      toast.error('Failed to delete secret: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    loadSecrets();
  }, []);

  const openaiSecrets = secrets.filter(s => s.provider === 'openai');

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">OpenAI API Keys Management</h1>
        <Button onClick={loadSecrets} disabled={loading} size="icon" variant="outline">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current OpenAI Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : openaiSecrets.length === 0 ? (
            <p className="text-muted-foreground">No OpenAI keys found. Add one below to get started.</p>
          ) : (
            <div className="space-y-3">
              {openaiSecrets.map((secret) => (
                <div key={secret.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {secret.provider}/{secret.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {secret.masked_key}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Last used: {secret.last_used_at ? new Date(secret.last_used_at).toLocaleString() : 'Never'}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteSecret(secret.id)}
                    disabled={deleting === secret.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add New OpenAI Key</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Click below to add a new OpenAI API key. You'll be prompted to enter your key securely.
          </p>
          <Button onClick={() => {
            toast.info('Please use the Settings page or contact support to add new API keys.');
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add OpenAI API Key
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Note: Keys should be saved with provider "openai" and name "default" or "openai" to work with the chat.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
