
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSameDay, isToday, isBefore, parseISO } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FullScreenCalendar } from "../ui/fullscreen-calendar";
import { distributeTopicsToCalendar, formatCalendarData } from "./utils";
import TopicDialog from "./TopicDialog";
import CalendarStats from "./CalendarStats";
import { Topic, CalendarViewProps, CalendarEvent } from "./types";

const CalendarView = ({ selectedRoadmapId, topics }: CalendarViewProps) => {
  const [date, setDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
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
    const fetchAllEvents = async () => {
      const allEvents: CalendarEvent[] = [];
      
      // Add roadmap topics
      if (selectedRoadmapId && topics[selectedRoadmapId]) {
        const roadmapTopics = topics[selectedRoadmapId];
        allEvents.push(...distributeTopicsToCalendar(roadmapTopics));
      } else {
        Object.values(topics).forEach(roadmapTopics => {
          allEvents.push(...distributeTopicsToCalendar(roadmapTopics));
        });
      }
      
      setCalendarEvents(allEvents);
    };
    
    fetchAllEvents();
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

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setDialogOpen(true);
  };

  return (
    <div className="grid grid-cols-1 gap-6 animate-fadeInUp">
      {streak > 0 || completionRate > 0 ? (
        <CalendarStats streak={streak} completionRate={completionRate} />
      ) : null}
      
      <Card className="bg-glass shadow col-span-1">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">Learning Calendar</CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <FullScreenCalendar 
            data={formatCalendarData(calendarEvents)} 
            onDayClick={handleDayClick}
          />
        </CardContent>
      </Card>

      <TopicDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedDate={selectedDate}
        selectedDateEvents={selectedDateEvents}
        editMode={editMode}
        setEditMode={setEditMode}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
        editTopicId={editTopicId}
        setEditTopicId={setEditTopicId}
        rescheduleMode={rescheduleMode}
        setRescheduleMode={setRescheduleMode}
        rescheduleDate={rescheduleDate}
        setRescheduleDate={setRescheduleDate}
        isUpdating={isUpdating}
        handleToggleComplete={handleToggleComplete}
        handleSaveEdit={handleSaveEdit}
        handleReschedule={handleReschedule}
        expandedDescriptions={expandedDescriptions}
        toggleDescription={toggleDescription}
      />
    </div>
  );
};

export default CalendarView;
