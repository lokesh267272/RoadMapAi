
import React from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent } from "./types";

export const useTopicManager = (
  calendarEvents: CalendarEvent[],
  setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>
) => {
  const [isUpdating, setIsUpdating] = React.useState(false);

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
              status: !currentStatus ? 'completed' : 
                      new Date(event.date) < new Date() ? 'missed' : 'pending'
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

  const handleSaveEdit = async (editTopicId: string, editTitle: string, editDescription: string) => {
    if (!editTitle.trim()) {
      toast.error("Title cannot be empty");
      return false;
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
      
      toast.success("Topic updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating topic:", error);
      toast.error("Failed to update topic");
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReschedule = async (topicId: string, dayNumber: number, rescheduleDate: Date) => {
    if (!rescheduleDate) {
      toast.error("Please select a new date");
      return false;
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
      
      toast.success("Topic rescheduled successfully");
      return true;
    } catch (error) {
      console.error("Error rescheduling topic:", error);
      toast.error("Failed to reschedule topic");
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isUpdating,
    handleToggleComplete,
    handleSaveEdit,
    handleReschedule
  };
};
