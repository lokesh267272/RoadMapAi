
import React from "react";
import { CalendarEvent } from "../types";
import TopicCard from "./TopicCard";

interface TopicsListProps {
  events: CalendarEvent[];
  expandedDescriptions: Record<string, boolean>;
  isUpdating: boolean;
  onToggleDescription: (id: string) => void;
  onToggleComplete: (topicId: string, currentStatus: boolean) => Promise<void>;
  onEditClick: (topic: CalendarEvent) => void;
  onRescheduleClick: (topic: CalendarEvent) => void;
  onQuizClick: (topic: CalendarEvent) => void;
}

const TopicsList: React.FC<TopicsListProps> = ({
  events,
  expandedDescriptions,
  isUpdating,
  onToggleDescription,
  onToggleComplete,
  onEditClick,
  onRescheduleClick,
  onQuizClick
}) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No learning topics scheduled for this date
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
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
        />
      ))}
    </div>
  );
};

export default TopicsList;
