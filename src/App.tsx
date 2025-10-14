import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/lib/auth/context';
import FeedbackWidget from '@/components/feedback/FeedbackWidget';
import Index from "./routes/index";
import Search from "./routes/search";
import Login from "./routes/login";
import Profile from "./routes/profile";
import ControlRoom from "./routes/admin/control-room";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const FEEDBACK_ENABLED = import.meta.env.VITE_FEEDBACK_WIDGET === 'on';

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
              <Route path="/admin/control-room" element={<ControlRoom />} />
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
