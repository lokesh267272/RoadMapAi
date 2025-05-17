
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TutorialLoadingProps {
  progress: number;
}

const TutorialLoading = ({ progress }: TutorialLoadingProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 p-6">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-center text-muted-foreground mb-3">Generating tutorial content...</p>
      <div className="w-full max-w-xs">
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
};

export default TutorialLoading;
