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
import Index from "./routes/index";
import Search from "./routes/search";
import Login from "./routes/login";
import Signup from "./routes/signup";
import ConsentPage from "./routes/consent";
import AIManagement from "./routes/ai-management";
import Profile from "./routes/profile";
import ControlRoom from "./routes/admin/control-room";
import MarketplaceIndex from "./routes/marketplace/index";
import ListingDetail from "./routes/marketplace/[id]";
import Cart from "./routes/cart";
import Checkout from "./routes/checkout";
import HorsesIndex from "./routes/horses/index";
import HorseDetail from "./routes/horses/[id]";
import CreateHorse from "./routes/horses/create";
import EventsIndex from "./routes/events/index";
import CreateEvent from "./routes/events/create";
import EventDetail from "./routes/events/[id]";
import SavedPosts from "./routes/posts/saved";
import BusinessHub from "./routes/business/[bizId]/hub";
import BusinessProfileSettings from "./routes/business/[bizId]/settings/profile";
import BusinessPaymentsSettings from "./routes/business/[bizId]/settings/payments";
import BusinessCRMContacts from "./routes/business/[bizId]/crm/contacts";
import BusinessCRMLeads from "./routes/business/[bizId]/crm/leads";
import Calendar from "./routes/calendar";
import UnclaimedEntities from "./routes/entities/unclaimed";
import NotFound from "./pages/NotFound";
import RockerDebugRoute from "./routes/rocker-debug";

// Lazy load MLM routes
const Dashboard = lazy(() => import('./routes/dashboard'));
const MLMDashboard = lazy(() => import('./routes/mlm/dashboard'));
const MLMTree = lazy(() => import('./routes/mlm/tree'));

const queryClient = new QueryClient();
const FEEDBACK_ENABLED = (import.meta.env.VITE_FEEDBACK_WIDGET ?? 'on') === 'on';

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <RockerProvider>
              <Routes>
              <Route path="/" element={<Index />} />
          <Route path="/search" element={<Search />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/consent" element={<ConsentPage />} />
          <Route path="/ai-management" element={<RequireAuth><AIManagement /></RequireAuth>} />
          
          {/* Marketplace Routes */}
          <Route path="/marketplace" element={<MarketplaceIndex />} />
          <Route path="/marketplace/:id" element={<ListingDetail />} />
          <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
          <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />

          {/* Dashboard */}
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

          {/* MLM Routes */}
          <Route
            path="/mlm/dashboard"
            element={
              <RequireAuth>
                <Suspense fallback={<div>Loading...</div>}>
                  <MLMDashboard />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route
            path="/mlm/tree"
            element={
              <RequireAuth>
                <Suspense fallback={<div>Loading...</div>}>
                  <MLMTree />
                </Suspense>
              </RequireAuth>
            }
          />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/horses" element={<HorsesIndex />} />
              <Route path="/horses/create" element={<RequireAuth><CreateHorse /></RequireAuth>} />
              <Route path="/horses/:id" element={<HorseDetail />} />
              <Route path="/posts/saved" element={<RequireAuth><SavedPosts /></RequireAuth>} />
              <Route path="/events" element={<EventsIndex />} />
              <Route path="/events/create" element={<RequireAuth><CreateEvent /></RequireAuth>} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/business/:bizId/hub" element={<RequireAuth><BusinessHub /></RequireAuth>} />
              <Route path="/business/:bizId/settings/profile" element={<RequireAuth><BusinessProfileSettings /></RequireAuth>} />
              <Route path="/business/:bizId/settings/payments" element={<RequireAuth><BusinessPaymentsSettings /></RequireAuth>} />
              <Route path="/business/:bizId/crm/contacts" element={<RequireAuth><BusinessCRMContacts /></RequireAuth>} />
              <Route path="/business/:bizId/crm/leads" element={<RequireAuth><BusinessCRMLeads /></RequireAuth>} />
              <Route path="/calendar" element={<RequireAuth><Calendar /></RequireAuth>} />
              <Route path="/entities/unclaimed" element={<UnclaimedEntities />} />
              <Route path="/rocker-debug" element={<RequireAuth><RockerDebugRoute /></RequireAuth>} />
              <Route path="/admin/control-room" element={<RequireAuth><ControlRoom /></RequireAuth>} />
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
