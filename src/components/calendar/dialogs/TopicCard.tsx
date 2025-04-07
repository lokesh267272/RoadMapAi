
import React from "react";
import { Edit, ArrowRight, Book, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
}

const TopicCard: React.FC<TopicCardProps> = ({
  event,
  isExpanded,
  isUpdating,
  onToggleDescription,
  onToggleComplete,
  onEdit,
  onReschedule,
  onQuiz
}) => {
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
      
      <div className="flex items-center justify-end space-x-2 px-4 py-3 bg-background/10 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="text-xs"
        >
          <Edit className="mr-1 h-3 w-3" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onReschedule}
          className="text-xs"
        >
          <ArrowRight className="mr-1 h-3 w-3" />
          Reschedule
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onQuiz}
          className="text-xs"
        >
          <Book className="mr-1 h-3 w-3" />
          AI Quiz
        </Button>
      </div>
    </div>
  );
};

export default TopicCard;
