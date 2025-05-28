import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const VoiceAgent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Construct the URL dynamically to obfuscate it from dev tools
  const getEmbedUrl = () => {
    const parts = ['https://', 'voiceagent', 'learningpath', 'ai', '.netlify.app/'];
    return parts.join('');
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    // Force iframe reload by changing src
    const iframe = document.getElementById('voice-agent-iframe') as HTMLIFrameElement;
    if (iframe) {
      const currentSrc = iframe.src;
      iframe.src = '';
      setTimeout(() => {
        iframe.src = currentSrc;
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Voice Agent</h1>
            <Badge variant="secondary" className="text-xs font-medium">
              Beta
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Interact with our AI-powered voice agent for personalized learning assistance
          </p>
        </div>

        <Card className="relative overflow-hidden shadow-lg">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading Voice Agent...</p>
              </div>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4 text-center max-w-md">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Failed to Load Voice Agent</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    There was an issue loading the voice agent. Please try again.
                  </p>
                  <Button onClick={handleRetry} variant="outline">
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          <iframe
            id="voice-agent-iframe"
            src={getEmbedUrl()}
            className="w-full h-screen border-0"
            style={{ minHeight: '80vh' }}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="Voice Agent"
            allow="microphone; camera; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </Card>
      </div>
    </div>
  );
};

export default VoiceAgent;
