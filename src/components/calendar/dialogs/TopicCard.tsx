
import React from "react";
import { Edit, ArrowRight, Book, ChevronUp, ChevronDown, FileText, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendarEvent } from "../types";
import { getStatusColor } from "../utils";

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
  onFlashcards
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="w-full text-xs"
          >
            <Edit className="mr-1 h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onReschedule}
            className="w-full text-xs"
          >
            <ArrowRight className="mr-1 h-3 w-3" />
            Reschedule
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onResources}
            className="w-full text-xs"
          >
            <FileText className="mr-1 h-3 w-3" />
            Resources
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onQuiz}
            className="w-full text-xs"
          >
            <Book className="mr-1 h-3 w-3" />
            AI Quiz
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onFlashcards}
            className="w-full text-xs col-span-1 sm:col-span-1"
          >
            <Brain className="mr-1 h-3 w-3" />
            Flashcards
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TopicCard;
