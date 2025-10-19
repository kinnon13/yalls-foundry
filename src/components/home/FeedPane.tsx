/**
 * Feed Pane
 * TikTok-style feed with For You / Following / Shop tabs
 * Strict 9:16 reels, virtualization, keyboard navigation
 */

import { useState, useRef, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { rocker } from '@/lib/rocker/event-bus';
import { CalendarWidget } from './CalendarWidget';

interface Reel {
  id: string;
  videoUrl?: string;
  imageUrl?: string;
  author: string;
  caption: string;
  likes: number;
  comments: number;
}

const MOCK_REELS: Reel[] = Array.from({ length: 20 }, (_, i) => ({
  id: `reel-${i}`,
  imageUrl: '/placeholder.svg',
  author: `creator_${i}`,
  caption: `Amazing reel #${i + 1}`,
  likes: Math.floor(Math.random() * 10000),
  comments: Math.floor(Math.random() * 1000),
}));

export function FeedPane() {
  const [activeTab, setActiveTab] = useState<'for-you' | 'following' | 'shop'>('for-you');
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rocker.emit('feed_view', { metadata: { tab: activeTab, index: currentIndex } });
  }, [activeTab, currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(prev + 1, MOCK_REELS.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Scroll to current reel
    const element = document.querySelector(`[data-reel-index="${currentIndex}"]`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentIndex]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as typeof activeTab);
    rocker.emit('tab_changed', { metadata: { from: activeTab, to: value } });
  };

  return (
    <div className="h-full flex bg-background">
      {/* Main feed area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent">
            <TabsTrigger value="for-you">For You</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="shop">Shop</TabsTrigger>
          </TabsList>

          <TabsContent value="for-you" className="flex-1 overflow-hidden m-0">
            <ReelScroller reels={MOCK_REELS} currentIndex={currentIndex} />
          </TabsContent>

          <TabsContent value="following" className="flex-1 overflow-hidden m-0">
            <ReelScroller reels={MOCK_REELS.slice(0, 5)} currentIndex={currentIndex} />
          </TabsContent>

          <TabsContent value="shop" className="flex-1 overflow-hidden m-0">
            <ReelScroller reels={MOCK_REELS.slice(0, 10)} currentIndex={currentIndex} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Right rail with calendar widget */}
      <div className="hidden lg:block w-80 border-l overflow-y-auto p-4">
        <CalendarWidget />
      </div>
    </div>
  );
}

function ReelScroller({ reels, currentIndex }: { reels: Reel[]; currentIndex: number }) {
  return (
    <div className="h-full overflow-y-auto snap-y snap-mandatory" style={{ scrollbarWidth: 'none' }}>
      {reels.map((reel, index) => (
        <div
          key={reel.id}
          data-reel-index={index}
          className="h-full snap-start flex items-center justify-center bg-black relative"
          style={{ aspectRatio: '9/16' }}
        >
          {/* Reel content */}
          <img
            src={reel.imageUrl}
            alt={reel.caption}
            className="w-full h-full object-cover"
          />

          {/* Action stack (right side) */}
          <div className="absolute right-4 bottom-20 flex flex-col gap-4">
            <ReelAction icon={Heart} count={reel.likes} />
            <ReelAction icon={MessageCircle} count={reel.comments} />
            <ReelAction icon={Share2} />
            <ReelAction icon={Bookmark} />
          </div>

          {/* Caption overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white font-medium">@{reel.author}</p>
            <p className="text-white/90 text-sm mt-1">{reel.caption}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReelAction({ icon: Icon, count }: { icon: any; count?: number }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex flex-col gap-1 text-white hover:bg-white/20 h-auto p-2"
    >
      <Icon className="h-6 w-6" />
      {count !== undefined && <span className="text-xs">{count > 999 ? `${Math.floor(count / 1000)}k` : count}</span>}
    </Button>
  );
}
