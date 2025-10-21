import { SuperAndyChatWithVoice } from './SuperAndyChatWithVoice';

export function SuperAndyChat(props: { threadId: string | null; onThreadCreated?: (id: string) => void }) {
  return <SuperAndyChatWithVoice {...props} />;
}