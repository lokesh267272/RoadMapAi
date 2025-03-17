
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { FC } from "react";

interface DurationSliderProps {
  value: number[];
  onChange: (value: number[]) => void;
}

const DurationSlider: FC<DurationSliderProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Duration (days)</Label>
        <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm font-medium">
          {value[0]} days
        </span>
      </div>
      <Slider
        value={value}
        onValueChange={onChange}
        max={90}
        min={7}
        step={1}
        className="py-2"
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>1 week</span>
        <span>90 days</span>
      </div>
    </div>
  );
};

export default DurationSlider;
