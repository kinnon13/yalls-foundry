import { RockerChatUI } from './RockerChatUI';
import { useEffect } from 'react';
import { useRockerGlobal } from '@/lib/ai/rocker/context';
import { AIRole } from '@/lib/ai/rocker/config';

interface RockerChatProps {
  actorRole?: AIRole;
}

export function RockerChat({ actorRole }: RockerChatProps = {}) {
  const { setActorRole, setIsOpen, sendMessage } = useRockerGlobal();
  
  useEffect(() => {
    if (actorRole) {
      setActorRole(actorRole);
      setIsOpen(true); // Auto-open for specific roles
    }
  }, [actorRole, setActorRole, setIsOpen]);
  
  useEffect(() => {
    // Listen for failure feedback events
    const handleFailureFeedback = (event: CustomEvent) => {
      const { prompt, action, reason, route, entityData } = event.detail;
      
      // Store failure context for the conversation
      sessionStorage.setItem('rocker:failure-context', JSON.stringify({
        action,
        reason,
        route,
        entityData,
        timestamp: new Date().toISOString()
      }));
      
      // Auto-open chat and send the failure prompt
      setIsOpen(true);
      if (sendMessage) {
        setTimeout(() => sendMessage(prompt), 100);
      }
    };
    
    window.addEventListener('rocker:failure-feedback', handleFailureFeedback as EventListener);
    
    return () => {
      window.removeEventListener('rocker:failure-feedback', handleFailureFeedback as EventListener);
    };
  }, [sendMessage, setIsOpen]);
  
  return <RockerChatUI />;
}
