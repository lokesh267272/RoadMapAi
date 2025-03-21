
import { useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Eye, Pencil, Trash2 } from "lucide-react";

interface RoadmapCardProps {
  roadmap: Tables<"learning_roadmaps">;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const RoadmapCard = ({ roadmap, onClick, onEdit, onDelete }: RoadmapCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };

  return (
    <Card 
      className={`overflow-hidden transition-all duration-200 border hover:shadow-md cursor-pointer h-full flex flex-col ${isHovered ? 'border-primary/50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <CardContent className="p-6 flex-grow">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-xl line-clamp-2 mr-2">{roadmap.title}</h3>
          </div>
          
          {roadmap.description && (
            <p className="text-muted-foreground text-sm line-clamp-3">
              {roadmap.description}
            </p>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="px-6 py-4 bg-muted/30 flex justify-between items-center">
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 mr-1.5" />
          <span>{formatDate(roadmap.created_at)}</span>
        </div>
        
        <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
