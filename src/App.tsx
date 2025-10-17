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
import { RockerDock } from '@/components/rocker/RockerDock';
import { RockerProvider } from '@/lib/ai/rocker/context';
import { RedirectHandler } from '@/components/navigation/RedirectHandler';
import PreviewRoutes from '@/preview/PreviewRoutes';
import { PreviewMessageListener } from '@/components/preview/PreviewMessageListener';
import Index from "./routes/index";
import Search from "./routes/search";
import Login from "./routes/login";
import Profile from "./routes/profile";
import ControlRoom from "./routes/admin/control-room";
import NotFound from "./pages/NotFound";

// Lazy load dashboard and AI routes
const Dashboard = lazy(() => import('./routes/dashboard'));
const AISettings = lazy(() => import('./routes/settings/ai'));
const AIActivity = lazy(() => import('./routes/ai/activity'));
const EntitiesList = lazy(() => import('./routes/entities/index'));
const EntityDetail = lazy(() => import('./routes/entities/[id]'));
const Feed = lazy(() => import('./routes/feed/index'));
const Messages = lazy(() => import('./routes/messages/index'));
const CRM = lazy(() => import('./routes/crm/index'));
const ClaimEntity = lazy(() => import('./routes/claim/[entityId]'));
const AdminClaims = lazy(() => import('./routes/admin/claims'));

