import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Key, Plus, RefreshCw } from "lucide-react";

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
  const [showAddForm, setShowAddForm] = useState(false);

  const loadKeys = async () => {
    try {
      setLoading(true);
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
        body: { provider: provider.trim().toLowerCase(), name: (name.trim() || "default").toLowerCase(), apiKey: apiKey.trim() },
      });

      if (error) throw error;
      
      toast.success(`API key for ${provider} saved securely`);
      setProvider("");
      setName("default");
      setApiKey("");
      setShowAddForm(false);
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
      
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success("API key deleted");
      await loadKeys();
    } catch (error) {
      console.error("Failed to delete key:", error);
      toast.error("Failed to delete API key");
    }
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
              <Key className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">API Keys</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Securely manage your integration keys
              </p>
            </div>
          </div>
        </div>
        <Button 
          onClick={loadKeys} 
          disabled={loading} 
          size="icon" 
          variant="outline"
          className="h-10 w-10 rounded-xl"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Add Key Card */}
      {!showAddForm ? (
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => setShowAddForm(true)}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-12 w-12 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-3 transition-colors">
                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Add New API Key</p>
              <p className="text-xs text-muted-foreground">
                Store keys for OpenAI, Anthropic, Google, or other providers
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Add New API Key</CardTitle>
                <CardDescription className="mt-1">
                  Keys are encrypted and stored securely
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setProvider("");
                  setName("default");
                  setApiKey("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="provider" className="text-sm font-medium">Provider</Label>
                <Input
                  id="provider"
                  placeholder="e.g., openai, anthropic, google"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Name (optional)</Label>
                <Input
                  id="name"
                  placeholder="default"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-sm font-medium">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  className="h-11 font-mono"
                />
              </div>
              <Button type="submit" disabled={saving} className="w-full h-11 text-sm font-medium">
                {saving ? "Saving..." : "Save API Key"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Saved Keys */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Saved Keys
          </h2>
          <span className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${items.length} key${items.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <Key className="h-8 w-8 animate-pulse text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">Loading keys...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <Key className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No API keys yet</p>
                <p className="text-xs text-muted-foreground">
                  Add your first key to get started
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className="group hover:shadow-md hover:border-primary/20 transition-all duration-200"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground capitalize">
                          {item.provider}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Updated {new Date(item.updated_at).toLocaleDateString()}</span>
                        {item.last_used_at && (
                          <>
                            <span>•</span>
                            <span>Last used {new Date(item.last_used_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-9 w-9 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
