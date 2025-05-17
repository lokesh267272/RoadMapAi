
import { BookOpen, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TutorialEmptyStateProps {
  topicTitle: string;
  onGenerate: () => void;
  showPulseEffect: boolean;
}

const TutorialEmptyState = ({ 
  topicTitle, 
  onGenerate, 
  showPulseEffect 
}: TutorialEmptyStateProps) => {
  return (
    <div className="text-center text-muted-foreground p-6 sm:p-12 flex flex-col items-center justify-center h-64">
      <BookOpen className="w-8 sm:w-10 h-8 sm:h-10 mb-3 sm:mb-4 text-muted-foreground/60" />
      <p className="text-base sm:text-lg font-medium mb-4">{topicTitle}</p>
      <Button 
        onClick={onGenerate} 
        className={cn(
          "flex items-center gap-2 transition-all",
          showPulseEffect && "animate-pulse bg-primary/80"
        )}
      >
        <Play className={cn(
          "h-4 w-4",
          showPulseEffect && "animate-fadeInUp" 
        )} />
        Generate Content
      </Button>
    </div>
  );
};

export default TutorialEmptyState;
