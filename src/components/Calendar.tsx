
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "sonner";

// Mock data for the calendar
const mockEvents = [
  { date: new Date(2023, 6, 12), title: "JavaScript Basics", completed: true },
  { date: new Date(2023, 6, 13), title: "Variables & Data Types", completed: true },
  { date: new Date(2023, 6, 14), title: "Functions & Scope", completed: false },
  { date: new Date(2023, 6, 15), title: "Arrays & Objects", completed: false },
  { date: new Date(2023, 6, 18), title: "DOM Manipulation", completed: false },
];

// Function to format date to string
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState(mockEvents);

  // Find events for the selected date
  const selectedEvents = selectedDate
    ? events.filter(
        (event) =>
          event.date.getDate() === selectedDate.getDate() &&
          event.date.getMonth() === selectedDate.getMonth() &&
          event.date.getFullYear() === selectedDate.getFullYear()
      )
    : [];

  // Function to handle marking an event as completed
  const handleMarkCompleted = (title: string) => {
    setEvents(
      events.map((event) =>
        event.title === title ? { ...event, completed: true } : event
      )
    );
    toast.success(`"${title}" marked as completed!`);
  };

  // Function to get date styling for the calendar
  const getDayClassNames = (day: Date | undefined) => {
    if (!day) return "";

    const isEventDay = events.some(
      (event) =>
        event.date.getDate() === day.getDate() &&
        event.date.getMonth() === day.getMonth() &&
        event.date.getFullYear() === day.getFullYear()
    );

    const isCompletedDay = events.some(
      (event) =>
        event.date.getDate() === day.getDate() &&
        event.date.getMonth() === day.getMonth() &&
        event.date.getFullYear() === day.getFullYear() &&
        event.completed
    );

    if (isCompletedDay) {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 font-medium";
    }

    if (isEventDay) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 font-medium";
    }

    return "";
  };

  return (
    <div className="animate-fadeInUp">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Card className="bg-glass shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                Learning Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiersClassNames={{
                  selected: "bg-primary text-primary-foreground",
                }}
                components={{
                  Day: ({ date, ...props }) => (
                    <button
                      {...props}
                      className={`${props.className} ${getDayClassNames(date)}`}
                    />
                  ),
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="bg-glass shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate
                  ? `Topics for ${formatDate(selectedDate)}`
                  : "Select a date to view topics"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEvents.length > 0 ? (
                <div className="space-y-4">
                  {selectedEvents.map((event, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border bg-background/50 flex justify-between items-center transition-all duration-300 hover:shadow-md"
                    >
                      <div className="flex items-center">
                        {event.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        ) : (
                          <Clock className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                        )}
                        <div>
                          <h3 className="font-medium">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {event.completed
                              ? "Completed"
                              : "Pending completion"}
                          </p>
                        </div>
                      </div>
                      {!event.completed && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkCompleted(event.title)}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">
                    No topics scheduled for this day
                  </h3>
                  <p className="text-muted-foreground">
                    Select another date or create a new learning roadmap
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
