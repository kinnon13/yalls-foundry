import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/lib/auth/context';
import { RequireAuth } from '@/lib/auth/guards';
import FeedbackWidget from '@/components/feedback/FeedbackWidget';
import Index from "./routes/index";
import Search from "./routes/search";
import Login from "./routes/login";
import Profile from "./routes/profile";
import ControlRoom from "./routes/admin/control-room";
import HorsesIndex from "./routes/horses/index";
import HorseDetail from "./routes/horses/[id]";
import CreateHorse from "./routes/horses/create";
import BusinessHub from "./routes/business/[bizId]/hub";
import BusinessProfileSettings from "./routes/business/[bizId]/settings/profile";
import BusinessPaymentsSettings from "./routes/business/[bizId]/settings/payments";
import BusinessCRMContacts from "./routes/business/[bizId]/crm/contacts";
import BusinessCRMLeads from "./routes/business/[bizId]/crm/leads";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const FEEDBACK_ENABLED = (import.meta.env.VITE_FEEDBACK_WIDGET ?? 'on') === 'on';

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/search" element={<Search />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/horses" element={<HorsesIndex />} />
              <Route path="/horses/create" element={<RequireAuth><CreateHorse /></RequireAuth>} />
              <Route path="/horses/:id" element={<HorseDetail />} />
              <Route path="/business/:bizId/hub" element={<RequireAuth><BusinessHub /></RequireAuth>} />
              <Route path="/business/:bizId/settings/profile" element={<RequireAuth><BusinessProfileSettings /></RequireAuth>} />
              <Route path="/business/:bizId/settings/payments" element={<RequireAuth><BusinessPaymentsSettings /></RequireAuth>} />
              <Route path="/business/:bizId/crm/contacts" element={<RequireAuth><BusinessCRMContacts /></RequireAuth>} />
              <Route path="/business/:bizId/crm/leads" element={<RequireAuth><BusinessCRMLeads /></RequireAuth>} />
              <Route path="/admin/control-room" element={<RequireAuth><ControlRoom /></RequireAuth>} />
              <Route path="*" element={<NotFound />} />
            </Routes>

            {FEEDBACK_ENABLED && <FeedbackWidget />}
            <Toaster />
            <Sonner />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
