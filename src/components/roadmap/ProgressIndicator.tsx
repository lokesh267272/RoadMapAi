
import { Progress } from "@/components/ui/progress";
import { FC } from "react";

interface ProgressIndicatorProps {
  isLoading: boolean;
  value: number;
}

const ProgressIndicator: FC<ProgressIndicatorProps> = ({ isLoading, value }) => {
  if (!isLoading) return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Generating your roadmap...</span>
        <span>{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
};

export default ProgressIndicator;
