
import { useState } from "react";
import { useCalendarEvents } from "./hooks/useCalendarEvents";
import { useTopicEdit } from "./hooks/useTopicEdit";
import { useTopicReschedule } from "./hooks/useTopicReschedule";
import TopicDialog from "./TopicDialog";
import CalendarStats from "./CalendarStats";
import CalendarContainer from "./CalendarContainer";
import { CalendarViewProps } from "./types";

const CalendarView = ({ selectedRoadmapId, topics }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);

  // Use our custom hooks
  const {
    calendarEvents,
    setCalendarEvents,
    isUpdating: calendarIsUpdating,
    setIsUpdating: setCalendarIsUpdating,
    streak,
    completionRate,
    expandedDescriptions,
    toggleDescription,
    handleToggleComplete
  } = useCalendarEvents(selectedRoadmapId, topics);

  const {
    editMode,
    setEditMode,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editTopicId,
    setEditTopicId,
    isUpdating: editIsUpdating,
    handleSaveEdit
  } = useTopicEdit(setCalendarEvents);

  const {
    rescheduleMode,
    setRescheduleMode,
    rescheduleDate,
    setRescheduleDate,
    isUpdating: rescheduleIsUpdating,
    handleReschedule
  } = useTopicReschedule(setCalendarEvents);

  // Combine updating states from different hooks
  const isUpdating = calendarIsUpdating || editIsUpdating || rescheduleIsUpdating;

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setDialogOpen(true);
  };

  const selectedDateEvents = selectedDate 
    ? calendarEvents.filter(event => 
        isSameDay(event.date, selectedDate)
      )
    : [];

  return (
    <div className="grid grid-cols-1 gap-6 animate-fadeInUp">
      {streak > 0 || completionRate > 0 ? (
        <CalendarStats streak={streak} completionRate={completionRate} />
      ) : null}
      
      <CalendarContainer 
        calendarEvents={calendarEvents}
        onDayClick={handleDayClick}
      />

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

// Import missing function
import { isSameDay } from "date-fns";
