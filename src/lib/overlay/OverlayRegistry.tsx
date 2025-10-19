import { createContext, useContext, useState, useCallback, ReactNode, lazy, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

// Lazy load overlay components
const MarketplaceOverlay = lazy(() => import('@/routes/marketplace/index'));
const MessagesOverlay = lazy(() => import('@/routes/messages/index'));
const DiscoverOverlay = lazy(() => import('@/routes/discover'));
const ProfileOverlay = lazy(() => import('@/routes/profile/[id]'));
const EntitiesOverlay = lazy(() => import('@/routes/entities/index'));
const EventsOverlay = lazy(() => import('@/routes/events/index'));
const CartOverlay = lazy(() => import('@/routes/cart/index'));
const OrdersOverlay = lazy(() => import('@/routes/orders/index'));
const AppStoreOverlay = lazy(() => import('@/routes/app-store/index'));

// Overlay registry - maps keys to components
const OVERLAY_COMPONENTS: Record<string, React.ComponentType<any>> = {
  marketplace: MarketplaceOverlay,
  messages: MessagesOverlay,
  discover: DiscoverOverlay,
  profile: ProfileOverlay,
  entities: EntitiesOverlay,
  events: EventsOverlay,
  event: EventsOverlay, // alias
  cart: CartOverlay,
  orders: OrdersOverlay,
  'app-store': AppStoreOverlay,
  unclaimed: EntitiesOverlay, // same as entities, filtered
};

interface OverlayContextValue {
  currentOverlay: string | null;
  overlayParams: Record<string, string>;
  openOverlay: (key: string, params?: Record<string, string>) => void;
  closeOverlay: () => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentOverlay = searchParams.get('app');
  
  // Extract all overlay-specific params
  const overlayParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key !== 'app' && key !== 'lane' && key !== 'tab' && key !== 'debug') {
      overlayParams[key] = value;
    }
  });

  const openOverlay = useCallback((key: string, params: Record<string, string> = {}) => {
    // Validate key exists
    if (!OVERLAY_COMPONENTS[key]) {
      console.warn(`Unknown overlay key: ${key}`);
      return;
    }

    const newParams = new URLSearchParams(searchParams);
    newParams.set('app', key);
    
    // Add overlay-specific params
    Object.entries(params).forEach(([k, v]) => {
      newParams.set(k, v);
    });

    setSearchParams(newParams, { replace: false });

    // Telemetry
    window.dispatchEvent(new CustomEvent('overlay_open', { 
      detail: { app: key, source: 'programmatic', params } 
    }));
  }, [searchParams, setSearchParams]);

  const closeOverlay = useCallback(() => {
    if (!currentOverlay) return;

    const newParams = new URLSearchParams(searchParams);
    
    // Remove app param and all overlay-specific params
    newParams.delete('app');
    Object.keys(overlayParams).forEach(key => {
      newParams.delete(key);
    });

    setSearchParams(newParams, { replace: false });

    // Telemetry
    window.dispatchEvent(new CustomEvent('overlay_close', { 
      detail: { app: currentOverlay } 
    }));
  }, [currentOverlay, searchParams, overlayParams, setSearchParams]);

  // ESC key handler
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && currentOverlay) {
      e.preventDefault();
      closeOverlay();
    }
  }, [currentOverlay, closeOverlay]);

  // Back button handler
  const handlePopState = useCallback(() => {
    // Browser back will naturally update searchParams
    // closeOverlay is handled by the URL change
  }, []);

  useState(() => {
    window.addEventListener('keydown', handleEscape);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('popstate', handlePopState);
    };
  });

  return (
    <OverlayContext.Provider value={{ currentOverlay, overlayParams, openOverlay, closeOverlay }}>
      {children}
      {currentOverlay && <OverlayRenderer overlay={currentOverlay} params={overlayParams} onClose={closeOverlay} />}
    </OverlayContext.Provider>
  );
}

function OverlayRenderer({ overlay, params, onClose }: { overlay: string; params: Record<string, string>; onClose: () => void }) {
  const Component = OVERLAY_COMPONENTS[overlay];
  
  if (!Component) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Overlay content */}
      <div className="relative z-10 w-full h-full bg-background overflow-hidden">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        }>
          <Component {...params} onClose={onClose} />
        </Suspense>
      </div>
    </div>
  );
}

export function useOverlay() {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error('useOverlay must be used within OverlayProvider');
  }
  return context;
}

// Utility: Intercept internal links to open as overlays
export function interceptInternalLinks() {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    
    if (!anchor) return;
    
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return; // External link, let it proceed
    }

    // Check if it's a route that should be an overlay
    const overlayRoutes = [
      '/marketplace', '/messages', '/discover', '/profile', 
      '/entities', '/events', '/cart', '/orders', '/app-store'
    ];
    
    const shouldBeOverlay = overlayRoutes.some(route => href.startsWith(route));
    
    if (shouldBeOverlay) {
      e.preventDefault();
      
      // Extract overlay key from path
      const path = href.split('?')[0];
      let overlayKey = path.split('/')[1];
      
      // Handle special cases
      if (overlayKey === 'profile' && path.split('/').length > 2) {
        const id = path.split('/')[2];
        const event = new CustomEvent('open-overlay', { 
          detail: { app: 'profile', params: { id } } 
        });
        window.dispatchEvent(event);
      } else {
        const event = new CustomEvent('open-overlay', { 
          detail: { app: overlayKey, params: {} } 
        });
        window.dispatchEvent(event);
      }
    }
  }, true);
}
