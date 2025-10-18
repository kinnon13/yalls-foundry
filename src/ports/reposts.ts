export interface Repost {
  id: string;
  source_post_id: string;
  by_entity_id: string;
  new_post_id: string;
  created_at: string;
}

export interface RepostsPort {
  create(source_post_id: string, caption?: string, targets?: string[]): Promise<{ 
    new_post_id: string; 
    status?: 'inserted' | 'existing';
  }>;
  list(userId: string): Promise<Repost[]>;
}
