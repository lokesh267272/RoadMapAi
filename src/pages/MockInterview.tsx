
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Phone, PhoneOff, User, Calendar, Award, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InterviewSetup from "@/components/interview/InterviewSetup";
import InterviewSession from "@/components/interview/InterviewSession";
import InterviewHistory from "@/components/interview/InterviewHistory";

const MockInterview = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'setup' | 'interview' | 'history'>('setup');
  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartInterview = async (setupData: any) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('interview-ai', {
        body: {
          action: 'start_session',
          sessionData: {
            ...setupData,
            userId: user.id
          }
        }
      });

      if (error) throw error;

      setSessionData(data);
      setCurrentView('interview');
      toast.success("Interview started! Good luck!");
    } catch (error) {
      console.error('Error starting interview:', error);
      toast.error("Failed to start interview. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteInterview = () => {
    setCurrentView('setup');
    setSessionData(null);
    toast.success("Interview completed! Check your history for detailed feedback.");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to access the mock interview platform.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Mock Interview Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Practice with our AI interviewer powered by Gemini. Get real-time feedback and improve your interview skills.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <Button
              variant={currentView === 'setup' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('setup')}
              className="rounded-md"
            >
              <User className="h-4 w-4 mr-2" />
              New Interview
            </Button>
            <Button
              variant={currentView === 'history' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('history')}
              className="rounded-md"
            >
              <Calendar className="h-4 w-4 mr-2" />
              History
            </Button>
          </div>
        </div>

        {/* Main Content */}
        {currentView === 'setup' && (
          <InterviewSetup 
            onStartInterview={handleStartInterview}
            isLoading={isLoading}
          />
        )}

        {currentView === 'interview' && sessionData && (
          <InterviewSession 
            sessionData={sessionData}
            onComplete={handleCompleteInterview}
          />
        )}

        {currentView === 'history' && (
          <InterviewHistory userId={user.id} />
        )}
      </div>
    </div>
  );
};

export default MockInterview;
