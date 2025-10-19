/**
 * Demo Fixtures: Messages & Threads
 */

import { generatePersonName, generateImage, generateTimestamp, createSeededRandom } from '../seed';

export interface DemoThread {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    avatar: string;
  }>;
  lastMessage: {
    id: string;
    text: string;
    sentBy: string;
    sentAt: string;
  };
  unread: boolean;
}

export interface DemoMessage {
  id: string;
  threadId: string;
  text: string;
  sentBy: string;
  sentAt: string;
}

export function generateThreads(count: number = 5): DemoThread[] {
  const threads: DemoThread[] = [];
  const rng = createSeededRandom('messages');
  
  for (let i = 0; i < count; i++) {
    const seed = `thread-${i}`;
    const person = generatePersonName(`person-${seed}`);
    
    threads.push({
      id: `thread-${seed}`,
      participants: [
        {
          id: `user-${seed}`,
          name: person.full,
          avatar: generateImage(`avatar-${seed}`, 200, 200),
        },
      ],
      lastMessage: {
        id: `msg-${seed}-last`,
        text: `Hey! This is a demo message from ${person.first}.`,
        sentBy: `user-${seed}`,
        sentAt: generateTimestamp(seed, 3),
      },
      unread: rng.next() < 0.3,
    });
  }
  
  return threads;
}

export function generateMessages(threadId: string, count: number = 10): DemoMessage[] {
  const messages: DemoMessage[] = [];
  const rng = createSeededRandom(threadId);
  
  for (let i = 0; i < count; i++) {
    const seed = `${threadId}-msg-${i}`;
    messages.push({
      id: `msg-${seed}`,
      threadId,
      text: `Demo message #${i + 1} in this thread.`,
      sentBy: rng.next() < 0.5 ? 'me' : 'other',
      sentAt: generateTimestamp(seed, 7),
    });
  }
  
  return messages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
}
