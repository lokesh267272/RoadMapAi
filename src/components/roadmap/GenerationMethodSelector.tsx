
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Brain, Sparkles } from "lucide-react";
import { FC } from "react";

interface GenerationMethodSelectorProps {
  isAIGenerated: boolean;
  onChange: (isAI: boolean) => void;
}

const GenerationMethodSelector: FC<GenerationMethodSelectorProps> = ({ 
  isAIGenerated, 
  onChange 
}) => {
  return (
    <div className="space-y-3">
      <Label>Generation Method</Label>
      <RadioGroup 
        defaultValue={isAIGenerated ? "ai" : "basic"} 
        onValueChange={(value) => onChange(value === "ai")}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className={`
          flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all
          ${isAIGenerated ? 'border-primary/50 bg-primary/5' : 'hover:bg-accent'}
        `}
        onClick={() => onChange(true)}
        >
          <RadioGroupItem value="ai" id="ai" className="mt-1" />
          <div>
            <Label htmlFor="ai" className="flex items-center cursor-pointer">
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              AI-Generated (Recommended)
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Create a detailed, personalized roadmap using AI technology.
            </p>
          </div>
        </div>
        
        <div className={`
          flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all
          ${!isAIGenerated ? 'border-primary/50 bg-primary/5' : 'hover:bg-accent'}
        `}
        onClick={() => onChange(false)}
        >
          <RadioGroupItem value="basic" id="basic" className="mt-1" />
          <div>
            <Label htmlFor="basic" className="flex items-center cursor-pointer">
              <Brain className="h-4 w-4 mr-2 text-muted-foreground" />
              Basic Generator
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Create a simple day-by-day structure without AI assistance.
            </p>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
};

export default GenerationMethodSelector;
