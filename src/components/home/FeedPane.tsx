/**
 * Feed Pane - TikTok-style vertical scrolling reels
 */

import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical } from 'lucide-react';

interface Reel {
  id: string;
  imageUrl: string;
  videoUrl?: string;
  title: string;
  author: string;
  authorAvatar: string;
  likes: string;
  comments: string;
  description: string;
}

const MOCK_REELS: Reel[] = [
  {
    id: 'r1',
    imageUrl: '/placeholder.svg',
    title: 'Spring Foal Sale 🐴',
    author: 'bluecreekfarm',
    authorAvatar: '/placeholder.svg',
    likes: '2.8K',
    comments: '183',
    description: 'Beautiful foals ready for new homes! DM for details #horses #foals #sale',
  },
  {
    id: 'r2',
    imageUrl: '/placeholder.svg',
    title: 'Western Tack Collection',
    author: 'graysonequip',
    authorAvatar: '/placeholder.svg',
    likes: '1.2K',
    comments: '89',
    description: 'New arrivals! Custom saddles and premium tack 🤠 #western #tack #horses',
  },
  {
    id: 'r3',
    imageUrl: '/placeholder.svg',
    title: 'Horse Training Tips',
    author: 'sunsetstables',
    authorAvatar: '/placeholder.svg',
    likes: '5.6K',
    comments: '412',
    description: 'How to build trust with your horse 💙 Part 1 of 3 #training #horsemanship',
  },
];

export function FeedPane() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (containerRef.current) {
      const scrollTop = currentIndex * containerRef.current.clientHeight;
      containerRef.current.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }
  }, [currentIndex]);

  return (
    <div 
      ref={containerRef}
      className="feed-pane"
      style={{
        height: '100%',
        overflow: 'auto',
        scrollSnapType: 'y mandatory',
        scrollbarWidth: 'none',
        background: '#000',
        position: 'relative',
      }}
    >
      {MOCK_REELS.map((reel, index) => (
        <ReelItem 
          key={reel.id} 
          reel={reel} 
          isActive={index === currentIndex}
        />
      ))}
      
      {/* Scroll indicator */}
      <div style={{
        position: 'fixed',
        right: '24px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 10,
      }}>
        {MOCK_REELS.map((_, index) => (
          <div
            key={index}
            style={{
              width: '4px',
              height: index === currentIndex ? '24px' : '12px',
              background: index === currentIndex 
                ? 'rgba(255,255,255,0.9)' 
                : 'rgba(255,255,255,0.3)',
              borderRadius: '2px',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ReelItem({ reel, isActive }: { reel: Reel; isActive: boolean }) {
  return (
    <div 
      style={{
        height: '100%',
        scrollSnapAlign: 'start',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
      }}
    >
      {/* Background image/video */}
      <img 
        src={reel.imageUrl}
        alt={reel.title}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      
      {/* Right action buttons */}
      <div style={{
        position: 'absolute',
        right: '16px',
        bottom: '100px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        alignItems: 'center',
      }}>
        <ActionButton icon={Heart} label={reel.likes} />
        <ActionButton icon={MessageCircle} label={reel.comments} />
        <ActionButton icon={Share2} />
        <ActionButton icon={Bookmark} />
        <ActionButton icon={MoreVertical} />
      </div>
      
      {/* Bottom info */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '80px',
        padding: '20px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <img 
            src={reel.authorAvatar}
            alt={reel.author}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '2px solid #fff',
            }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>@{reel.author}</div>
          </div>
          <button style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: '1px solid #fff',
            color: '#fff',
            padding: '6px 20px',
            borderRadius: '4px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
          }}>
            Follow
          </button>
        </div>
        <div style={{ fontSize: '14px', lineHeight: 1.4 }}>
          {reel.description}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label }: { icon: any; label?: string }) {
  return (
    <button
      style={{
        background: 'transparent',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        transition: 'transform 0.2s ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div style={{
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
        backdropFilter: 'blur(8px)',
      }}>
        <Icon size={24} strokeWidth={2} />
      </div>
      {label && (
        <span style={{ fontSize: '12px', fontWeight: 700 }}>
          {label}
        </span>
      )}
    </button>
  );
}
