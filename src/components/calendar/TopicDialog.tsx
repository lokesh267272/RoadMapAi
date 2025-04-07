
import React, { useState } from "react";
import { format, isBefore, isToday } from "date-fns"; // Added the missing imports
import { CalendarIcon, Edit, ArrowRight, ChevronDown, ChevronUp, Loader2, Book } from "lucide-react";
import { CalendarEvent } from "./types";
import { getStatusColor } from "./utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

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

  return (
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
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Topic Title</label>
              <Input 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter topic title"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={editDescription} 
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add details about this topic"
                rows={4}
              />
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditMode(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Changes"}
              </Button>
            </DialogFooter>
          </div>
        ) : rescheduleMode ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select New Date</label>
              <div className="border rounded-md p-3">
                <Calendar
                  mode="single"
                  selected={rescheduleDate}
                  onSelect={setRescheduleDate}
                  disabled={(date) => isBefore(date, new Date()) && !isToday(date)}
                  initialFocus
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRescheduleMode(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const topic = selectedDateEvents.find(e => e.id === editTopicId);
                  if (topic) {
                    handleReschedule(topic.id, topic.day_number);
                  }
                }}
                disabled={isUpdating || !rescheduleDate}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : "Reschedule Topic"}
              </Button>
            </DialogFooter>
          </div>
        ) : selectedDateEvents.length > 0 ? (
          <div className="space-y-4 py-4">
            {selectedDateEvents.map((event) => (
              <div key={event.id} className={cn(
                "border rounded-lg overflow-hidden transition-colors",
                getStatusColor(event.status)
              )}>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium text-base">{event.title}</h3>
                      {event.description && !expandedDescriptions[event.id] && (
                        <p className="text-sm line-clamp-2">{event.description}</p>
                      )}
                    </div>
                    
                    <Checkbox
                      checked={event.completed}
                      onCheckedChange={() => handleToggleComplete(event.id, event.completed)}
                      className={cn(
                        "h-5 w-5",
                        event.completed && "text-green-500 border-green-500",
                        !event.completed && "text-amber-500 border-amber-500"
                      )}
                      disabled={isUpdating}
                    />
                  </div>
                  
                  {event.description && event.description.length > 100 && (
                    <Collapsible 
                      open={expandedDescriptions[event.id]} 
                      onOpenChange={() => toggleDescription(event.id)}
                      className="mt-2"
                    >
                      <CollapsibleContent className="text-sm mt-2">
                        {event.description}
                      </CollapsibleContent>
                      
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-1 h-auto p-0 text-xs font-medium"
                        >
                          {expandedDescriptions[event.id] ? (
                            <ChevronUp className="h-3 w-3 mr-1" />
                          ) : (
                            <ChevronDown className="h-3 w-3 mr-1" />
                          )}
                          {expandedDescriptions[event.id] ? "Show Less" : "Read More"}
                        </Button>
                      </CollapsibleTrigger>
                    </Collapsible>
                  )}
                </div>
                
                <div className="flex items-center justify-end space-x-2 px-4 py-3 bg-background/10 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(event)}
                    className="text-xs"
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRescheduleClick(event)}
                    className="text-xs"
                  >
                    <ArrowRight className="mr-1 h-3 w-3" />
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuizClick(event)}
                    className="text-xs"
                  >
                    <Book className="mr-1 h-3 w-3" />
                    AI Quiz
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            No learning topics scheduled for this date
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TopicDialog;
