
import { useState, useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const VoiceAgent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Set a timeout to handle loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Use the Supabase Edge Function proxy
  const proxyUrl = "https://wxmkwxulnbcoidpfmicw.supabase.co/functions/v1/proxy-voiceagent/";

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Voice Agent</h1>
          <p className="text-muted-foreground">
            Interact with our AI-powered voice assistant
          </p>
        </div>

        {hasError && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to load the Voice Agent. The external service may be temporarily unavailable. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex items-center justify-center h-96 border rounded-lg bg-muted/50">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading Voice Agent...</p>
            </div>
          </div>
        )}

        <div className={`relative ${isLoading ? 'hidden' : 'block'}`}>
          <iframe
            src={proxyUrl}
            className="w-full h-[calc(100vh-200px)] border rounded-lg shadow-lg"
            title="Voice Agent"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-top-navigation"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{ minHeight: '600px' }}
            allow="microphone; camera; geolocation"
          />
        </div>

        {!isLoading && !hasError && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Voice Agent is now active. You can interact with the AI assistant above.
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAgent;
