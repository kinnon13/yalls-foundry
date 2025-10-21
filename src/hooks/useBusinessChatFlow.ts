/**
 * Business Chat Onboarding Flow
 * Conversational state machine for collecting business info via Rocker
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type FlowStep = 
  | 'ask_name' 
  | 'ghost_match' 
  | 'ask_categories' 
  | 'ask_contact' 
  | 'ask_bio' 
  | 'review' 
  | 'saving' 
  | 'done';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Array<{
    label: string;
    value: string;
    type: 'claim' | 'category' | 'bio' | 'confirm';
  }>;
}

interface CollectedData {
  name: string;
  categories: Array<{ key: string; label: string; status: 'active' | 'pending' }>;
  website?: string;
  phone?: string;
  bio?: string;
  claimEntityId?: string;
}

export function useBusinessChatFlow() {
  const [step, setStep] = useState<FlowStep>('ask_name');
  const [messages, setMessages] = useState<Message[]>([]);
  const [collected, setCollected] = useState<Partial<CollectedData>>({});
  const [ghostMatches, setGhostMatches] = useState<any[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize with welcome message
  useEffect(() => {
    addBotMessage("I'll help you set up your business in under a minute. First, what's the business name?");
  }, []);

  const addBotMessage = useCallback((content: string, actions?: Message['actions']) => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content,
      timestamp: new Date(),
      actions
    }]);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      role: 'user',
      content,
      timestamp: new Date()
    }]);
  }, []);

  // Ghost match check
  const checkGhostMatch = useCallback(async (name: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('business-ghost-match', {
        body: { name, website: collected.website, phone: collected.phone }
      });

      if (error) throw error;

      if (data?.matches && data.matches.length > 0) {
        setGhostMatches(data.matches);
        
        const actions = data.matches.map((match: any) => ({
          label: `Claim "${match.name}" (${(match.score * 100).toFixed(0)}% match)`,
          value: match.entity_id,
          type: 'claim' as const
        }));
        
        actions.push({
          label: "Not mine - create new",
          value: 'new',
          type: 'claim' as const
        });

        addBotMessage(
          `I found some existing businesses that might be yours. Are any of these your business?`,
          actions
        );
        setStep('ghost_match');
      } else {
        // No matches, proceed to categories
        setStep('ask_categories');
        addBotMessage("Great! What does your business sell? Describe your products or services.");
      }
    } catch (error) {
      console.error('Ghost match error:', error);
      // Proceed anyway
      setStep('ask_categories');
      addBotMessage("Great! What does your business sell? Describe your products or services.");
    }
  }, [collected.website, collected.phone, addBotMessage]);

  // Classify business for categories
  const classifyBusiness = useCallback(async (description: string) => {
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('business-classify', {
        body: {
          name: collected.name,
          description,
          website: collected.website
        }
      });

      if (error) throw error;

      if (data?.categories) {
        setCategorySuggestions(data.categories);
        
        const actions = data.categories.map((cat: any) => ({
          label: cat.label,
          value: cat.key || cat.label,
          type: 'category' as const
        }));

        addBotMessage(
          "I think these categories fit your business. Select all that apply, or type new ones:",
          actions
        );
      }
    } catch (error) {
      console.error('Classification error:', error);
      addBotMessage("Let me know what categories best describe your business (type them out).");
    } finally {
      setIsProcessing(false);
    }
  }, [collected.name, collected.website, addBotMessage]);

  // Generate bio suggestions
  const generateBioSuggestions = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('business-generate-bio', {
        body: {
          name: collected.name,
          categories: collected.categories?.map(c => c.label),
          website: collected.website
        }
      });

      if (error) throw error;

      if (data?.suggestions) {
        const actions = data.suggestions.map((bio: string, idx: number) => ({
          label: bio.substring(0, 60) + '...',
          value: bio,
          type: 'bio' as const
        }));

        actions.push({
          label: "I'll add later",
          value: 'skip',
          type: 'bio' as const
        });

        addBotMessage("I wrote a few bio options for you:", actions);
      }
    } catch (error) {
      console.error('Bio generation error:', error);
      addBotMessage("Want to add a short bio now, or skip it?", [
        { label: "I'll add later", value: 'skip', type: 'bio' as const }
      ]);
    }
  }, [collected, addBotMessage]);

  // Handle user input
  const handleUserMessage = useCallback(async (text: string) => {
    addUserMessage(text);
    setIsProcessing(true);

    try {
      switch (step) {
        case 'ask_name':
          if (text.trim().length < 2) {
            addBotMessage("That name seems too short. What's the full business name?");
            break;
          }
          setCollected(prev => ({ ...prev, name: text.trim() }));
          await checkGhostMatch(text.trim());
          break;

        case 'ask_categories':
          // User typed categories or description
          if (text.length > 20) {
            // It's a description, classify it
            await classifyBusiness(text);
          } else {
            // Direct category names
            const categories = text.split(',').map(c => ({
              label: c.trim(),
              key: c.trim().toLowerCase().replace(/\s+/g, '-'),
              status: 'pending' as const
            }));
            setCollected(prev => ({ ...prev, categories }));
            setStep('ask_contact');
            addBotMessage("Perfect! What's your website or Instagram handle? (optional - press Enter to skip)");
          }
          break;

        case 'ask_contact':
          if (!collected.website) {
            // First contact question - website
            if (text.trim()) {
              setCollected(prev => ({ ...prev, website: text.trim() }));
            }
            addBotMessage("What's the best phone number to reach your business? (optional - press Enter to skip)");
          } else {
            // Second contact question - phone
            if (text.trim()) {
              setCollected(prev => ({ ...prev, phone: text.trim() }));
            }
            setStep('ask_bio');
            await generateBioSuggestions();
          }
          break;

        case 'ask_bio':
          setCollected(prev => ({ ...prev, bio: text.trim() }));
          setStep('review');
          break;

        default:
          break;
      }
    } finally {
      setIsProcessing(false);
    }
  }, [step, collected, addUserMessage, addBotMessage, checkGhostMatch, classifyBusiness, generateBioSuggestions]);

  // Handle action clicks (chips)
  const handleAction = useCallback(async (action: Message['actions'][0]) => {
    addUserMessage(action.label);

    switch (action.type) {
      case 'claim':
        if (action.value === 'new') {
          setCollected(prev => ({ ...prev, claimEntityId: undefined }));
          setStep('ask_categories');
          addBotMessage("Great! What does your business sell? Describe your products or services.");
        } else {
          setCollected(prev => ({ ...prev, claimEntityId: action.value }));
          setStep('ask_categories');
          addBotMessage("Perfect! Let me verify the categories for this business. What do you sell?");
        }
        break;

      case 'category':
        const newCat = { label: action.label, key: action.value, status: 'active' as const };
        setCollected(prev => ({
          ...prev,
          categories: [...(prev.categories || []), newCat]
        }));
        
        // Wait for more categories or move on
        addBotMessage("Great! Add more categories or press Enter to continue.", [
          { label: "Continue", value: 'done', type: 'category' as const }
        ]);
        break;

      case 'bio':
        if (action.value === 'skip') {
          setStep('review');
        } else {
          setCollected(prev => ({ ...prev, bio: action.value }));
          setStep('review');
        }
        break;

      case 'confirm':
        setStep('saving');
        break;
    }
  }, [addUserMessage, addBotMessage]);

  // Save to database
  const confirmSetup = useCallback(async () => {
    setStep('saving');
    
    try {
      const { data, error } = await supabase.functions.invoke('business-quick-setup', {
        body: {
          name: collected.name,
          website: collected.website,
          phone: collected.phone,
          bio: collected.bio,
          categories: collected.categories?.map(c => c.label),
          claim_entity_id: collected.claimEntityId,
          ai: true
        }
      });

      if (error) throw error;

      setStep('done');
      addBotMessage("🎉 Your business is set up! You can manage it from your dashboard.");
      
      return { success: true, data };
    } catch (error) {
      console.error('Setup error:', error);
      addBotMessage("Something went wrong. Let me try again.");
      setStep('review');
      return { success: false, error };
    }
  }, [collected, addBotMessage]);

  return {
    step,
    messages,
    collected,
    isProcessing,
    handleUserMessage,
    handleAction,
    confirmSetup,
    setStep
  };
}
