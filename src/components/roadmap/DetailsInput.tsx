
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FC } from "react";

interface DetailsInputProps {
  value: string;
  onChange: (value: string) => void;
}

const DetailsInput: FC<DetailsInputProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="details">Additional Details (Optional)</Label>
      <Textarea
        id="details"
        placeholder="Enter any additional details, prerequisites, or specific areas you want to focus on..."
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="resize-none"
      />
    </div>
  );
};

export default DetailsInput;
