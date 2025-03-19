
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
  Sun,
  Cloud,
  CloudRain,
  Flower,
  Heart,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameDay, addDays, isToday, isAfter, isBefore, parseISO, startOfMonth, endOfMonth, getDay, getMonth, getYear, getDate, differenceInDays } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose
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
  description?: string | null;
}

interface CalendarViewProps {
  selectedRoadmapId: string | null;
  topics: Record<string, Topic[]>;
}

// Determine background color based on day properties
const getDayBackgroundColor = (date: Date) => {
  // Check if weekend (beach day style)
  const dayOfWeek = getDay(date);
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return "bg-blue-50 dark:bg-blue-900/20"; // Light blue for weekends
  }
  
  // Special days - example patterns
  const day = getDate(date);
  const month = getMonth(date);
  
  // Holidays or special dates (mint green)
  if (
    (day === 1 && month === 4) || // May 1
    (day === 5 && month === 4) || // Cinco de Mayo
    (day === 12 && month === 4) || // Eid
    (day === 31 && month === 4) || // Memorial Day
    (day === 25 && month === 11) // Christmas
  ) {
    return "bg-green-50 dark:bg-green-900/20";
  }
  
  // Tax or deadline days (light pink)
  if (
    (day === 17 && month === 3) || // Tax day (April in US)
    (day === 15 && month === 3) // Tax deadline
  ) {
    return "bg-pink-50 dark:bg-pink-900/20";
  }
  
  // Default white/transparent
  return "bg-white dark:bg-gray-800";
};

