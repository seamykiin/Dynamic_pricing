import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import LandingPage from "./pages/LandingPage";
import Dashboard from "./Dashboard";
import AiPricing from "./pages/AiPricing";
import Store from "./pages/Store";
import WhatIf from "./pages/WhatIf";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/ai-pricing" element={<Dashboard />} />
            <Route path="/store" element={<Store />} />
            <Route path="/what-if" element={<Dashboard />} />
            <Route path="/products" element={<Dashboard />} />
            <Route path="/reports" element={<Dashboard />} />
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
