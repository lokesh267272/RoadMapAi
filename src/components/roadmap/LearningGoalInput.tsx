
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
      <Label htmlFor="learningGoal">What do you want to learn?</Label>
      <Input
        id="learningGoal"
        placeholder="e.g. JavaScript, Machine Learning, Spanish..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
};

export default LearningGoalInput;