// Phase 3: Marketplace & Events
const ListingsIndex = lazy(() => import('./routes/listings/index'));
const NewListing = lazy(() => import('./routes/listings/new'));
const ListingDetail = lazy(() => import('./routes/listings/[id]'));
const EditListing = lazy(() => import('./routes/listings/[id]/edit'));
const EventsIndex = lazy(() => import('./routes/events/index'));
const NewEvent = lazy(() => import('./routes/events/new'));
const EventDetail = lazy(() => import('./routes/events/[id]'));
const EventClasses = lazy(() => import('./routes/events/[id]/classes'));
const EventEntries = lazy(() => import('./routes/events/[id]/entries'));
const EventDraw = lazy(() => import('./routes/events/[id]/draw'));
const EventResults = lazy(() => import('./routes/events/[id]/results'));
const EventPayouts = lazy(() => import('./routes/events/[id]/payouts'));
const EventEnter = lazy(() => import('./routes/events/[eventId]/enter'));
const EventStalls = lazy(() => import('./routes/events/[id]/stalls-booking'));
const EventQRCheckin = lazy(() => import('./routes/events/[eventId]/qr-checkin'));
const PublicDraw = lazy(() => import('./routes/events/[id]/public-draw'));
const PublicResults = lazy(() => import('./routes/events/[id]/public-results'));
const EventDrawPublic = lazy(() => import('./routes/events/[eventId]/draw'));
const EventResultsPublic = lazy(() => import('./routes/events/[eventId]/results'));
const StallionsIndex = lazy(() => import('./routes/stallions/index'));
const StallionDetail = lazy(() => import('./routes/stallions/[id]'));
const ProfilePageDynamic = lazy(() => import('./routes/profile/[id]'));
const CartPage = lazy(() => import('./routes/cart/index'));
const OrdersIndex = lazy(() => import('./routes/orders/index'));
const OrderDetail = lazy(() => import('./routes/orders/[id]'));
const Discover = lazy(() => import('./routes/discover'));
const FarmCalendar = lazy(() => import('./routes/farm/calendar'));
const FarmDashboard = lazy(() => import('./routes/farm/dashboard'));
const BoarderProfile = lazy(() => import('./routes/farm/boarder/[id]'));
const IncentivesDashboard = lazy(() => import('./routes/incentives/dashboard'));

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
          <Route path="/profile" element={<Suspense fallback={<div>Loading...</div>}><ProfilePageDynamic /></Suspense>} />
          <Route path="/profile/:id" element={<Suspense fallback={<div>Loading...</div>}><ProfilePageDynamic /></Suspense>} />
          <Route path="/stallions" element={<Suspense fallback={<div>Loading...</div>}><StallionsIndex /></Suspense>} />
          <Route path="/stallions/:id" element={<Suspense fallback={<div>Loading...</div>}><StallionDetail /></Suspense>} />
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

          {/* Phase 3: Listings & Events */}
          <Route path="/listings" element={<Suspense fallback={<div>Loading...</div>}><ListingsIndex /></Suspense>} />
          <Route path="/listings/new" element={<RequireAuth><Suspense fallback={<div>Loading...</div>}><NewListing /></Suspense></RequireAuth>} />
          <Route path="/listings/:id" element={<Suspense fallback={<div>Loading...</div>}><ListingDetail /></Suspense>} />
          <Route path="/listings/:id/edit" element={<RequireAuth><Suspense fallback={<div>Loading...</div>}><EditListing /></Suspense></RequireAuth>} />
          <Route path="/events" element={<Suspense fallback={<div>Loading...</div>}><EventsIndex /></Suspense>} />
          <Route path="/events/new" element={<RequireAuth><Suspense fallback={<div>Loading...</div>}><NewEvent /></Suspense></RequireAuth>} />
          <Route path="/events/:id" element={<Suspense fallback={<div>Loading...</div>}><EventDetail /></Suspense>}>
            <Route path="classes" element={<Suspense fallback={<div>Loading...</div>}><EventClasses /></Suspense>} />
            <Route path="entries" element={<Suspense fallback={<div>Loading...</div>}><EventEntries /></Suspense>} />
            <Route path="draw" element={<Suspense fallback={<div>Loading...</div>}><EventDraw /></Suspense>} />
            <Route path="results" element={<Suspense fallback={<div>Loading...</div>}><EventResults /></Suspense>} />
            <Route path="payouts" element={<Suspense fallback={<div>Loading...</div>}><EventPayouts /></Suspense>} />
            <Route path="stalls" element={<Suspense fallback={<div>Loading...</div>}><EventStalls /></Suspense>} />
            <Route path="public-draw" element={<Suspense fallback={<div>Loading...</div>}><PublicDraw /></Suspense>} />
            <Route path="public-results" element={<Suspense fallback={<div>Loading...</div>}><PublicResults /></Suspense>} />
          </Route>
          <Route path="/events/:eventId/enter" element={<RequireAuth><Suspense fallback={<div>Loading...</div>}><EventEnter /></Suspense></RequireAuth>} />
          <Route path="/events/:eventId/qr-checkin" element={<RequireAuth><Suspense fallback={<div>Loading...</div>}><EventQRCheckin /></Suspense></RequireAuth>} />
          <Route path="/events/:eventId/draw" element={<Suspense fallback={<div>Loading...</div>}><EventDrawPublic /></Suspense>} />
          <Route path="/events/:eventId/results" element={<Suspense fallback={<div>Loading...</div>}><EventResultsPublic /></Suspense>} />
          <Route path="/cart" element={<RequireAuth><Suspense fallback={<div>Loading...</div>}><CartPage /></Suspense></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><Suspense fallback={<div>Loading...</div>}><OrdersIndex /></Suspense></RequireAuth>} />
          <Route path="/orders/:id" element={<RequireAuth><Suspense fallback={<div>Loading...</div>}><OrderDetail /></Suspense></RequireAuth>} />
          
          {/* Discovery */}
          <Route path="/discover" element={<Suspense fallback={<div>Loading...</div>}><Discover /></Suspense>} />
          
          {/* Farm Ops */}
          <Route path="/farm/calendar" element={<RequireAuth><Suspense fallback={<div>Loading...</div>}><FarmCalendar /></Suspense></RequireAuth>} />
          <Route path="/farm/dashboard" element={<RequireAuth><Suspense fallback={<div>Loading...</div>}><FarmDashboard /></Suspense></RequireAuth>} />
          <Route path="/farm/boarder/:id" element={<RequireAuth><Suspense fallback={<div>Loading...</div>}><BoarderProfile /></Suspense></RequireAuth>} />
          
          {/* Incentives */}
          <Route path="/incentives/dashboard" element={<RequireAuth><Suspense fallback={<div>Loading...</div>}><IncentivesDashboard /></Suspense></RequireAuth>} />
          
          {/* Legacy marketplace routes - redirect to listings */}
          <Route path="/marketplace" element={<Suspense fallback={<div>Loading...</div>}><ListingsIndex /></Suspense>} />
          <Route path="/marketplace/:id" element={<Suspense fallback={<div>Loading...</div>}><ListingDetail /></Suspense>} />

          {/* Phase 2: Social + CRM Routes */}
          <Route
            path="/feed"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <Feed />
              </Suspense>
            }
          />
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
          <Route
            path="/crm"
            element={
              <RequireAuth>
                <Suspense fallback={<div>Loading...</div>}>
                  <CRM />
                </Suspense>
              </RequireAuth>
            }
          />

          {/* AI/Rocker Routes */}
          <Route
            path="/settings/ai"
            element={
              <RequireAuth>
                <Suspense fallback={<div>Loading...</div>}>
                  <AISettings />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/ai/activity"
            element={
              <RequireAuth>
                <Suspense fallback={<div>Loading...</div>}>
                  <AIActivity />
                </Suspense>
              </RequireAuth>
            }
          />

          {/* Entity Routes */}
          <Route
            path="/entities"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <EntitiesList />
              </Suspense>
            }
          />
          <Route
            path="/entities/:id"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <EntityDetail />
              </Suspense>
            }
          />
          <Route
            path="/claim/:entityId"
            element={
              <RequireAuth>
                <Suspense fallback={<div>Loading...</div>}>
                  <ClaimEntity />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/claims"
            element={
              <RequireAuth>
                <Suspense fallback={<div>Loading...</div>}>
                  <AdminClaims />
                </Suspense>
              </RequireAuth>
            }
          />

          {/* Auth Route (handles both login & signup via tabs) */}
          <Route path="/login" element={<Login />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
              </Routes>

              {/* Preview Routes (dev/staging only) */}
              <PreviewRoutes />

              {/* Preview message handler */}
              <PreviewMessageListener />

              {FEEDBACK_ENABLED && <FeedbackWidget />}
              <InactivityNudge />
              <RockerDock />
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
