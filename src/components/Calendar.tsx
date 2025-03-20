import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  CircleDashed, 
  Loader2, 
  BookOpen, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Bell,
  Edit,
  ArrowRight,
  X,
  CheckCheck,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameDay, addDays, isToday, isAfter, isBefore, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FullScreenCalendar } from "./ui/fullscreen-calendar";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDayInfo, CalendarProps } from "@/types/calendar";

interface Topic {
  id: string;
  title: string;
  completed: boolean;
  day_number: number;
  roadmap_id: string;
  description?: string | null;
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
    description?: string | null;
    status: 'completed' | 'pending' | 'missed';
    day_number: number;
  }[] = [];

  const sortedTopics = [...topics].sort((a, b) => a.day_number - b.day_number);
  const today = new Date();

  sortedTopics.forEach((topic) => {
    const topicDate = new Date(startDate);
    topicDate.setDate(startDate.getDate() + (topic.day_number - 1));
    
    let status: 'completed' | 'pending' | 'missed';
    if (topic.completed) {
      status = 'completed';
    } else if (isBefore(topicDate, today) && !isSameDay(topicDate, today)) {
      status = 'missed';
    } else {
      status = 'pending';
    }
    
    calendarEvents.push({
      date: topicDate,
      title: topic.title,
      completed: topic.completed,
      id: topic.id,
      roadmap_id: topic.roadmap_id,
      description: topic.description,
      status,
      day_number: topic.day_number
    });
  });

  return calendarEvents;
};

