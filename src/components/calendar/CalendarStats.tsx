import React from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CalendarStatsProps {
  streak: number;
  completionRate: number;
  needsCompletion: boolean;
  streakStatus: string;
}

const CalendarStats: React.FC<CalendarStatsProps> = ({ 
  streak, 
  completionRate,
  needsCompletion,
  streakStatus 
}) => {
  return (
    <Card className="bg-glass shadow">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Current Streak</h3>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold mr-1">{streak}</span>
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <div className={cn(
              "text-xs",
              needsCompletion ? "text-amber-500" : "text-muted-foreground"
            )}>
              {streakStatus}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Completion Rate</h3>
            <div className="space-y-1">
              <Progress value={completionRate} className="h-2" />
              <span className="text-sm font-medium">{completionRate}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarStats;
