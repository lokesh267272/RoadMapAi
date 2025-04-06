
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FullScreenCalendar } from "../ui/fullscreen-calendar";
import { formatCalendarData } from "./utils";
import { CalendarEvent } from "./types";

interface CalendarContainerProps {
  calendarEvents: CalendarEvent[];
  onDayClick: (date: Date) => void;
}

const CalendarContainer: React.FC<CalendarContainerProps> = ({ 
  calendarEvents, 
  onDayClick 
}) => {
  return (
    <Card className="bg-glass shadow col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Learning Calendar</CardTitle>
      </CardHeader>
        
      <CardContent className="p-0">
        <FullScreenCalendar 
          data={formatCalendarData(calendarEvents)} 
          onDayClick={onDayClick}
        />
      </CardContent>
    </Card>
  );
};

export default CalendarContainer;
