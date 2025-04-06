
import React from "react";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface QuizOptionProps {
  option: string;
  isSelected: boolean;
  isCorrect: boolean | null;
  showAnswer: boolean;
  onSelect: () => void;
  disabled: boolean;
}

const QuizOption: React.FC<QuizOptionProps> = ({
  option,
  isSelected,
  isCorrect,
  showAnswer,
  onSelect,
  disabled
}) => {
  return (
    <button
      className={cn(
        "flex items-center justify-between w-full p-4 my-2 rounded-lg border text-left transition-colors",
        isSelected && !showAnswer && "border-primary bg-primary/10",
        showAnswer && isSelected && isCorrect && "border-green-500 bg-green-500/10",
        showAnswer && isSelected && isCorrect === false && "border-red-500 bg-red-500/10",
        showAnswer && !isSelected && isCorrect && "border-green-500 bg-green-500/10 opacity-60",
        !disabled && !isSelected && "hover:bg-muted"
      )}
      onClick={onSelect}
      disabled={disabled}
    >
      <span>{option}</span>
      {showAnswer && isSelected && isCorrect && (
        <Check className="h-5 w-5 text-green-500" />
      )}
      {showAnswer && isSelected && isCorrect === false && (
        <X className="h-5 w-5 text-red-500" />
      )}
      {showAnswer && !isSelected && isCorrect && (
        <Check className="h-5 w-5 text-green-500 opacity-60" />
      )}
    </button>
  );
};

export default QuizOption;
