
import React from "react";
import { Node, Resource } from "./types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, Calendar, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NodeDetailsPanelProps {
  node: Node;
  onClose: () => void;
  onComplete?: (completed: boolean) => void;
  onAddToCalendar?: () => void;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  node,
  onClose,
  onComplete,
  onAddToCalendar
}) => {
  return (
    <Card className="mt-4 animate-fadeInUp">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            {node.day && (
              <Badge variant="outline" className="mb-2">
                Day {node.day}
              </Badge>
            )}
            <CardTitle>{node.topic}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">{node.content}</p>
            </div>
            
            {node.resources && node.resources.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Resources</h4>
                <div className="space-y-2">
                  {node.resources.map((resource, index) => (
                    <ResourceItem key={index} resource={resource} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="complete"
            checked={node.completed}
            onCheckedChange={(checked) => onComplete && onComplete(checked as boolean)}
          />
          <label
            htmlFor="complete"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Mark as complete
          </label>
        </div>
        
        {onAddToCalendar && (
          <Button variant="outline" size="sm" onClick={onAddToCalendar}>
            <Calendar className="h-4 w-4 mr-2" />
            Add to Calendar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

const ResourceItem: React.FC<{ resource: Resource }> = ({ resource }) => {
  return (
    <a 
      href={resource.url} 
      target="_blank" 
      rel="noreferrer"
      className="flex items-start p-2 rounded-md bg-secondary/50 hover:bg-secondary transition-colors"
    >
      <div className="flex-1">
        <div className="font-medium text-sm">{resource.title}</div>
        <div className="text-xs text-muted-foreground">{resource.type}</div>
      </div>
      <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
    </a>
  );
};
