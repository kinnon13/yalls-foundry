/**
 * Responsive Helper Components
 */

import React from 'react';
import { useResponsive, type Breakpoint } from '@/hooks/useResponsive';

export const Show: React.FC<{ 
  at: Breakpoint | Breakpoint[]; 
  children: React.ReactNode 
}> = ({ at, children }) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const list = Array.isArray(at) ? at : [at];
  
  const matches = list.some(bp => {
    if (bp === 'mobile') return isMobile;
    if (bp === 'tablet') return isTablet;
    if (bp === 'desktop') return isDesktop;
    return false;
  });
  
  return matches ? <>{children}</> : null;
};
