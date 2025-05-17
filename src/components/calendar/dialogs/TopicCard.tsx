
import React from "react";
import { Edit, ArrowRight, Book, ChevronUp, ChevronDown, FileText, Brain, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendarEvent } from "../types";
import { getStatusColor } from "../utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TopicCardProps {
  event: CalendarEvent;
  isExpanded: boolean;
  isUpdating: boolean;
  onToggleDescription: () => void;
  onToggleComplete: () => Promise<void>;
  onEdit: () => void;
  onReschedule: () => void;
  onQuiz: () => void;
  onResources: () => void;
  onFlashcards: () => void;
  onTutor: () => void;
  loadingAction: string | null;
}

const TopicCard: React.FC<TopicCardProps> = ({
  event,
  isExpanded,
  isUpdating,
  onToggleDescription,
  onToggleComplete,
  onEdit,
  onReschedule,
  onQuiz,
  onResources,
  onFlashcards,
  onTutor,
  loadingAction
}) => {
  const hasResources = event.resources && event.resources.length > 0;
  
  return (
    <div key={event.id} className={cn(
      "border rounded-lg overflow-hidden transition-colors",
      getStatusColor(event.status)
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-medium text-base">{event.title}</h3>
            {event.description && !isExpanded && (
              <p className="text-sm line-clamp-2">{event.description}</p>
            )}
            {hasResources && (
              <Badge variant="outline" className="mt-1 text-xs">
                {event.resources?.length} resources available
              </Badge>
            )}
          </div>
          
          <Checkbox
            checked={event.completed}
            onCheckedChange={() => onToggleComplete()}
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
            open={isExpanded}
            onOpenChange={onToggleDescription}
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
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 mr-1" />
                )}
                {isExpanded ? "Show Less" : "Read More"}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        )}
      </div>
      
      <div className="bg-background/10 border-t p-3">
        <div className="grid grid-cols-3 gap-2">
          <TooltipProvider>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="w-full text-xs"
              disabled={loadingAction !== null}
            >
              <Edit className="mr-1 h-3 w-3" />
              Edit
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReschedule}
                  className="w-full text-xs"
                  disabled={loadingAction !== null}
                >
                  <ArrowRight className="mr-1 h-3 w-3" />
                  Reschedule
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reschedule this topic to another day</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResources}
                  className="w-full text-xs"
                  disabled={loadingAction !== null}
                >
                  <FileText className="mr-1 h-3 w-3" />
                  Resources
                </Button>
              </TooltipTrigger>
              <TooltipContent>View learning resources for this topic</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onQuiz}
                  className="w-full text-xs"
                  disabled={loadingAction === "quiz" || loadingAction !== null}
                >
                  {loadingAction === "quiz" ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Book className="mr-1 h-3 w-3" />
                      AI Quiz
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate an AI quiz to test your knowledge</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onFlashcards}
                  className="w-full text-xs"
                  disabled={loadingAction === "flashcards" || loadingAction !== null}
                >
                  {loadingAction === "flashcards" ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-1 h-3 w-3" />
                      Flashcards
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create and study flashcards for this topic</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onTutor}
                  className="w-full text-xs"
                  disabled={loadingAction === "tutor" || loadingAction !== null}
                >
                  {loadingAction === "tutor" ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <BookOpen className="mr-1 h-3 w-3" />
                      AI Tutor
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Get personalized tutoring on this topic</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default TopicCard;
