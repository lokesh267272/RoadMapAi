
import React from "react";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarDayInfo } from "@/types/calendar";
import { CalendarEvent } from "./types";
import { getStatusColor } from "./utils";

interface CalendarDayProps {
  day: CalendarDayInfo;
  calendarEvents: CalendarEvent[];
  onDayClick: (date: Date) => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ day, calendarEvents, onDayClick }) => {
  const dayEvents = calendarEvents.filter(event => 
    isSameDay(event.date, day.date)
  );
  
  const hasEvents = dayEvents.length > 0;
  const allCompleted = hasEvents && dayEvents.every(event => event.completed);
  const topicTitle = dayEvents.length > 0 ? dayEvents[0].title : '';
  const topicStatus = dayEvents.length > 0 ? dayEvents[0].status : null;
  
  return (
    <div 
      className={cn(
        "relative w-full flex-1 min-h-[80px] p-2 border border-border transition-all flex flex-col",
        !day.isCurrentMonth && "bg-gray-50/50 dark:bg-gray-900/20",
        day.isToday && "bg-blue-50/50 dark:bg-blue-900/20 ring-2 ring-blue-400 dark:ring-blue-600",
        day.isSelected && "bg-primary/10",
        hasEvents && "cursor-pointer hover:bg-primary/5 transition-colors"
      )}
      onClick={() => hasEvents && onDayClick(day.date)}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={cn(
          "flex items-center justify-center h-7 w-7 text-sm font-medium rounded-full",
          day.isToday && "bg-primary text-white",
          !day.isToday && "text-gray-700 dark:text-gray-300"
        )}>
          {format(day.date, 'd')}
        </span>
        {hasEvents && topicStatus && (
          <span className={cn(
            "h-2 w-2 rounded-full",
            topicStatus === 'completed' && "bg-green-500",
            topicStatus === 'pending' && "bg-amber-500",
            topicStatus === 'missed' && "bg-red-500"
          )}/>
        )}
      </div>
      
      {hasEvents && (
        <div className={cn(
          "mt-auto p-1.5 rounded-md border text-xs font-medium overflow-hidden",
          getStatusColor(topicStatus!)
        )}>
          <div className="line-clamp-2">{topicTitle}</div>
        </div>
      )}
    </div>
  );
};

export default CalendarDay;
