export type SocialProvider = 'twitter' | 'instagram' | 'facebook' | 'youtube' | 'tiktok';

export interface LinkedAccount {
  id: string;
  user_id: string;
  provider: SocialProvider;
  handle: string;
  proof_url?: string;
  verified: boolean;
  linked_at: string;
}

export interface LinkedAccountsPort {
  list(userId: string): Promise<LinkedAccount[]>;
  upsert(userId: string, provider: SocialProvider, handle: string, proof_url?: string): Promise<LinkedAccount>;
  remove(userId: string, accountId: string): Promise<void>;
}
