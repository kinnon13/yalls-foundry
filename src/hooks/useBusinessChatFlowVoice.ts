/**
 * Voice-First Business Chat Onboarding Flow
 * Includes: greeting, handle system, website scanning, product probing
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

type FlowStep = 
  | 'greet'
  | 'ask_name' 
  | 'ghost_match' 
  | 'ask_handle'
  | 'ask_website'
  | 'scan_site'
  | 'ask_categories'
  | 'product_probe'
  | 'ask_phone'
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
    type: 'claim' | 'category' | 'bio' | 'confirm' | 'handle' | 'product';
    image?: string; // For product cards
  }>;
}

interface CollectedData {
  name: string;
  handle: string; // Business ID like @sunset-tack
  categories: Array<{ key: string; label: string; status: 'active' | 'pending' }>;
  website?: string;
  phone?: string;
  bio?: string;
  claimEntityId?: string;
  siteConfidence?: number;
}

export function useBusinessChatFlowVoice() {
  const [step, setStep] = useState<FlowStep>('greet');
  const [messages, setMessages] = useState<Message[]>([]);
  const [collected, setCollected] = useState<Partial<CollectedData>>({});
  const [ghostMatches, setGhostMatches] = useState<any[]>([]);
  const [handleSuggestions, setHandleSuggestions] = useState<string[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<any[]>([]);
  const [productProbes, setProductProbes] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const hasGreeted = useRef(false);

  // Voice greeting on mount
  useEffect(() => {
    if (!hasGreeted.current) {
      hasGreeted.current = true;
      addBotMessage(
        "Hi! I'm Rocker. I'll set up your business profile in under a minute. I'll ask for your business name, a unique ID, and your website so I can pull in the details for you. Ready?",
        undefined,
        true // shouldSpeak flag
      );
      // Move to ask_name after greeting
      setTimeout(() => setStep('ask_name'), 1000);
    }
  }, []);

  const addBotMessage = useCallback((content: string, actions?: Message['actions'], shouldSpeak = false) => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content,
      timestamp: new Date(),
      actions
    }]);
    
    // Return shouldSpeak flag for voice component to handle
    return shouldSpeak;
  }, []);

  const addUserMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      role: 'user',
      content,
      timestamp: new Date()
    }]);
  }, []);

  // Handle validation + reservation
  const validateAndReserveHandle = useCallback(async (proposedHandle: string) => {
    try {
      const { data, error } = await supabase.rpc('validate_business_handle', {
        p_handle: proposedHandle
      });

      if (error) throw error;

      const result = data[0];
      
      if (result.available) {
        // Reserve it
        await supabase.rpc('reserve_business_handle', {
          p_handle: result.normalized
        });
        
        setCollected(prev => ({ ...prev, handle: result.normalized }));
        addBotMessage(`Great! I reserved @${result.normalized} for you. Now, what's your website or Instagram?`);
        setStep('ask_website');
      } else {
        // Show suggestions
        setHandleSuggestions(result.suggestions || []);
        const actions = (result.suggestions || []).map((s: string) => ({
          label: `@${s}`,
          value: s,
          type: 'handle' as const
        }));
        
        addBotMessage(
          `@${result.normalized} is taken. Here are some alternatives:`,
          actions
        );
      }
    } catch (error) {
      console.error('[Handle] Validation error:', error);
      addBotMessage("Let me try that again. What business ID would you like?");
    }
  }, [addBotMessage]);

  // Website scanning
  const scanWebsite = useCallback(async (url: string) => {
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('business-scan-site', {
        body: { url }
      });

      if (error) throw error;

      const siteMeta = data;
      
      // Extract categories from site scan
      const categories = [];
      if (siteMeta.schemaTypes && siteMeta.schemaTypes.includes('Product')) {
        categories.push({ label: 'Products', key: 'products', status: 'active' as const });
      }
      if (siteMeta.keywords) {
        const keywords = siteMeta.keywords.split(',').slice(0, 3);
        keywords.forEach((kw: string) => {
          categories.push({
            label: kw.trim(),
            key: kw.trim().toLowerCase().replace(/\s+/g, '-'),
            status: 'pending' as const
          });
        });
      }
      
      setCollected(prev => ({ 
        ...prev, 
        categories,
        siteConfidence: siteMeta.confidence 
      }));

      // If confidence is low, do product probe
      if (siteMeta.confidence < 0.7) {
        setStep('product_probe');
        await probeProducts(siteMeta.title || collected.name || '');
      } else {
        // High confidence - show categories and move on
        const catActions = categories.map(c => ({
          label: c.label,
          value: c.key,
          type: 'category' as const
        }));
        
        addBotMessage(
          `I found these categories from your site:`,
          catActions
        );
        setStep('ask_phone');
      }
    } catch (error) {
      console.error('[ScanSite] Error:', error);
      addBotMessage("I couldn't scan your site, but that's okay. What products or services do you offer?");
      setStep('ask_categories');
    } finally {
      setIsProcessing(false);
    }
  }, [collected.name, addBotMessage]);

  // Product probing (demo mode)
  const probeProducts = useCallback(async (query: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('business-product-probe', {
        body: { query, demo: true } // Use demo data
      });

      if (error) throw error;

      const items = data.items || [];
      setProductProbes(items);

      if (items.length > 0) {
        const actions = items.slice(0, 3).map((item: any) => ({
          label: item.title,
          value: item.category,
          type: 'product' as const,
          image: item.image
        }));
        
        actions.push({
          label: "Not like these",
          value: 'none',
          type: 'product' as const
        });

        addBotMessage("Is it like any of these?", actions);
      } else {
        addBotMessage("What's your phone number? (Optional - press Enter to skip)");
        setStep('ask_phone');
      }
    } catch (error) {
      console.error('[ProductProbe] Error:', error);
      addBotMessage("What's your phone number? (Optional)");
      setStep('ask_phone');
    }
  }, [addBotMessage]);

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

        addBotMessage("I found existing businesses. Are any yours?", actions);
        setStep('ghost_match');
      } else {
        // No matches - move to handle
        await generateAndValidateHandle(name);
      }
    } catch (error) {
      console.error('[GhostMatch] Error:', error);
      await generateAndValidateHandle(name);
    }
  }, [collected, addBotMessage]);

  // Generate handle from name
  const generateAndValidateHandle = useCallback(async (name: string) => {
    const proposed = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 30);
    
    addBotMessage(`Let me check if @${proposed} is available...`);
    await validateAndReserveHandle(proposed);
  }, [addBotMessage, validateAndReserveHandle]);

  // Bio generation
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

      if (data?.suggestions && data.suggestions.length > 0) {
        const actions = data.suggestions.map((bio: string) => ({
          label: bio.substring(0, 80) + (bio.length > 80 ? '...' : ''),
          value: bio,
          type: 'bio' as const
        }));

        actions.push({
          label: "I'll add later",
          value: 'skip',
          type: 'bio' as const
        });

        addBotMessage("Want a short bio? Here are some options:", actions);
      }
    } catch (error) {
      console.error('[BioGen] Error:', error);
      addBotMessage("Ready to review and save?");
      setStep('review');
    }
  }, [collected, addBotMessage]);

  // Handle user text input
  const handleUserMessage = useCallback(async (text: string) => {
    addUserMessage(text);
    setIsProcessing(true);

    try {
      switch (step) {
        case 'ask_name':
          if (text.trim().length < 2) {
            addBotMessage("That seems too short. What's the full business name?");
            break;
          }
          setCollected(prev => ({ ...prev, name: text.trim() }));
          await checkGhostMatch(text.trim());
          break;

        case 'ask_handle':
          await validateAndReserveHandle(text.trim());
          break;

        case 'ask_website':
          if (text.trim()) {
            let url = text.trim();
            if (!url.startsWith('http')) {
              url = 'https://' + url;
            }
            setCollected(prev => ({ ...prev, website: url }));
            await scanWebsite(url);
          } else {
            addBotMessage("What's your phone number? (Optional - press Enter to skip)");
            setStep('ask_phone');
          }
          break;

        case 'ask_phone':
          if (text.trim()) {
            setCollected(prev => ({ ...prev, phone: text.trim() }));
          }
          setStep('ask_bio');
          await generateBioSuggestions();
          break;

        case 'ask_bio':
          setCollected(prev => ({ ...prev, bio: text.trim() }));
          setStep('review');
          addBotMessage("Perfect! Let me show you everything.");
          break;

        default:
          break;
      }
    } finally {
      setIsProcessing(false);
    }
  }, [step, collected, addUserMessage, addBotMessage, checkGhostMatch, validateAndReserveHandle, scanWebsite, generateBioSuggestions]);

  // Handle action clicks
  const handleAction = useCallback(async (action: Message['actions'][0]) => {
    addUserMessage(action.label);

    switch (action.type) {
      case 'claim':
        if (action.value === 'new') {
          setCollected(prev => ({ ...prev, claimEntityId: undefined }));
          await generateAndValidateHandle(collected.name || '');
        } else {
          setCollected(prev => ({ ...prev, claimEntityId: action.value }));
          await generateAndValidateHandle(collected.name || '');
        }
        break;

      case 'handle':
        await validateAndReserveHandle(action.value);
        break;

      case 'category':
        const newCat = { 
          label: action.label, 
          key: action.value, 
          status: 'pending' as const 
        };
        setCollected(prev => ({
          ...prev,
          categories: [...(prev.categories || []), newCat]
        }));
        addBotMessage("Added! Want to add more or continue?", [
          { label: "Continue", value: 'done', type: 'category' as const }
        ]);
        break;

      case 'product':
        if (action.value === 'none') {
          addBotMessage("No problem. Tell me what you sell:");
          setStep('ask_categories');
        } else {
          // Adopt the product's category
          const cat = { 
            label: action.value.split('/').pop() || action.label,
            key: action.value.toLowerCase().replace(/\s+/g, '-'),
            status: 'active' as const
          };
          setCollected(prev => ({
            ...prev,
            categories: [cat]
          }));
          addBotMessage("Got it! What's your phone number? (Optional)");
          setStep('ask_phone');
        }
        break;

      case 'bio':
        if (action.value === 'skip') {
          setStep('review');
          addBotMessage("Perfect! Let me show you everything.");
        } else {
          setCollected(prev => ({ ...prev, bio: action.value }));
          setStep('review');
          addBotMessage("Perfect! Let me show you everything.");
        }
        break;
    }
  }, [collected, addUserMessage, addBotMessage, generateAndValidateHandle, validateAndReserveHandle]);

  // Save to database
  const confirmSetup = useCallback(async () => {
    setStep('saving');
    
    try {
      const { data, error } = await supabase.functions.invoke('business-quick-setup', {
        body: {
          name: collected.name,
          handle: collected.handle,
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
      addBotMessage("🎉 All set! Your business profile is live. I added a Business icon to your dashboard.");
      
      // Release handle reservation
      if (collected.handle) {
        await supabase.rpc('release_business_handle', {
          p_handle: collected.handle
        });
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('[Setup] Error:', error);
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