// Get a weather icon based on the date (just for visual variety)
const getWeatherIcon = (date: Date) => {
  const day = getDate(date);
  
  // Just for visual variety, assign different weather icons based on date
  if (day % 5 === 0) return <CloudRain className="h-4 w-4 text-gray-400" />;
  if (day % 4 === 0) return <Cloud className="h-4 w-4 text-gray-400" />;
  if (day % 3 === 0) return null; // No weather some days
  return <Sun className="h-4 w-4 text-amber-400" />;
};

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
    category?: 'work' | 'life';
  }[] = [];

  // Sort topics by day number
  const sortedTopics = [...topics].sort((a, b) => a.day_number - b.day_number);
  const today = new Date();
  
  // Get the first day of current month
  const firstDayOfMonth = startOfMonth(new Date());

  sortedTopics.forEach((topic, index) => {
    // Calculate date based on day number relative to first day of month
    const topicDate = new Date(firstDayOfMonth);
    // Subtract 1 from day_number because day_number starts from 1, but we want to add 0 days for day 1
    topicDate.setDate(topicDate.getDate() + (topic.day_number - 1));
    
    // Determine status
    let status: 'completed' | 'pending' | 'missed';
    if (topic.completed) {
      status = 'completed';
    } else if (isBefore(topicDate, today) && !isSameDay(topicDate, today)) {
      status = 'missed';
    } else {
      status = 'pending';
    }
    
    // Alternate between work and life for visual variety
    const category = index % 2 === 0 ? 'work' : 'life';
    
    calendarEvents.push({
      date: topicDate,
      title: topic.title,
      completed: topic.completed,
      id: topic.id,
      roadmap_id: topic.roadmap_id,
      description: topic.description,
      status,
      day_number: topic.day_number,
      category
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
    category?: 'work' | 'life';
  }[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTopicId, setEditTopicId] = useState("");
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
  const [streak, setStreak] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);

  // Calculate completion metrics and streak
  useEffect(() => {
    const allEvents = [...calendarEvents];
    const today = new Date();
    
    // Calculate completion rate
    if (allEvents.length > 0) {
      const completedCount = allEvents.filter(event => event.completed).length;
      setCompletionRate(Math.round((completedCount / allEvents.length) * 100));
    } else {
      setCompletionRate(0); // Set to 0 if no events
    }
    
    // Calculate streak
    let currentStreak = 0;
    const sortedDates = [...allEvents]
      .filter(event => isBefore(event.date, today) || isSameDay(event.date, today))
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort in reverse chronological order
    
    for (const event of sortedDates) {
      if (event.completed) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    setStreak(currentStreak);
    setIsLoading(false);
  }, [calendarEvents]);

  useEffect(() => {
    setIsLoading(true);
    const allEvents: {
      date: Date;
      title: string;
      completed: boolean;
      id: string;
      roadmap_id: string;
      description?: string | null;
      status: 'completed' | 'pending' | 'missed';
      day_number: number;
      category?: 'work' | 'life';
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
    
    // Calculate the new day number
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const timeDiff = rescheduleDate.getTime() - startDate.getTime();
    const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    const newDayNumber = dayDiff + 1; // Day numbers start from 1
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('learning_topics')
        .update({ day_number: newDayNumber })
        .eq('id', topicId);
      
      if (error) throw error;
      
      // Update local state
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

  // Render the day cell in the calendar grid
  const renderDay = (day: CalendarDayInfo) => {
    // Get events for this day
    const dayEvents = calendarEvents.filter(event => 
      isSameDay(event.date, day.date)
    );
    
    const hasEvents = dayEvents.length > 0;
    const bgColor = getDayBackgroundColor(day.date);
    const weatherIcon = getWeatherIcon(day.date);
    
    // Different height for mobile and desktop
    const cellHeightClass = "min-h-[110px] md:min-h-[130px]";
    
    return (
      <div 
        className={cn(
          "relative w-full h-full p-2 border border-gray-200 dark:border-gray-700 transition-all flex flex-col",
          cellHeightClass,
          !day.isCurrentMonth && "opacity-50",
          day.isToday && "ring-2 ring-primary ring-inset",
          bgColor,
          hasEvents && "cursor-pointer hover:bg-primary/5"
        )}
        onClick={() => hasEvents && handleDateSelect(day.date)}
      >
        {/* Day header with number and weather icon */}
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            "flex items-center justify-center text-base font-medium",
            day.isToday && "text-primary font-bold"
          )}>
            {day.day}
          </span>
          {weatherIcon}
        </div>
        
        {/* Event section */}
        <div className="flex flex-col space-y-1.5 overflow-hidden">
          {hasEvents && (
            <>
              {/* Category tags */}
              <div className="flex flex-wrap gap-1">
                {dayEvents.some(e => e.category === 'work') && (
                  <span className="inline-flex items-center text-[10px] font-medium">
                    <Briefcase className="h-3 w-3 mr-0.5 text-amber-500" /> Work
                  </span>
                )}
                {dayEvents.some(e => e.category === 'life') && (
                  <span className="inline-flex items-center text-[10px] font-medium ml-1">
                    <Heart className="h-3 w-3 mr-0.5 text-pink-500" /> Life
                  </span>
                )}
              </div>
              
              {/* Event content */}
              {dayEvents.map((event, idx) => (
                <div key={event.id} className="text-xs line-clamp-2 pl-2 text-gray-700 dark:text-gray-300">
                  • {event.title}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 animate-fadeInUp">
      <Card className="bg-glass shadow col-span-1">
        <CardHeader className="border-b pb-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2">
          <div className="flex items-center">
            <Flower className="h-5 w-5 text-pink-500 mr-2" />
            <CardTitle className="text-xl flex items-center">
              {format(currentMonth, "MMMM yyyy")}
              <Flower className="h-5 w-5 text-amber-500 ml-2" />
            </CardTitle>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-10">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4">
                <div className="flex items-center p-3 bg-primary/5 rounded-lg border">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-muted-foreground">Current Streak</div>
                    <div className="flex items-center">
                      <CheckCheck className="h-4 w-4 mr-1 text-primary" />
                      <span className="text-2xl font-bold">{streak} days</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-primary/5 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Completion Rate</span>
                      <span className="text-sm font-medium">{completionRate}%</span>
                    </div>
                    <Progress value={completionRate} className="h-2 mt-2" />
                  </div>
                </div>
              </div>
              
              {/* Day name headers - Full names on desktop, abbreviated on mobile */}
              <div className="grid grid-cols-7 text-center">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                  <div key={day} className="p-2 font-medium border-b border-r border-gray-200 dark:border-gray-700 bg-primary/5">
                    <span className="hidden md:inline">{day}</span>
                    <span className="md:hidden">{day.substring(0, 3)}</span>
                  </div>
                ))}
              </div>
              
              {/* Calendar grid with consistent cell sizing */}
              <div className="grid grid-cols-7 auto-rows-fr">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  className="w-full border-none rounded-none pointer-events-auto"
                  components={{
                    Day: renderDay
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
            <DialogDescription>
              View and manage your learning topics for this day.
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
                    className="pointer-events-auto"
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
                  "border rounded-lg p-4 transition-colors",
                  getStatusColor(event.status)
                )}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium text-base">{event.title}</h3>
                      {event.description && (
                        <p className="text-sm">{event.description}</p>
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
                  
                  <div className="flex items-center justify-end space-x-2 mt-4">
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
