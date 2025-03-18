
import { useState, useEffect } from "react";
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
import { CheckCircle, CircleDashed, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CalendarDayInfo {
  displayMonth: Date;
  className?: string;
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

interface Topic {
  id: string;
  title: string;
  completed: boolean;
  day_number: number;
  roadmap_id: string;
}

interface CalendarViewProps {
  selectedRoadmapId: string | null;
  topics: Record<string, Topic[]>;
}

const distributeTopicsToCalendar = (topics: Topic[], startDate = new Date()) => {
  const calendarEvents: {
    date: Date;
    title: string;
    completed: boolean;
    id: string;
    roadmap_id: string;
  }[] = [];

  const sortedTopics = [...topics].sort((a, b) => a.day_number - b.day_number);

  sortedTopics.forEach((topic) => {
    const topicDate = new Date(startDate);
    topicDate.setDate(startDate.getDate() + (topic.day_number - 1));
    
    calendarEvents.push({
      date: topicDate,
      title: topic.title,
      completed: topic.completed,
      id: topic.id,
      roadmap_id: topic.roadmap_id
    });
  });

  return calendarEvents;
};

const CalendarView = ({ selectedRoadmapId, topics }: CalendarViewProps) => {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [calendarEvents, setCalendarEvents] = useState<{
    date: Date;
    title: string;
    completed: boolean;
    id: string;
    roadmap_id: string;
  }[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const allEvents: {
      date: Date;
      title: string;
      completed: boolean;
      id: string;
      roadmap_id: string;
    }[] = [];
    
    if (selectedRoadmapId && topics[selectedRoadmapId]) {
      const roadmapTopics = topics[selectedRoadmapId];
      allEvents.push(...distributeTopicsToCalendar(roadmapTopics));
    } else {
      Object.values(topics).forEach(roadmapTopics => {
        allEvents.push(...distributeTopicsToCalendar(roadmapTopics));
      });
    }
    
    setCalendarEvents(allEvents);
  }, [selectedRoadmapId, topics]);

  const selectedDateEvents = selectedDate 
    ? calendarEvents.filter(event => 
        isSameDay(event.date, selectedDate)
      )
    : [];

  const handleToggleComplete = async (topicId: string, currentStatus: boolean) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('learning_topics')
        .update({ completed: !currentStatus })
        .eq('id', topicId);
      
      if (error) throw error;
      
      setCalendarEvents(events => 
        events.map(event => 
          event.id === topicId 
            ? { ...event, completed: !currentStatus } 
            : event
        )
      );
      
      toast.success(`Task ${!currentStatus ? 'completed' : 'marked as incomplete'}`);
    } catch (error) {
      console.error("Error updating topic status:", error);
      toast.error("Failed to update task status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setDialogOpen(true);
    }
  };

  const renderDay = (day: CalendarDayInfo) => {
    const hasEvents = calendarEvents.some(event => 
      isSameDay(event.date, day.date)
    );

    let allCompleted = false;
    if (hasEvents) {
      const dayEvents = calendarEvents.filter(event => 
        isSameDay(event.date, day.date)
      );
      allCompleted = dayEvents.every(event => event.completed);
    }

    return (
      <div className={cn(
        "relative h-9 w-9 p-0 flex items-center justify-center",
        hasEvents && "font-semibold",
        hasEvents && allCompleted && "text-green-600",
        day.className
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
            onSelect={handleDateSelect}
            className="border rounded-md pointer-events-auto"
            components={{
              Day: renderDay
            }}
          />
        </CardContent>
      </Card>

      <Card className="bg-glass">
        <CardHeader>
          <CardTitle>
            {selectedDate ? `Topics for ${format(selectedDate, "MMMM d, yyyy")}` : 'Select a date to view topics'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isUpdating && (
            <div className="flex justify-center my-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
          
          {selectedDateEvents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedDateEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${
                          event.completed
                            ? "bg-green-500/10 text-green-600 border-green-200"
                            : "bg-amber-500/10 text-amber-600 border-amber-200"
                        } flex items-center gap-1 cursor-pointer hover:bg-opacity-20 transition-colors`}
                        onClick={() => handleToggleComplete(event.id, event.completed)}
                      >
                        {event.completed ? (
                          <>
                            <CheckCircle className="h-3 w-3" /> Completed
                          </>
                        ) : (
                          <>
                            <CircleDashed className="h-3 w-3" /> Pending
                          </>
                        )}
                      </Badge>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? `Topics for ${format(selectedDate, "MMMM d, yyyy")}` : 'Learning Topics'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDateEvents.length > 0 ? (
            <div className="mt-4 space-y-4">
              {selectedDateEvents.map((event) => (
                <div key={event.id} className="border rounded-md p-3 bg-card">
                  <div className="font-medium mb-1">{event.title}</div>
                  <Badge
                    variant="outline"
                    className={`${
                      event.completed
                        ? "bg-green-500/10 text-green-600 border-green-200"
                        : "bg-amber-500/10 text-amber-600 border-amber-200"
                    } flex items-center gap-1 cursor-pointer hover:bg-opacity-20 transition-colors mt-2`}
                    onClick={() => handleToggleComplete(event.id, event.completed)}
                  >
                    {event.completed ? (
                      <>
                        <CheckCircle className="h-3 w-3" /> Completed
                      </>
                    ) : (
                      <>
                        <CircleDashed className="h-3 w-3" /> Pending
                      </>
                    )}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No learning topics scheduled for this date
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarView;
