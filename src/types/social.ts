export interface BubbleItem {
  id: string;
  type: 'person' | 'business' | 'horse' | 'app';
  display_name: string;
  handle?: string;
  avatar_url?: string;
  ring_color: string;
  badge?: string;
  metadata?: any;
}
