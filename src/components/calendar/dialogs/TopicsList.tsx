
import React from "react";
import TopicCard from "./TopicCard";
import { CalendarEvent } from "../types";

interface TopicsListProps {
  events: CalendarEvent[];
  expandedDescriptions: Record<string, boolean>;
  isUpdating: boolean;
  onToggleDescription: (id: string) => void;
  onToggleComplete: (topicId: string, currentStatus: boolean) => Promise<void>;
  onEditClick: (topic: CalendarEvent) => void;
  onRescheduleClick: (topic: CalendarEvent) => void;
  onQuizClick: (topic: CalendarEvent) => void;
  onResourcesClick: (topic: CalendarEvent) => void;
  onFlashcardsClick: (topic: CalendarEvent) => void;
  onTutorClick: (topic: CalendarEvent) => void;
}

const TopicsList: React.FC<TopicsListProps> = ({
  events,
  expandedDescriptions,
  isUpdating,
  onToggleDescription,
  onToggleComplete,
  onEditClick,
  onRescheduleClick,
  onQuizClick,
  onResourcesClick,
  onFlashcardsClick,
  onTutorClick
}) => {
  if (events.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        No topics scheduled for this date. Click on the plus button to add a topic.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <TopicCard
          key={event.id}
          event={event}
          isExpanded={!!expandedDescriptions[event.id]}
          isUpdating={isUpdating}
          onToggleDescription={() => onToggleDescription(event.id)}
          onToggleComplete={() => onToggleComplete(event.id, event.completed)}
          onEdit={() => onEditClick(event)}
          onReschedule={() => onRescheduleClick(event)}
          onQuiz={() => onQuizClick(event)}
          onResources={() => onResourcesClick(event)}
          onFlashcards={() => onFlashcardsClick(event)}
          onTutor={() => onTutorClick(event)}
        />
      ))}
    </div>
  );
};

export default TopicsList;
