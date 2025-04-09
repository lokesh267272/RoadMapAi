
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Video, BookOpen, Wrench, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Resource } from "../types";

interface ResourcesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicTitle: string;
  resources: Resource[] | null | undefined;
}

const ResourcesDialog: React.FC<ResourcesDialogProps> = ({
  open,
  onOpenChange,
  topicTitle,
  resources
}) => {
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'doc':
        return <FileText className="h-4 w-4 mr-2 text-blue-500" />;
      case 'video':
        return <Video className="h-4 w-4 mr-2 text-red-500" />;
      case 'blog':
        return <BookOpen className="h-4 w-4 mr-2 text-green-500" />;
      case 'tool':
        return <Wrench className="h-4 w-4 mr-2 text-purple-500" />;
      default:
        return <ExternalLink className="h-4 w-4 mr-2 text-gray-500" />;
    }
  };

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case 'doc':
        return 'Documentation';
      case 'video':
        return 'Video';
      case 'blog':
        return 'Blog';
      case 'tool':
        return 'Tool';
      default:
        return 'Link';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Learning Resources</DialogTitle>
          <DialogDescription>
            Resources for: {topicTitle}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          {!resources || resources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No resources available for this topic
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {resources.map((resource, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      {getResourceIcon(resource.type)}
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted">
                        {getResourceTypeLabel(resource.type)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(resource.url, '_blank')}
                      className="h-8"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      Open
                    </Button>
                  </div>
                  <h3 className="font-medium mt-2">{resource.title}</h3>
                  <p className="text-xs mt-1 text-muted-foreground break-all">{resource.url}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ResourcesDialog;
