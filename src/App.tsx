import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { Suspense, lazy } from 'react';
import { AuthProvider } from '@/lib/auth/context';
import { RequireAuth } from '@/lib/auth/guards';
import FeedbackWidget from '@/components/feedback/FeedbackWidget';
import { RockerChat } from '@/components/rocker/RockerChat';
import { RockerSuggestions } from '@/components/rocker/RockerSuggestions';
import InactivityNudge from '@/components/rocker/InactivityNudge';
import { RockerProvider } from '@/lib/ai/rocker/context';
import { RedirectHandler } from '@/components/navigation/RedirectHandler';
import Index from "./routes/index";
import Search from "./routes/search";
import Login from "./routes/login";
import Profile from "./routes/profile";
import ControlRoom from "./routes/admin/control-room";
import MarketplaceIndex from "./routes/marketplace/index";
import ListingDetail from "./routes/marketplace/[id]";
import NotFound from "./pages/NotFound";

// Lazy load dashboard
const Dashboard = lazy(() => import('./routes/dashboard'));

const queryClient = new QueryClient();
const FEEDBACK_ENABLED = (import.meta.env.VITE_FEEDBACK_WIDGET ?? 'on') === 'on';

import { CommandPalette } from '@/components/command/CommandPalette';

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <RockerProvider>
              {/* Global Command Palette */}
              <CommandPalette />
              
              <RedirectHandler />
              <Routes>
          {/* 7-Route Spine */}
          <Route path="/" element={<Index />} />
          <Route path="/search" element={<Search />} />
          <Route path="/marketplace" element={<MarketplaceIndex />} />
          <Route path="/marketplace/:id" element={<ListingDetail />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Suspense fallback={<div>Loading...</div>}>
                  <Dashboard />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route path="/admin/control-room" element={<RequireAuth><ControlRoom /></RequireAuth>} />

          {/* Auth Route (handles both login & signup via tabs) */}
          <Route path="/login" element={<Login />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
              </Routes>

              {FEEDBACK_ENABLED && <FeedbackWidget />}
              <InactivityNudge />
              <RockerChat />
              <RockerSuggestions />
              <Toaster />
              <Sonner />
            </RockerProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
