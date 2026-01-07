import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Agent Pages
import AgentDashboard from "./pages/agent/AgentDashboard";
import AgentBrowseCampaigns from "./pages/agent/AgentBrowseCampaigns";
import AgentCampaigns from "./pages/agent/AgentCampaigns";
import AgentEarnings from "./pages/agent/AgentEarnings";

// Business Pages
import BusinessDashboard from "./pages/business/BusinessDashboard";
import BusinessCreateCampaign from "./pages/business/BusinessCreateCampaign";
import BusinessCampaigns from "./pages/business/BusinessCampaigns";
import BusinessPayments from "./pages/business/BusinessPayments";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Agent Routes */}
            <Route
              path="/agent/dashboard"
              element={
                <ProtectedRoute allowedRole="agent">
                  <AgentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/browse"
              element={
                <ProtectedRoute allowedRole="agent">
                  <AgentBrowseCampaigns />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/campaigns"
              element={
                <ProtectedRoute allowedRole="agent">
                  <AgentCampaigns />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/earnings"
              element={
                <ProtectedRoute allowedRole="agent">
                  <AgentEarnings />
                </ProtectedRoute>
              }
            />

            {/* Business Owner Routes */}
            <Route
              path="/business/dashboard"
              element={
                <ProtectedRoute allowedRole="business_owner">
                  <BusinessDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/campaigns/new"
              element={
                <ProtectedRoute allowedRole="business_owner">
                  <BusinessCreateCampaign />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/campaigns"
              element={
                <ProtectedRoute allowedRole="business_owner">
                  <BusinessCampaigns />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/payments"
              element={
                <ProtectedRoute allowedRole="business_owner">
                  <BusinessPayments />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
