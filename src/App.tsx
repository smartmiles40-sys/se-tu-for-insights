import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ImportPage from "./pages/ImportPage";
import StagingPage from "./pages/StagingPage";
import SDRPage from "./pages/SDRPage";
import EspecialistasPage from "./pages/EspecialistasPage";
import MarketingPage from "./pages/MarketingPage";
import MetasPage from "./pages/MetasPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/import" element={<ProtectedRoute requiredRole="gestor"><ImportPage /></ProtectedRoute>} />
              <Route path="/staging" element={<ProtectedRoute requiredRole="gestor"><StagingPage /></ProtectedRoute>} />
              <Route path="/sdr" element={<ProtectedRoute><SDRPage /></ProtectedRoute>} />
              <Route path="/especialistas" element={<ProtectedRoute><EspecialistasPage /></ProtectedRoute>} />
              <Route path="/marketing" element={<ProtectedRoute><MarketingPage /></ProtectedRoute>} />
              <Route path="/metas" element={<ProtectedRoute requiredRole="gestor"><MetasPage /></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute requiredRole="gestor"><ConfiguracoesPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
