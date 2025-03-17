
import { Calendar } from "lucide-react";
import { FC } from "react";

interface ScheduleInfoProps {
  duration: number;
}

const ScheduleInfo: FC<ScheduleInfoProps> = ({ duration }) => {
  return (
    <div className="bg-muted/50 rounded-lg p-4 border">
      <div className="flex items-start gap-3">
        <Calendar className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <h3 className="font-medium">Planning your schedule</h3>
          <p className="text-muted-foreground text-sm">
            Your roadmap will include {duration} daily learning topics. You can adjust your schedule later if needed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInfo;
