import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { FC } from "react";

interface DurationSliderProps {
  value: number[];
  onChange: (value: number[]) => void;
}

const DurationSlider: FC<DurationSliderProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label htmlFor="duration">Duration (Days)</Label>
        <span className="text-sm font-medium">{value[0]} days</span>
      </div>
      <Slider
        id="duration"
        defaultValue={value}
        max={60}
        min={7}
        step={1}
        value={value}
        onValueChange={onChange}
        aria-label="Learning roadmap duration in days"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>1 week</span>
        <span>1 month</span>
        <span>2 months</span>
      </div>
    </div>
  );
};

export default DurationSlider;
