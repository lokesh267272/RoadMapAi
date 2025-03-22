
import { useState } from "react";
import { isSameDay } from "date-fns";
import { CalendarEvent } from "./types";

const useTopicDialog = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTopicId, setEditTopicId] = useState("");
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
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

  const resetDialogState = () => {
    setEditMode(false);
    setRescheduleMode(false);
    setRescheduleDate(undefined);
    setEditTitle("");
    setEditDescription("");
    setEditTopicId("");
  };

  const getSelectedDateEvents = (calendarEvents: CalendarEvent[]) => {
    return selectedDate 
      ? calendarEvents.filter(event => 
          isSameDay(event.date, selectedDate)
        )
      : [];
  };

  return {
    dialogOpen,
    setDialogOpen,
    selectedDate,
    setSelectedDate,
    editMode,
    setEditMode,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editTopicId,
    setEditTopicId,
    rescheduleMode,
    setRescheduleMode,
    rescheduleDate,
    setRescheduleDate,
    expandedDescriptions,
    toggleDescription,
    handleDateSelect,
    handleDayClick,
    resetDialogState,
    getSelectedDateEvents
  };
};

export default useTopicDialog;
