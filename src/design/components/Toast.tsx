import { tokens } from '../tokens';
import { useEffect, useState } from 'react';

type ToastProps = {
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose: () => void;
};

export const Toast = ({ message, variant = 'info', duration = 3000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const variants = {
    info: { bg: tokens.color.brand, color: tokens.color.text.primary },
    success: { bg: tokens.color.success, color: tokens.color.text.primary },
    warning: { bg: tokens.color.warning, color: tokens.color.bg.dark },
    error: { bg: tokens.color.danger, color: tokens.color.text.primary },
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: tokens.space.l,
        right: tokens.space.l,
        padding: `${tokens.space.m}px ${tokens.space.l}px`,
        background: variants[variant].bg,
        color: variants[variant].color,
        borderRadius: tokens.radius.m,
        fontSize: tokens.typography.size.m,
        fontWeight: tokens.typography.weight.medium,
        zIndex: tokens.zIndex.toast,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `all ${tokens.motion.duration.normal}ms`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      {message}
    </div>
  );
};
