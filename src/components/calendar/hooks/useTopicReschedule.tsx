
import { useState } from "react";
import { CalendarEvent } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTopicReschedule = (
  setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>
) => {
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
  const [isUpdating, setIsUpdating] = useState(false);

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
      
      setCalendarEvents(prevEvents => {
        const eventToUpdate = prevEvents.find(event => event.id === topicId);
        if (!eventToUpdate) return prevEvents;
        
        const updatedEvents = prevEvents.filter(event => event.id !== topicId);
        updatedEvents.push({
          ...eventToUpdate,
          date: rescheduleDate,
          status: 'pending',
          day_number: newDayNumber
        });
        
        return updatedEvents;
      });
      
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

  return {
    rescheduleMode,
    setRescheduleMode,
    rescheduleDate,
    setRescheduleDate,
    isUpdating,
    setIsUpdating,
    handleReschedule
  };
};
