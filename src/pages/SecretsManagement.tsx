import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, RefreshCw } from 'lucide-react';
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
  const [saving, setSaving] = useState(false);
  const [keyName, setKeyName] = useState('default');
  const [apiKey, setApiKey] = useState('');

  const loadSecrets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('secrets-manage', {
        method: 'GET'
      });

      if (error) throw error;
      setSecrets(data?.items || []);
    } catch (error: any) {
      toast.error('Failed to load secrets: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('secrets-manage', {
        body: {
          provider: 'openai',
          name: keyName.trim().toLowerCase(),
          apiKey: apiKey
        }
      });

      if (error) throw error;
      
      toast.success('OpenAI API key saved successfully');
      setApiKey('');
      setKeyName('default');
      await loadSecrets();
    } catch (error: any) {
      toast.error('Failed to save API key: ' + error.message);
    } finally {
      setSaving(false);
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
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="default"
                required
              />
              <p className="text-xs text-muted-foreground">
                Use "default" or "openai" to work with the chat
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apiKey">OpenAI API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Your key will be encrypted and stored securely
              </p>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save API Key'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
