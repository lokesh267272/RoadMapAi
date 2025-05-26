
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Provider as TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy loaded pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const FlowchartView = lazy(() => import("./pages/FlowchartView"));
const QuizGenerator = lazy(() => import("./pages/QuizGenerator"));
const AiTutor = lazy(() => import("./pages/AiTutor"));
const AiTutorSelection = lazy(() => import("./pages/AiTutorSelection"));
const VoiceAgent = lazy(() => import("./pages/VoiceAgent"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-pulse h-8 w-8 rounded-full bg-primary"></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Index />} />
                <Route path="auth" element={<Auth />} />
                <Route path="dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="flowchart/:roadmapId" element={
                  <ProtectedRoute>
                    <FlowchartView />
                  </ProtectedRoute>
                } />
                <Route path="quiz-generator" element={
                  <ProtectedRoute>
                    <QuizGenerator />
                  </ProtectedRoute>
                } />
                <Route path="ai-tutor" element={
                  <ProtectedRoute>
                    <AiTutorSelection />
                  </ProtectedRoute>
                } />
                <Route path="ai-tutor/:roadmapId" element={
                  <ProtectedRoute>
                    <AiTutor />
                  </ProtectedRoute>
                } />
                <Route path="voiceagent" element={<VoiceAgent />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
