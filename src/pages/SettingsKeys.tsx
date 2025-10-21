import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Key } from "lucide-react";

interface SavedKey {
  id: string;
  provider: string;
  name: string;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

export default function SettingsKeys() {
  const [items, setItems] = useState<SavedKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState("");
  const [name, setName] = useState("default");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  const loadKeys = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("secrets-manage", {
        method: "GET",
      });

      if (error) throw error;
      setItems(data.items || []);
    } catch (error) {
      console.error("Failed to load keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider.trim() || !apiKey.trim()) {
      toast.error("Provider and API key are required");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("secrets-manage", {
        body: { provider: provider.trim(), name: name.trim(), apiKey: apiKey.trim() },
      });

      if (error) throw error;
      
      toast.success(`API key for ${provider} saved securely`);
      setProvider("");
      setName("default");
      setApiKey("");
      await loadKeys();
    } catch (error) {
      console.error("Failed to save key:", error);
      toast.error("Failed to save API key");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete this key?`)) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/secrets-manage`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Delete failed");
      }
      
      toast.success("API key deleted");
      await loadKeys();
    } catch (error) {
      console.error("Failed to delete key:", error);
      toast.error("Failed to delete API key");
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Key className="h-8 w-8" />
          API Keys
        </h1>
        <p className="text-muted-foreground mt-2">
          Securely store provider API keys. Keys are encrypted server-side and never exposed to the browser.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add API Key</CardTitle>
          <CardDescription>
            Save keys for OpenAI, Anthropic, Google, Twilio, or other providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                placeholder="e.g., openai, anthropic, google"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                placeholder="default"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Key"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Keys</CardTitle>
          <CardDescription>
            {items.length === 0 ? "No keys saved yet" : `${items.length} key(s) stored`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">Add your first API key above to get started.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {item.provider} / {item.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Updated: {new Date(item.updated_at).toLocaleString()}
                      {item.last_used_at && (
                        <> · Last used: {new Date(item.last_used_at).toLocaleString()}</>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
