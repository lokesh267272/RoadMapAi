
import { Button } from "@/components/ui/button";
import { Calendar, Sparkles } from "lucide-react";
import { FC } from "react";

interface GenerationMethodSelectorProps {
  isAIGenerated: boolean;
  onChange: (isAIGenerated: boolean) => void;
}

const GenerationMethodSelector: FC<GenerationMethodSelectorProps> = ({
  isAIGenerated,
  onChange,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Button
        type="button"
        variant={isAIGenerated ? "default" : "outline"}
        className="flex-1"
        onClick={() => onChange(true)}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Use AI Generation
      </Button>
      <Button
        type="button"
        variant={!isAIGenerated ? "default" : "outline"}
        className="flex-1"
        onClick={() => onChange(false)}
      >
        <Calendar className="mr-2 h-4 w-4" />
        Basic Schedule
      </Button>
    </div>
  );
};

export default GenerationMethodSelector;
