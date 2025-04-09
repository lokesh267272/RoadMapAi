
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { CalendarEvent, Flashcard } from "./types";
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
import FlashcardsDialog from "./dialogs/FlashcardsDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [flashcardsOpen, setFlashcardsOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<CalendarEvent | null>(null);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<Flashcard[]>([]);
  const [savedFlashcards, setSavedFlashcards] = useState<Flashcard[]>([]);

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

  const handleFlashcardsClick = async (topic: CalendarEvent) => {
    if (!user) {
      toast.error("You must be logged in to use flashcards");
      return;
    }
    
    setSelectedTopic(topic);
    setFlashcardsOpen(true);
    
    // Fetch existing flashcards for this topic
    await fetchSavedFlashcards(topic.id);
  };

  const fetchSavedFlashcards = async (topicId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('topic_id', topicId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setSavedFlashcards(data || []);
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      toast.error("Failed to load flashcards");
    }
  };

  const generateFlashcards = async () => {
    if (!selectedTopic || !user) return;
    
    setIsGeneratingFlashcards(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: {
          topic: selectedTopic.title,
          content: selectedTopic.description || "",
          userId: user.id
        }
      });
      
      if (error) throw error;
      
      if (data && data.flashcards && Array.isArray(data.flashcards)) {
        const mappedFlashcards: Flashcard[] = data.flashcards.map(card => ({
          ...card,
          topic_id: selectedTopic.id
        }));
        
        setGeneratedFlashcards(mappedFlashcards);
      } else {
        throw new Error("Invalid response format from flashcards generator");
      }
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast.error("Failed to generate flashcards");
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const saveFlashcards = async () => {
    if (!selectedTopic || !user || generatedFlashcards.length === 0) return;
    
    try {
      const flashcardsToInsert = generatedFlashcards.map(card => ({
        topic_id: selectedTopic.id,
        user_id: user.id,
        term: card.term,
        definition: card.definition
      }));
      
      const { data, error } = await supabase
        .from('flashcards')
        .insert(flashcardsToInsert)
        .select();
      
      if (error) throw error;
      
      toast.success("Flashcards saved successfully");
      
      // Update the saved flashcards list
      await fetchSavedFlashcards(selectedTopic.id);
      
      // Clear generated flashcards
      setGeneratedFlashcards([]);
    } catch (error) {
      console.error("Error saving flashcards:", error);
      toast.error("Failed to save flashcards");
    }
  };

  useEffect(() => {
    if (flashcardsOpen && selectedTopic && (generatedFlashcards.length === 0) && (savedFlashcards.length === 0)) {
      generateFlashcards();
    }
  }, [flashcardsOpen, selectedTopic]);

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
              onFlashcardsClick={handleFlashcardsClick}
            />
          )}
        </DialogContent>
      </Dialog>

      {selectedTopic && (
        <>
          <ResourcesDialog
            open={resourcesOpen}
            onOpenChange={setResourcesOpen}
            topicTitle={selectedTopic.title}
            resources={selectedTopic.resources}
          />
          
          <FlashcardsDialog
            open={flashcardsOpen}
            onOpenChange={setFlashcardsOpen}
            topicId={selectedTopic.id}
            topicTitle={selectedTopic.title}
            topicDescription={selectedTopic.description}
            generatedFlashcards={generatedFlashcards}
            savedFlashcards={savedFlashcards}
            onSaveFlashcards={saveFlashcards}
            isGenerating={isGeneratingFlashcards}
            isUpdating={isUpdating}
            onRegenerateFlashcards={generateFlashcards}
          />
        </>
      )}
    </>
  );
};

export default TopicDialog;
