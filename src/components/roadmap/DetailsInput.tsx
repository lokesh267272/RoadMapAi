
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FC } from "react";

interface DetailsInputProps {
  value: string;
  onChange: (value: string) => void;
}

const DetailsInput: FC<DetailsInputProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="description">Additional Details (Optional)</Label>
      <Textarea
        id="description"
        placeholder="Include any specific topics or areas you want to focus on"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[100px] bg-background/50"
      />
    </div>
  );
};

export default DetailsInput;
