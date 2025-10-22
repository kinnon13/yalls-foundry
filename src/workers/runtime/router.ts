/**
 * Worker Router Types
 * Actual routing happens in Edge Functions
 */

export type TopicHandler = (job: any) => Promise<void>;

export interface RouterConfig {
  pattern: string;
  handler: string;
}

// Router implementation is in Edge Functions
