
import Hero from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleDemoClick = () => {
    setIsLoading(true);
    toast.info("Preparing demo view...");
    
    // Simulate loading time
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen">
      <Hero />
      
      {/* Demo showing loading button with tooltip */}
      <div className="container mx-auto py-10 max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Try our interactive buttons</h2>
        <div className="flex flex-col items-center space-y-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleDemoClick} 
                  isLoading={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Demo...
                    </>
                  ) : (
                    "View Interactive Demo"
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Try our interactive demo with loading states
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <p className="text-sm text-muted-foreground text-center">
            This button demonstrates our new loading state animations that provide immediate feedback when clicked
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
