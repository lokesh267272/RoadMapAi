import { Brain, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingAnimationProps {
  isLoading: boolean;
  progress: number;
}

export function LoadingAnimation({ isLoading, progress }: LoadingAnimationProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 p-6 bg-glass rounded-xl shadow-lg text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          
          {/* Middle spinning ring - opposite direction */}
          <div className="absolute inset-4 rounded-full border-3 border-primary/30 border-t-primary animate-spin-slow" />
          
          {/* Inner spinning ring */}
          <div className="absolute inset-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          
          {/* Core with pulsing effect */}
          <div className="absolute inset-12 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
            <Brain className="h-8 w-8 text-white animate-pulse" />
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          AI is Creating Your Roadmap
        </h3>
        
        <p className="text-muted-foreground mb-4">
          Our AI is analyzing your learning goals and creating a personalized roadmap...
        </p>

        {/* Progress bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <p className="text-sm text-muted-foreground">
          {progress < 30 && "Analyzing your learning goals..."}
          {progress >= 30 && progress < 60 && "Generating personalized content..."}
          {progress >= 60 && progress < 90 && "Structuring your learning path..."}
          {progress >= 90 && "Finalizing your roadmap..."}
        </p>
      </div>
    </div>
  );
} 