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
import OverlayHost from '@/lib/overlay/OverlayHost';
import { rocker } from '@/lib/rocker/event-bus';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { BusinessComparison } from '@/components/profile/BusinessComparison';
import { BottomDock } from '@/components/layout/BottomDock';
import { RouteToOverlayBridge } from '@/lib/overlay/RouteToOverlayBridge';
import PanelHost from '@/lib/panel/PanelHost';
import { NavBar } from '@/lib/shared/ui/NavBar';
import '@/kernel'; // Register app contracts

// 10 Canonical Routes + Legacy Redirector
import Index from './pages/Index';
import Health from './pages/Health';

const Dashboard = lazy(() => import('./routes/dashboard/index'));
const SuperAndyFull = lazy(() => import('./routes/super-andy'));
const SuperAndyLive = lazy(() => import('./routes/super-andy-live'));
const AdminRockerConsole = lazy(() => import('./pages/AdminRocker/Index'));
const AuthPage = lazy(() => import('./routes/auth'));
const AuthCallback = lazy(() => import('./routes/auth/callback'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const LegacyRedirector = lazy(() => import('./routes/LegacyRedirector'));

import { bootstrapPerformance } from '@/lib/bootstrap-performance';

const queryClient = new QueryClient();

function AppContent() {
  usePageTelemetry();
  const { isOpen: devHUDOpen, close: closeDevHUD } = useDevHUD();
  const location = useLocation();
  
  useEffect(() => {
    // Initialize performance monitoring
    bootstrapPerformance();
    
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
      <NavBar />
      <CommandPalette />
      <ProfileCreationModal />
      <RedirectHandler />
      <BusinessComparison />
      <VoiceNotification />
      
      <Routes>
        {/* 1. Home - Welcome to Yalls AI */}
        <Route path="/" element={<Index />} />
        
        {/* 2. Dashboard - Workspace with overlay system */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* 3. Super Andy - Full route (legacy compatibility) */}
        <Route path="/super" element={<SuperAndyFull />} />
        
        {/* 3b. Super Andy Live - Real-time brain activity dashboard */}
        <Route path="/super-andy-live" element={<SuperAndyLive />} />
        
        {/* 4. Admin Rocker - Admin console for AI */}
        <Route path="/admin-rocker" element={<AdminRockerConsole />} />
        
        {/* 5. Auth - Login & Signup page */}
        <Route path="/auth" element={<AuthPage />} />
        
        {/* 6. Auth Callback - OAuth flow */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* 7. Privacy - Static page */}
        <Route path="/privacy" element={<Privacy />} />
        
        {/* 8. Terms - Static page */}
        <Route path="/terms" element={<Terms />} />
        
        {/* 9. Health - Probe endpoint */}
        <Route path="/healthz" element={<Health />} />
        
        {/* 10. Catch-all - Legacy redirector */}
        <Route path="*" element={<LegacyRedirector />} />
      </Routes>
      
      {/* Overlay system now scoped to /dashboard only */}
      <RouteToOverlayBridge />
      
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
