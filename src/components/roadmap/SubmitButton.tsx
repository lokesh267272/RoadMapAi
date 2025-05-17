
import { Button } from "@/components/ui/button";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { FC } from "react";

interface SubmitButtonProps {
  isLoading: boolean;
  isAIGenerated: boolean;
}

const SubmitButton: FC<SubmitButtonProps> = ({ isLoading, isAIGenerated }) => {
  return (
    <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isAIGenerated ? "AI is creating your roadmap..." : "Generating Roadmap..."}
        </>
      ) : (
        <>
          {isAIGenerated ? (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate AI Learning Roadmap
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Generate Basic Roadmap
            </>
          )}
        </>
      )}
    </Button>
  );
};

export default SubmitButton;