const CalendarView = ({ selectedRoadmapId, topics }: CalendarViewProps) => {
  const [date, setDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [calendarEvents, setCalendarEvents] = useState<{
    date: Date;
    title: string;
    completed: boolean;
    id: string;
    roadmap_id: string;
    description?: string | null;
    status: 'completed' | 'pending' | 'missed';
    day_number: number;
  }[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTopicId, setEditTopicId] = useState("");
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
  const [streak, setStreak] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    const allEvents = [...calendarEvents];
    const today = new Date();
    
    if (allEvents.length > 0) {
      const completedCount = allEvents.filter(event => event.completed).length;
      setCompletionRate(Math.round((completedCount / allEvents.length) * 100));
    }
    
    let currentStreak = 0;
    const sortedDates = [...allEvents]
      .filter(event => isBefore(event.date, today) || isSameDay(event.date, today))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    for (const event of sortedDates) {
      if (event.completed) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    setStreak(currentStreak);
  }, [calendarEvents]);

  useEffect(() => {
    const allEvents: {
      date: Date;
      title: string;
      completed: boolean;
      id: string;
      roadmap_id: string;
      description?: string | null;
      status: 'completed' | 'pending' | 'missed';
      day_number: number;
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
        events.map(event => {
          if (event.id === topicId) {
            return { 
              ...event, 
              completed: !currentStatus,
              status: !currentStatus ? 'completed' : isBefore(event.date, new Date()) ? 'missed' : 'pending'
            };
          }
          return event;
        })
      );
      
      toast.success(`Task ${!currentStatus ? 'completed' : 'marked as incomplete'}`);
    } catch (error) {
      console.error("Error updating topic status:", error);
      toast.error("Failed to update task status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('learning_topics')
        .update({ 
          title: editTitle.trim(),
          description: editDescription.trim() || null
        })
        .eq('id', editTopicId);
      
      if (error) throw error;
      
      setCalendarEvents(events => 
        events.map(event => 
          event.id === editTopicId 
            ? { ...event, title: editTitle, description: editDescription } 
            : event
        )
      );
      
      setEditMode(false);
      toast.success("Topic updated successfully");
    } catch (error) {
      console.error("Error updating topic:", error);
      toast.error("Failed to update topic");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReschedule = async (topicId: string, dayNumber: number) => {
    if (!rescheduleDate) {
      toast.error("Please select a new date");
      return;
    }
    
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const timeDiff = rescheduleDate.getTime() - startDate.getTime();
    const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    const newDayNumber = dayDiff + 1;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('learning_topics')
        .update({ day_number: newDayNumber })
        .eq('id', topicId);
      
      if (error) throw error;
      
      const eventToUpdate = calendarEvents.find(event => event.id === topicId);
      if (eventToUpdate) {
        const updatedEvents = calendarEvents.filter(event => event.id !== topicId);
        updatedEvents.push({
          ...eventToUpdate,
          date: rescheduleDate,
          status: 'pending',
          day_number: newDayNumber
        });
        setCalendarEvents(updatedEvents);
      }
      
      setRescheduleMode(false);
      setRescheduleDate(undefined);
      toast.success("Topic rescheduled successfully");
    } catch (error) {
      console.error("Error rescheduling topic:", error);
      toast.error("Failed to reschedule topic");
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

  const handleEditClick = (topic: any) => {
    setEditTopicId(topic.id);
    setEditTitle(topic.title);
    setEditDescription(topic.description || "");
    setEditMode(true);
  };

  const handleRescheduleClick = (topic: any) => {
    setEditTopicId(topic.id);
    setRescheduleMode(true);
    setRescheduleDate(undefined);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };

  const handlePrevMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };

  const getStatusColor = (status: 'completed' | 'pending' | 'missed') => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400';
      case 'pending':
        return 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400';
      case 'missed':
        return 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400';
    }
  };

  const renderDay = (day: CalendarDayInfo) => {
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
        onClick={() => hasEvents && handleDateSelect(day.date)}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            "flex items-center justify-center h-7 w-7 text-sm font-medium rounded-full",
            day.isToday && "bg-primary text-white",
            !day.isToday && "text-gray-700 dark:text-gray-300"
          )}>
            {day.day}
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

  const getCalendarData = () => {
    const data: {
      day: Date;
      events: {
        id: number;
        name: string;
        time: string;
        datetime: string;
      }[];
    }[] = [];

    const eventsByDate = new Map<string, {
      day: Date;
      events: {
        id: number;
        name: string;
        time: string;
        datetime: string;
      }[];
    }>();

    calendarEvents.forEach(event => {
      const dateStr = format(event.date, 'yyyy-MM-dd');
      if (!eventsByDate.has(dateStr)) {
        eventsByDate.set(dateStr, {
          day: event.date,
          events: []
        });
      }

      const entry = eventsByDate.get(dateStr);
      if (entry) {
        entry.events.push({
          id: parseInt(event.id.slice(0, 8), 16),
          name: event.title,
          time: event.status === 'completed' ? 'Completed' : event.status === 'pending' ? 'Pending' : 'Missed',
          datetime: format(event.date, 'yyyy-MM-dd')
        });
      }
    });

    eventsByDate.forEach(value => {
      data.push(value);
    });

    return data;
  };

  return (
    <div className="grid grid-cols-1 gap-6 animate-fadeInUp">
      <Card className="bg-glass shadow col-span-1">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">Learning Calendar</CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <FullScreenCalendar data={getCalendarData()} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
            <DialogDescription>
              View and manage your learning topics for this date.
            </DialogDescription>
          </DialogHeader>
          
          {editMode ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Topic Title</label>
                <Input 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter topic title"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  value={editDescription} 
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add details about this topic"
                  rows={4}
                />
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditMode(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : "Save Changes"}
                </Button>
              </DialogFooter>
            </div>
          ) : rescheduleMode ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select New Date</label>
                <div className="border rounded-md p-3">
                  <Calendar
                    mode="single"
                    selected={rescheduleDate}
                    onSelect={setRescheduleDate}
                    disabled={(date) => isBefore(date, new Date()) && !isToday(date)}
                    initialFocus
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setRescheduleMode(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const topic = selectedDateEvents.find(e => e.id === editTopicId);
                    if (topic) {
                      handleReschedule(topic.id, topic.day_number);
                    }
                  }}
                  disabled={isUpdating || !rescheduleDate}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : "Reschedule Topic"}
                </Button>
              </DialogFooter>
            </div>
          ) : selectedDateEvents.length > 0 ? (
            <div className="space-y-4 py-4">
              {selectedDateEvents.map((event) => (
                <div key={event.id} className={cn(
                  "border rounded-lg overflow-hidden transition-colors",
                  getStatusColor(event.status)
                )}>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium text-base">{event.title}</h3>
                        {event.description && !expandedDescriptions[event.id] && (
                          <p className="text-sm line-clamp-2">{event.description}</p>
                        )}
                      </div>
                      
                      <Checkbox
                        checked={event.completed}
                        onCheckedChange={() => handleToggleComplete(event.id, event.completed)}
                        className={cn(
                          "h-5 w-5",
                          event.completed && "text-green-500 border-green-500",
                          !event.completed && "text-amber-500 border-amber-500"
                        )}
                        disabled={isUpdating}
                      />
                    </div>
                    
                    {event.description && event.description.length > 100 && (
                      <Collapsible 
                        open={expandedDescriptions[event.id]} 
                        onOpenChange={() => toggleDescription(event.id)}
                        className="mt-2"
                      >
                        <CollapsibleContent className="text-sm mt-2">
                          {event.description}
                        </CollapsibleContent>
                        
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="mt-1 h-auto p-0 text-xs font-medium"
                          >
                            {expandedDescriptions[event.id] ? (
                              <ChevronUp className="h-3 w-3 mr-1" />
                            ) : (
                              <ChevronDown className="h-3 w-3 mr-1" />
                            )}
                            {expandedDescriptions[event.id] ? "Show Less" : "Read More"}
                          </Button>
                        </CollapsibleTrigger>
                      </Collapsible>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-end space-x-2 px-4 py-3 bg-background/10 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(event)}
                      className="text-xs"
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRescheduleClick(event)}
                      className="text-xs"
                    >
                      <ArrowRight className="mr-1 h-3 w-3" />
                      Reschedule
                    </Button>
                  </div>
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
