
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CalendarDays, Share2, BarChart2 } from "lucide-react";
import { Topic } from "@/components/calendar/types";
import { formatDistanceToNow } from "date-fns";
import { Tables } from "@/integrations/supabase/types";

interface RoadmapDetailViewProps {
  roadmap: Tables<"learning_roadmaps">;
  onBack: () => void;
  onViewMindMap: () => void;
}

const RoadmapDetailView: React.FC<RoadmapDetailViewProps> = ({
  roadmap,
  onBack,
  onViewMindMap
}) => {
  const createdAt = new Date(roadmap.created_at);
  
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Back to Roadmaps
        </Button>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={onViewMindMap}
          >
            <BarChart2 className="h-4 w-4" />
            View Mind Map
          </Button>
          
          <Button variant="outline" size="sm" className="gap-1">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
      
      <Card className="bg-glass shadow">
        <CardHeader>
          <CardTitle>{roadmap.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-background/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Duration</div>
              <div className="text-lg font-medium">{roadmap.duration_days} days</div>
            </div>
            
            <div className="bg-background/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="text-lg font-medium">{formatDistanceToNow(createdAt, { addSuffix: true })}</div>
            </div>
            
            <div className="bg-background/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Progress</div>
              <div className="text-lg font-medium">0%</div>
            </div>
          </div>
          
          {roadmap.description && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{roadmap.description}</p>
            </div>
          )}
          
          <div className="flex justify-center mt-6">
            <Button onClick={onViewMindMap} className="gap-2">
              <BarChart2 className="h-4 w-4" />
              View as Mind Map
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoadmapDetailView;
