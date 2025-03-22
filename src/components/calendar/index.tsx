
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSameDay } from "date-fns";
import { FullScreenCalendar } from "../ui/fullscreen-calendar";
import { distributeTopicsToCalendar, formatCalendarData } from "./utils";
import TopicDialog from "./TopicDialog";
import CalendarStats from "./CalendarStats";
import { CalendarEvent, CalendarViewProps } from "./types";
import useCalendarStats from "./useCalendarStats";
import useTopicDialog from "./useTopicDialog";
import TopicManager from "./TopicManager";

const CalendarView = ({ selectedRoadmapId, topics }: CalendarViewProps) => {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  
  // Use our custom hooks
  const { streak, completionRate } = useCalendarStats(calendarEvents);
  const dialogState = useTopicDialog();
  const { 
    dialogOpen, setDialogOpen, selectedDate, 
    editMode, setEditMode, editTitle, setEditTitle,
    editDescription, setEditDescription, editTopicId, setEditTopicId,
    rescheduleMode, setRescheduleMode, rescheduleDate, setRescheduleDate,
    expandedDescriptions, toggleDescription, handleDayClick, getSelectedDateEvents
  } = dialogState;
  
  // Get topic management functions
  const topicManager = TopicManager({ calendarEvents, setCalendarEvents });
  const { isUpdating, handleToggleComplete, handleSaveEdit, handleReschedule } = topicManager;

  // Get events for the selected date
  const selectedDateEvents = getSelectedDateEvents(calendarEvents);

  useEffect(() => {
    const allEvents: CalendarEvent[] = [];
    
    // Distribute topics to calendar events based on selected roadmap or all roadmaps
    if (selectedRoadmapId && topics[selectedRoadmapId]) {
      const roadmapTopics = topics[selectedRoadmapId];
      console.log(`Processing ${roadmapTopics.length} topics for roadmap ${selectedRoadmapId}`);
      
      // Verify topic data before processing
      if (roadmapTopics.length > 0) {
        console.log("First topic sample:", roadmapTopics[0]);
        if (!roadmapTopics[0].created_at) {
          console.warn("Warning: Topics missing created_at data");
        }
      }
      
      allEvents.push(...distributeTopicsToCalendar(roadmapTopics));
    } else {
      // Process all roadmaps if none selected
      Object.values(topics).forEach(roadmapTopics => {
        allEvents.push(...distributeTopicsToCalendar(roadmapTopics));
      });
    }
    
    console.log(`Generated ${allEvents.length} calendar events`);
    setCalendarEvents(allEvents);
  }, [selectedRoadmapId, topics]);

  // Wrap the handleSaveEdit function to reset state on success
  const wrappedHandleSaveEdit = async () => {
    const success = await handleSaveEdit(editTopicId, editTitle, editDescription);
    if (success) {
      setEditMode(false);
    }
  };

  // Wrap the handleReschedule function to reset state on success
  const wrappedHandleReschedule = async (topicId: string, dayNumber: number) => {
    if (!rescheduleDate) return;
    
    const success = await handleReschedule(topicId, dayNumber, rescheduleDate);
    if (success) {
      setRescheduleMode(false);
      setRescheduleDate(undefined);
    }
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
        handleSaveEdit={wrappedHandleSaveEdit}
        handleReschedule={wrappedHandleReschedule}
        expandedDescriptions={expandedDescriptions}
        toggleDescription={toggleDescription}
      />
    </div>
  );
};

export default CalendarView;
