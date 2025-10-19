/**
 * App Router - 10 Canonical Routes + Overlay System
 * Everything else opens via ?app= overlays
 */

import { StrictMode, Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from 'next-themes';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/lib/auth/context';
import { RequireAuth } from '@/lib/auth/guards';
import { RockerChat } from '@/components/rocker/RockerChat';
import { RockerSuggestions } from '@/components/rocker/RockerSuggestions';
import InactivityNudge from '@/components/rocker/InactivityNudge';
import { RockerDock } from '@/components/rocker/RockerDock';
import { RockerChatProvider } from '@/lib/ai/rocker';
import { RockerProvider } from '@/lib/ai/rocker';
import { RedirectHandler } from '@/components/navigation/RedirectHandler';
import PreviewRoutes from '@/preview/PreviewRoutes';
import { PreviewMessageListener } from '@/components/preview/PreviewMessageListener';
import { registerRockerFeatureHandler } from '@/feature-kernel/rocker-handler';
import { CommandPalette } from '@/components/command/CommandPalette';
import { ProfileCreationModal } from '@/components/entities/ProfileCreationModal';
import { usePageTelemetry } from '@/hooks/usePageTelemetry';
import { DevHUD } from '@/components/dev/DevHUD';
import { useDevHUD } from '@/hooks/useDevHUD';
import { OverlayProvider } from '@/lib/overlay/OverlayProvider';
import { rocker } from '@/lib/rocker/event-bus';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { BusinessComparison } from '@/components/profile/BusinessComparison';
import '@/kernel'; // Register app contracts

// 10 Canonical Routes
import HomeShell from './routes/home-shell/index';
import Login from './routes/login';
import NotFound from './pages/NotFound';
import Health from './pages/Health';

const Discover = lazy(() => import('./routes/discover-v2'));
const Messages = lazy(() => import('./routes/messages/index'));
const ProfilePageDynamic = lazy(() => import('./routes/profile/[id]'));
const EntitiesList = lazy(() => import('./routes/entities/index'));
const EventsIndex = lazy(() => import('./routes/events/index'));
const EventDetail = lazy(() => import('./routes/events/[id]'));
const MarketplaceIndex = lazy(() => import('./routes/marketplace/index'));
const ListingDetail = lazy(() => import('./routes/listings/[id]'));
const CartPage = lazy(() => import('./routes/cart/index'));
const OrdersIndex = lazy(() => import('./routes/orders/index'));
const OrderDetail = lazy(() => import('./routes/orders/[id]'));
const MLMPage = lazy(() => import('./routes/mlm/index'));

const queryClient = new QueryClient();

function AppContent() {
  usePageTelemetry();
  const { isOpen: devHUDOpen, close: closeDevHUD } = useDevHUD();
  
  useEffect(() => {
    registerRockerFeatureHandler();
    
    // Global keyboard shortcuts
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (e.key.toLowerCase() === 'h' && mod) {
        e.preventDefault();
        window.location.href = '/';
      }
    };
    window.addEventListener('keydown', onKey);
    
    // Register canonical routes for scanner
    import('@/router/registry').then(({ registerRoutes }) => {
      registerRoutes([
        '/', '/discover', '/messages', '/profile/:id',
        '/entities', '/events', '/events/:id', '/listings', '/listings/:id',
        '/cart', '/orders', '/orders/:id'
      ]);
    });
    
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <CommandPalette />
      <ProfileCreationModal />
      <RedirectHandler />
      <BusinessComparison />
      
      <Routes>
        {/* 1. Home - Shell with Apps + Feed */}
        <Route path="/" element={<HomeShell />} />
        
        {/* 2. Discover - For You / Trending / Latest */}
        <Route 
          path="/discover" 
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Discover />
            </Suspense>
          } 
        />
        
        {/* 3. Dashboard - Redirect to unified shell */}
        <Route path="/dashboard" element={<Navigate to="/?mode=manage" replace />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        
        {/* 4. Messages - DM deep link */}
        <Route
          path="/messages"
          element={
            <RequireAuth>
              <Suspense fallback={<div>Loading...</div>}>
                <Messages />
              </Suspense>
            </RequireAuth>
          }
        />
        
        {/* 5. Profile - Public profile deep link */}
        <Route 
          path="/profile/:id" 
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <ProfilePageDynamic />
            </Suspense>
          } 
        />
        
        {/* 6. Entities - Browse & claim */}
        <Route 
          path="/entities" 
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <EntitiesList />
            </Suspense>
          } 
        />
        
        {/* 7. Events - Index + Detail */}
        <Route 
          path="/events" 
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <EventsIndex />
            </Suspense>
          } 
        />
        <Route 
          path="/events/:id" 
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <EventDetail />
            </Suspense>
          } 
        />
        
        {/* 8. Listings - Marketplace index + detail */}
        <Route 
          path="/listings" 
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <MarketplaceIndex />
            </Suspense>
          } 
        />
        <Route 
          path="/listings/:id" 
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <ListingDetail />
            </Suspense>
          } 
        />
        
        {/* 9. Cart - Mock checkout */}
        <Route 
          path="/cart" 
          element={
            <RequireAuth>
              <Suspense fallback={<div>Loading...</div>}>
                <CartPage />
              </Suspense>
            </RequireAuth>
          } 
        />
        
        {/* 10. Orders - List + Detail */}
        <Route 
          path="/orders" 
          element={
            <RequireAuth>
              <Suspense fallback={<div>Loading...</div>}>
                <OrdersIndex />
              </Suspense>
            </RequireAuth>
          } 
        />
        <Route 
          path="/orders/:id" 
          element={
            <RequireAuth>
              <Suspense fallback={<div>Loading...</div>}>
                <OrderDetail />
              </Suspense>
            </RequireAuth>
          } 
        />
        
        {/* MLM Network */}
        <Route 
          path="/mlm" 
          element={
            <RequireAuth>
              <Suspense fallback={<div>Loading...</div>}>
                <MLMPage />
              </Suspense>
            </RequireAuth>
          } 
        />
        
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        
        {/* Health check */}
        <Route path="/health" element={<Health />} />
        
        {/* Catch-all: redirect to Discover with toast */}
        <Route 
          path="*" 
          element={
            <Navigate 
              to="/discover" 
              replace 
              state={{ toast: "Route moved. Use Library or Finder." }} 
            />
          } 
        />
      </Routes>
      
      <Toaster />
      <Sonner />
      <InactivityNudge />
      <RockerDock />
      <RockerSuggestions />
      <RockerChat />
      {devHUDOpen && <DevHUD isOpen={devHUDOpen} onClose={closeDevHUD} />}
    </>
  );
}

function App() {
  return (
    <StrictMode>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <BrowserRouter>
              <AuthProvider>
                <ProfileProvider>
                  <RockerProvider>
                    <RockerChatProvider>
                      <OverlayProvider>
                        <AppContent />
                        <PreviewMessageListener />
                        <PreviewRoutes />
                      </OverlayProvider>
                    </RockerChatProvider>
                  </RockerProvider>
                </ProfileProvider>
              </AuthProvider>
            </BrowserRouter>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </StrictMode>
  );
}

export default App;
