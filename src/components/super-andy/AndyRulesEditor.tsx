/**
 * Andy Rules Editor - Hardwired System Rules
 * Add permanent instructions and behaviors to Andy's system prompt
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Rule {
  id: string;
  rule_text: string;
  priority: number;
  active: boolean;
  created_at: string;
}

export function AndyRulesEditor() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('andy_system_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRule = async () => {
    if (!newRule.trim()) return;
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('andy_system_rules')
        .insert({
          user_id: user.id,
          rule_text: newRule.trim(),
          priority: rules.length + 1,
          active: true
        });

      if (error) throw error;

      setNewRule('');
      await loadRules();
      toast.success('Rule added - Andy will follow this from now on');
    } catch (error: any) {
      console.error('Failed to add rule:', error);
      toast.error('Failed to add rule: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('andy_system_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadRules();
      toast.success('Rule deleted');
    } catch (error: any) {
      toast.error('Failed to delete rule');
    }
  };

  const toggleRule = async (id: string, active: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('andy_system_rules')
        .update({ active: !active })
        .eq('id', id);

      if (error) throw error;
      await loadRules();
      toast.success(active ? 'Rule disabled' : 'Rule enabled');
    } catch (error: any) {
      toast.error('Failed to toggle rule');
    }
  };

  const DEFAULT_RULES = [
    'Always search the web when asked about current events or information you don\'t have',
    'Proactively tell me when you learn something new or find interesting information',
    'Ask clarifying questions before taking major actions',
    'Store important facts, preferences, and context in my memory for future reference'
  ];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Hardwired Rules ({rules.filter(r => r.active).length} active)
        </h3>
      </div>

      <div className="space-y-4">
        {/* Add new rule */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add a permanent rule for Andy's behavior... (e.g., 'Always tell me when you research something online')"
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            className="min-h-[80px]"
          />
          <Button 
            onClick={addRule} 
            disabled={!newRule.trim() || saving}
            size="sm"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Permanent Rule
          </Button>
        </div>

        {/* Quick add default rules */}
        {rules.length === 0 && (
          <Card className="p-3 bg-muted/50">
            <p className="text-xs font-medium mb-2">Suggested Rules:</p>
            <div className="space-y-2">
              {DEFAULT_RULES.map((rule, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => setNewRule(rule)}
                  className="w-full justify-start text-left h-auto py-2"
                >
                  <span className="text-xs">{rule}</span>
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Existing rules */}
        <div className="space-y-2">
          {loading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading rules...
            </p>
          )}
          {!loading && rules.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No rules yet. Add your first rule above.
            </p>
          )}
          {rules.map((rule, index) => (
            <Card 
              key={rule.id} 
              className={`p-3 ${!rule.active ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge variant={rule.active ? 'default' : 'secondary'}>
                  Rule #{index + 1}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleRule(rule.id, rule.active)}
                  >
                    {rule.active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteRule(rule.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <p className="text-sm">{rule.rule_text}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Added {new Date(rule.created_at).toLocaleDateString()}
              </p>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-3 bg-muted/50 mt-4">
        <p className="text-xs">
          <strong>How it works:</strong> Rules are automatically injected into Andy's system prompt on every message. Active rules are permanent and apply to all conversations.
        </p>
      </Card>
    </Card>
  );
}
