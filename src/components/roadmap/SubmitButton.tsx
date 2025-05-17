
import { Button } from "@/components/ui/button";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { FC, useState } from "react";
import { cn } from "@/lib/utils";

interface SubmitButtonProps {
  isLoading: boolean;
  isAIGenerated: boolean;
}

const SubmitButton: FC<SubmitButtonProps> = ({ isLoading, isAIGenerated }) => {
  const [isPulsing, setIsPulsing] = useState(false);
  
  const handleMouseDown = () => {
    setIsPulsing(true);
  };
  
  const handleMouseUp = () => {
    setTimeout(() => {
      setIsPulsing(false);
    }, 300);
  };
  
  return (
    <Button 
      type="submit" 
      className={cn(
        "w-full transition-all", 
        isPulsing && !isLoading && "scale-[0.98] bg-primary/90",
        isLoading && "cursor-progress"
      )}
      disabled={isLoading}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span className="animate-pulse">
            {isAIGenerated ? "AI is creating your roadmap..." : "Generating Roadmap..."}
          </span>
        </>
      ) : (
        <>
          {isAIGenerated ? (
            <>
              <Sparkles className={cn("mr-2 h-4 w-4", isPulsing && "animate-pulse")} />
              Generate AI Learning Roadmap
            </>
          ) : (
            <>
              <Brain className={cn("mr-2 h-4 w-4", isPulsing && "animate-pulse")} />
              Generate Basic Roadmap
            </>
          )}
        </>
      )}
    </Button>
  );
};

export default SubmitButton;
