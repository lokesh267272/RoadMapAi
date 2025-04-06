
import { useState } from "react";
import { CalendarEvent } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTopicEdit = (
  setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>
) => {
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTopicId, setEditTopicId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

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

  return {
    editMode,
    setEditMode,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editTopicId,
    setEditTopicId,
    isUpdating,
    setIsUpdating,
    handleSaveEdit
  };
};
