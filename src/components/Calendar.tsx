
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
import { CheckCircle, CircleDashed, Loader2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameDay, addDays } from "date-fns";
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
    const dayEvents = calendarEvents.filter(event => 
      isSameDay(event.date, day.date)
    );
    
    const hasEvents = dayEvents.length > 0;
    const allCompleted = hasEvents && dayEvents.every(event => event.completed);
    const topicTitle = dayEvents.length > 0 ? dayEvents[0].title : '';
    
    return (
      <div className={cn(
        "relative w-full h-full min-h-[80px] p-1 border-r border-b",
        !day.isCurrentMonth && "bg-gray-50/50 dark:bg-gray-900/20",
        day.isToday && "bg-blue-50/50 dark:bg-blue-900/20",
        day.isSelected && "bg-primary/10",
        hasEvents && "cursor-pointer hover:bg-primary/5 transition-colors"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-1">
            <span className={cn(
              "flex items-center justify-center h-6 w-6 text-sm font-medium rounded-full",
              day.isToday && "bg-primary text-white",
              !day.isToday && "text-gray-700 dark:text-gray-300"
            )}>
              {day.day}
            </span>
            {hasEvents && (
              <span>
                {allCompleted ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <BookOpen className="h-4 w-4 text-blue-500" />
                )}
              </span>
            )}
          </div>
          
          {hasEvents && (
            <div className="mt-1 text-xs font-medium line-clamp-2 text-gray-700 dark:text-gray-300">
              {topicTitle}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeInUp">
      <Card className="bg-glass shadow col-span-2">
        <CardHeader>
          <CardTitle>Learning Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 text-center border-t border-l">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 font-medium text-sm border-r border-b bg-primary/5">
                {day}
              </div>
            ))}
            
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="border rounded-none pointer-events-auto col-span-7"
              components={{
                Day: renderDay
              }}
            />
          </div>
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
                        ? "bg-green-500/10 text-green-600 border-green-200 dark:text-green-400 dark:border-green-900"
                        : "bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-900"
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
