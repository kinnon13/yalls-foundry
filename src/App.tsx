/**
 * App Router - 10 Canonical Routes + Overlay System
 * Everything else opens via ?app= overlays
 */

import { StrictMode, Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from 'next-themes';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/lib/auth/context';
import { RequireAuth } from '@/lib/auth/guards';
import { RequireAuthGuard } from '@/lib/auth/guards/RequireAuthGuard';
import { PublicOnlyGuard } from '@/lib/auth/guards/PublicOnlyGuard';
import { RequireOnboardingGuard } from '@/lib/auth/guards/RequireOnboardingGuard';
import { setupAuthInterceptor } from '@/lib/auth/interceptors';
import { RockerChat } from '@/components/rocker/RockerChat';
import { RockerSuggestions } from '@/components/rocker/RockerSuggestions';
import { RockerDock } from '@/components/rocker/RockerDock';
import { RockerChatWidget } from '@/components/rocker';
import { VoiceNotification } from '@/components/rocker/VoiceNotification';
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
import { BottomDock } from '@/components/layout/BottomDock';
import '@/kernel'; // Register app contracts

// 10 Canonical Routes
import HomeShell from './routes/home-shell/index';
import NotFound from './pages/NotFound';
import Health from './pages/Health';

const Discover = lazy(() => import('./routes/discover/search'));
const Messages = lazy(() => import('./routes/messages/index'));
const ProfilePageDynamic = lazy(() => import('./routes/profile/[id]'));
const EntitiesList = lazy(() => import('./routes/entities/index'));
const EventsIndex = lazy(() => import('./routes/events/index'));
const EventDetail = lazy(() => import('./routes/events/[id]'));
const MarketplaceIndex = lazy(() => import('./routes/marketplace/index'));
const ListingDetail = lazy(() => import('./routes/listings/[id]'));
const CartPage = lazy(() => import('./routes/cart/index'));
const OrdersIndex = lazy(() => import('./routes/orders/index'));
const GuardrailsControl = lazy(() => import('./routes/admin/guardrails'));
const ApprovalsPage = lazy(() => import('./routes/admin/approvals'));
const VoiceSettingsPage = lazy(() => import('./routes/admin/voice-settings'));
const SuperAdminControlsPage = lazy(() => import('./routes/admin/super-admin-controls'));
const OrderDetail = lazy(() => import('./routes/orders/[id]'));
const MLMPage = lazy(() => import('./routes/mlm/index'));
const AdminDashboard = lazy(() => import('./routes/admin'));
const AuthPage = lazy(() => import('./routes/auth'));
const OnboardingPage = lazy(() => import('./routes/onboarding/index'));
const RockerHub = lazy(() => import('./routes/rocker-hub'));
const SuperAndy = lazy(() => import('./routes/super-andy'));
const AdminRocker = lazy(() => import('./routes/admin-rocker'));
const SettingsKeys = lazy(() => import('./pages/SettingsKeys'));
const RoleToolPage = lazy(() => import('./routes/admin/role-tool'));

// Super Console
const SuperOverview = lazy(() => import('./pages/Super/index'));
const PoolsPage = lazy(() => import('./pages/Super/Pools'));
const WorkersPage = lazy(() => import('./pages/Super/Workers'));
const FlagsPage = lazy(() => import('./pages/Super/Flags'));
const IncidentsPage = lazy(() => import('./pages/Super/Incidents'));
const SuperAndyPage = lazy(() => import('./pages/SuperAndy'));
const RequireSuperAdmin = lazy(() => import('./guards/RequireSuperAdmin'));

const queryClient = new QueryClient();

function AppContent() {
  usePageTelemetry();
  const { isOpen: devHUDOpen, close: closeDevHUD } = useDevHUD();
  const location = useLocation();
  
  useEffect(() => {
    // Setup global 401 interceptor
    setupAuthInterceptor();
    
    registerRockerFeatureHandler();
    
    // Global keyboard shortcuts
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (e.key && e.key.toLowerCase() === 'h' && mod) {
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
      <VoiceNotification />
      
      <Routes>
        {/* Auth - Public only (redirects if already logged in) */}
        <Route element={<PublicOnlyGuard />}>
          <Route path="/auth" element={
            <Suspense fallback={<div>Loading...</div>}>
              <AuthPage />
            </Suspense>
          } />
        </Route>

        {/* Onboarding - Authenticated users only, before main app */}
        <Route element={<RequireAuthGuard />}>
          <Route path="/onboarding/*" element={
            <Suspense fallback={<div>Loading...</div>}>
              <OnboardingPage />
            </Suspense>
          } />
        </Route>

        {/* All main routes require onboarding completion */}
        <Route element={<RequireOnboardingGuard />}>
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
            <Suspense fallback={<div>Loading...</div>}>
              <Messages />
            </Suspense>
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
        
        {/* Protected Routes Group - Require Authentication */}
        <Route element={<RequireAuthGuard />}>
          {/* 9. Cart - Checkout & Purchase */}
          <Route 
            path="/cart" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <CartPage />
              </Suspense>
            } 
          />
          
          {/* 10. Orders - List + Detail */}
          <Route 
            path="/orders" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <OrdersIndex />
              </Suspense>
            } 
          />
          <Route 
            path="/orders/:id" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <OrderDetail />
              </Suspense>
            } 
          />
          
          {/* MLM Network */}
          <Route 
            path="/mlm" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <MLMPage />
              </Suspense>
            } 
          />
          
          {/* Admin Dashboard */}
          <Route 
            path="/admin" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <AdminDashboard />
              </Suspense>
            } 
          />
          
          {/* Super Admin Guardrails Control */}
          <Route 
            path="/admin/guardrails" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <GuardrailsControl />
              </Suspense>
            } 
          />
          
          {/* Super Admin Approvals */}
          <Route 
            path="/admin/approvals" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <ApprovalsPage />
              </Suspense>
            } 
          />
          
          {/* Voice Settings */}
          <Route 
            path="/admin/voice-settings" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <VoiceSettingsPage />
              </Suspense>
            } 
          />
          
          {/* Super Admin Controls */}
          <Route 
            path="/admin/super-admin-controls" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <SuperAdminControlsPage />
              </Suspense>
            } 
          />
          
          {/* Rocker Hub - Super Admin Only */}
          <Route 
            path="/rocker" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <RockerHub />
              </Suspense>
            } 
          />
          
          {/* Rocker Chat - redirect to hub */}
          <Route 
            path="/rocker/chat" 
            element={<Navigate to="/rocker" replace />}
          />
          
          {/* Super Andy - Everything AI Workspace */}
          <Route 
            path="/super-andy" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <SuperAndy />
              </Suspense>
            } 
          />
          
          {/* Admin Rocker - Admin AI Workspace */}
          <Route 
            path="/admin-rocker" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <AdminRocker />
              </Suspense>
            } 
          />
          
          {/* Super Console - Admin Only */}
          <Route 
            path="/super" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <RequireSuperAdmin>
                  <SuperOverview />
                </RequireSuperAdmin>
              </Suspense>
            } 
          />
          <Route 
            path="/super/pools" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <RequireSuperAdmin>
                  <PoolsPage />
                </RequireSuperAdmin>
              </Suspense>
            } 
          />
          <Route 
            path="/super/workers" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <RequireSuperAdmin>
                  <WorkersPage />
                </RequireSuperAdmin>
              </Suspense>
            } 
          />
          <Route 
            path="/super/flags" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <RequireSuperAdmin>
                  <FlagsPage />
                </RequireSuperAdmin>
              </Suspense>
            } 
          />
          <Route 
            path="/super/incidents" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <RequireSuperAdmin>
                  <IncidentsPage />
                </RequireSuperAdmin>
              </Suspense>
            } 
          />
          <Route 
            path="/super-andy-v2" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <RequireSuperAdmin>
                  <SuperAndyPage />
                </RequireSuperAdmin>
              </Suspense>
            } 
          />
          
          {/* Settings - API Keys */}
          <Route 
            path="/settings/keys" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <SettingsKeys />
              </Suspense>
            } 
          />
          
          {/* Admin - Role Tool */}
          <Route 
            path="/admin/role-tool" 
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <RoleToolPage />
              </Suspense>
            } 
          />
        </Route>
        
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
        </Route>
      </Routes>
      
      <Toaster />
      <Sonner />
      <RockerDock />
      <RockerSuggestions />
      <RockerChat />
      <RockerChatWidget />
      {devHUDOpen && <DevHUD isOpen={devHUDOpen} onClose={closeDevHUD} />}
      
      {/* Bottom Dock - 5 icons everywhere except auth/create-recording/live */}
      {!location.pathname.startsWith('/auth') && 
       !location.pathname.match(/^\/create\/record/) &&
       !location.pathname.startsWith('/live') && (
        <BottomDock />
      )}
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
