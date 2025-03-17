
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";

// Fix: Add className to the displayMonth type
interface CalendarDayInfo {
  displayMonth: Date;
  className?: string; // Added className property to fix the error
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

// Sample data for calendar events
const calendarEvents = [
  {
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
    title: "Introduction to Programming",
    completed: true
  },
  {
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 16),
    title: "Variables and Data Types",
    completed: true
  },
  {
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 17),
    title: "Control Flow Statements",
    completed: false
  },
  {
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 18),
    title: "Functions and Parameters",
    completed: false
  }
];

const CalendarView = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Get events for the selected date
  const selectedDateEvents = selectedDate 
    ? calendarEvents.filter(event => 
        event.date.getDate() === selectedDate.getDate() && 
        event.date.getMonth() === selectedDate.getMonth() && 
        event.date.getFullYear() === selectedDate.getFullYear()
      )
    : [];

  // Custom day render function to show event indicators
  const renderDay = (day: CalendarDayInfo) => {
    // Check if this day has any events
    const hasEvents = calendarEvents.some(event => 
      event.date.getDate() === day.date.getDate() && 
      event.date.getMonth() === day.date.getMonth() && 
      event.date.getFullYear() === day.date.getFullYear()
    );

    // Get completion status if events exist
    let allCompleted = false;
    if (hasEvents) {
      const dayEvents = calendarEvents.filter(event => 
        event.date.getDate() === day.date.getDate() && 
        event.date.getMonth() === day.date.getMonth() && 
        event.date.getFullYear() === day.date.getFullYear()
      );
      allCompleted = dayEvents.every(event => event.completed);
    }

    return (
      <div className={cn(
        "relative h-9 w-9 p-0 flex items-center justify-center",
        hasEvents && "font-semibold",
        hasEvents && allCompleted && "text-green-600",
        day.className // This is the className property we added
      )}>
        <span>{day.day}</span>
        {hasEvents && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
            <div className={`h-1 w-1 rounded-full ${allCompleted ? 'bg-green-500' : 'bg-primary'}`}></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeInUp">
      <Card className="bg-glass">
        <CardHeader>
          <CardTitle>Learning Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="border rounded-md"
            components={{
              Day: renderDay
            }}
          />
        </CardContent>
      </Card>

      <Card className="bg-glass">
        <CardHeader>
          <CardTitle>
            {selectedDate ? `Topics for ${selectedDate.toLocaleDateString()}` : 'Select a date to view topics'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateEvents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedDateEvents.map((event, index) => (
                  <TableRow key={index}>
                    <TableCell>{event.title}</TableCell>
                    <TableCell>
                      {event.completed ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 flex items-center gap-1">
                          <CircleDashed className="h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              {selectedDate 
                ? "No learning topics scheduled for this date" 
                : "Select a date to see your learning topics"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView;
