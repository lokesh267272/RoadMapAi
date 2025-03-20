
import { FC } from "react";
import { CalendarDays, Clock, LucideIcon } from "lucide-react";

interface ScheduleInfoProps {
  duration: number;
}

const ScheduleInfo: FC<ScheduleInfoProps> = ({ duration }) => {
  // Calculate some additional info
  const estimatedHoursPerDay = 1;
  const totalHours = duration * estimatedHoursPerDay;
  
  const ScheduleItem = ({ 
    icon: Icon, 
    label, 
    value 
  }: { 
    icon: LucideIcon; 
    label: string; 
    value: string 
  }) => (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <div className="text-sm">
        <span className="text-muted-foreground">{label}:</span> {value}
      </div>
    </div>
  );
  
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-3 p-4 bg-muted/50 rounded-lg border">
      <ScheduleItem 
        icon={CalendarDays} 
        label="Learning period" 
        value={`${duration} days`} 
      />
      <ScheduleItem 
        icon={Clock} 
        label="Total study time" 
        value={`~${totalHours} hours`} 
      />
    </div>
  );
};

export default ScheduleInfo;
