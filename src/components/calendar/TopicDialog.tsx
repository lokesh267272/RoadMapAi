
import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { CalendarEvent } from "./types";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import EditTopicForm from "./dialogs/EditTopicForm";
import RescheduleForm from "./dialogs/RescheduleForm";
import TopicsList from "./dialogs/TopicsList";
import ResourcesDialog from "./dialogs/ResourcesDialog";

interface TopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | undefined;
  selectedDateEvents: CalendarEvent[];
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  editTitle: string;
  setEditTitle: (title: string) => void;
  editDescription: string;
  setEditDescription: (description: string) => void;
  editTopicId: string;
  setEditTopicId: (id: string) => void;
  rescheduleMode: boolean;
  setRescheduleMode: (mode: boolean) => void;
  rescheduleDate: Date | undefined;
  setRescheduleDate: (date: Date | undefined) => void;
  isUpdating: boolean;
  handleToggleComplete: (topicId: string, currentStatus: boolean) => Promise<void>;
  handleSaveEdit: () => Promise<void>;
  handleReschedule: (topicId: string, dayNumber: number) => Promise<void>;
  expandedDescriptions: Record<string, boolean>;
  toggleDescription: (id: string) => void;
}

const TopicDialog: React.FC<TopicDialogProps> = ({
  open,
  onOpenChange,
  selectedDate,
  selectedDateEvents,
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
  isUpdating,
  handleToggleComplete,
  handleSaveEdit,
  handleReschedule,
  expandedDescriptions,
  toggleDescription
}) => {
  const navigate = useNavigate();
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<CalendarEvent | null>(null);

  const handleEditClick = (topic: CalendarEvent) => {
    setEditTopicId(topic.id);
    setEditTitle(topic.title);
    setEditDescription(topic.description || "");
    setEditMode(true);
  };

  const handleRescheduleClick = (topic: CalendarEvent) => {
    setEditTopicId(topic.id);
    setRescheduleMode(true);
    setRescheduleDate(undefined);
  };

  const handleQuizClick = (topic: CalendarEvent) => {
    navigate(`/quiz-generator?topic=${encodeURIComponent(topic.title)}&id=${topic.id}&roadmapId=${topic.roadmap_id}`);
  };

  const handleResourcesClick = (topic: CalendarEvent) => {
    setSelectedTopic(topic);
    setResourcesOpen(true);
  };

  const handleRescheduleSubmit = () => {
    const topic = selectedDateEvents.find(e => e.id === editTopicId);
    if (topic) {
      handleReschedule(topic.id, topic.day_number);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
            <DialogDescription>
              View and manage your learning topics for this date.
            </DialogDescription>
          </DialogHeader>
          
          {editMode ? (
            <EditTopicForm
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              editDescription={editDescription}
              setEditDescription={setEditDescription}
              isUpdating={isUpdating}
              onCancel={() => setEditMode(false)}
              onSave={handleSaveEdit}
            />
          ) : rescheduleMode ? (
            <RescheduleForm
              rescheduleDate={rescheduleDate}
              setRescheduleDate={setRescheduleDate}
              isUpdating={isUpdating}
              onCancel={() => setRescheduleMode(false)}
              onReschedule={handleRescheduleSubmit}
            />
          ) : (
            <TopicsList
              events={selectedDateEvents}
              expandedDescriptions={expandedDescriptions}
              isUpdating={isUpdating}
              onToggleDescription={toggleDescription}
              onToggleComplete={handleToggleComplete}
              onEditClick={handleEditClick}
              onRescheduleClick={handleRescheduleClick}
              onQuizClick={handleQuizClick}
              onResourcesClick={handleResourcesClick}
            />
          )}
        </DialogContent>
      </Dialog>

      {selectedTopic && (
        <ResourcesDialog
          open={resourcesOpen}
          onOpenChange={setResourcesOpen}
          topicTitle={selectedTopic.title}
          resources={selectedTopic.resources}
        />
      )}
    </>
  );
};

export default TopicDialog;
