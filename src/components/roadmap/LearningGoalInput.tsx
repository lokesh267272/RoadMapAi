
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FC } from "react";

interface LearningGoalInputProps {
  value: string;
  onChange: (value: string) => void;
}

const LearningGoalInput: FC<LearningGoalInputProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="learning-goal">Learning Goal</Label>
      <Input
        id="learning-goal"
        placeholder="e.g., Learn JavaScript in 30 days"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-background/50"
      />
    </div>
  );
};

export default LearningGoalInput;
