import { RockerChatUI } from './RockerChatUI';
import { useEffect } from 'react';
import { useRockerGlobal } from '@/lib/ai/rocker/context';
import { AIRole } from '@/lib/ai/rocker/config';

interface RockerChatProps {
  actorRole?: AIRole;
}

export function RockerChat({ actorRole }: RockerChatProps = {}) {
  const { setActorRole, setIsOpen } = useRockerGlobal();
  
  useEffect(() => {
    if (actorRole) {
      setActorRole(actorRole);
      setIsOpen(true); // Auto-open for specific roles
    }
  }, [actorRole, setActorRole, setIsOpen]);
  
  return <RockerChatUI />;
}
