
import { useState, useEffect } from "react";
import { CalendarEvent, Topic } from "../types";
import { distributeTopicsToCalendar } from "../utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useCalendarEvents = (
  selectedRoadmapId: string | null,
  topics: Record<string, Topic[]>
) => {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [streak, setStreak] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  // Process topics into calendar events
  useEffect(() => {
    const allEvents: CalendarEvent[] = [];
    
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

  // Calculate streak and completion rate
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

  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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

  return {
    calendarEvents,
    setCalendarEvents,
    isUpdating,
    setIsUpdating,
    streak,
    completionRate,
    expandedDescriptions,
    toggleDescription,
    handleToggleComplete
  };
};

// Import missing function
import { isBefore, isSameDay } from "date-fns";
