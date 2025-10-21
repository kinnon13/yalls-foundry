import { SuperRockerChatWithVoice } from './SuperRockerChatWithVoice';

export function SuperRockerChat(props: { threadId: string | null; onThreadCreated?: (id: string) => void }) {
  return <SuperRockerChatWithVoice {...props} />;
}