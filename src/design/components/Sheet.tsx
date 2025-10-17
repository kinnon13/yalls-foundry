import { tokens } from '../tokens';
import { useState, useEffect } from 'react';

type SheetProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
};

export const Sheet = ({ isOpen, onClose, children, title }: SheetProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) setIsVisible(true);
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: tokens.zIndex.sheet,
          opacity: isOpen ? 1 : 0,
          transition: `opacity ${tokens.motion.duration.normal}ms`,
        }}
      />
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: '400px',
          maxWidth: '90vw',
          background: tokens.color.bg.dark,
          zIndex: tokens.zIndex.sheet + 1,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: `transform ${tokens.motion.duration.normal}ms`,
          padding: tokens.space.l,
          overflowY: 'auto',
        }}
      >
        {title && (
          <h2 style={{ fontSize: tokens.typography.size.xl, fontWeight: tokens.typography.weight.bold, marginBottom: tokens.space.m }}>
            {title}
          </h2>
        )}
        {children}
      </div>
    </>
  );
};
