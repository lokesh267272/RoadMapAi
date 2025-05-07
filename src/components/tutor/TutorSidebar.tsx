
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RoadmapNode } from "@/components/flowchart/FlowchartTypes";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface TutorSidebarProps {
  roadmapId: string;
  roadmapTitle: string;
  nodes: RoadmapNode[];
  currentTopicId: string;
}

const TutorSidebar = ({ roadmapId, roadmapTitle, nodes, currentTopicId }: TutorSidebarProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleTopicClick = (nodeId: string, label: string) => {
    navigate(`/ai-tutor/${roadmapId}?topicId=${nodeId}&title=${encodeURIComponent(label)}`);
  };

  // Filter out nodes that match "Week X" pattern or match the roadmap title
  const topicNodes = nodes
    .filter(node => {
      // Filter out start and end nodes
      if (node.type === "start" || node.type === "end") return false;
      
      // Filter out nodes with labels like "Week X" (e.g., "Week 1", "Week 2")
      const nodeLabel = node.data?.label || "";
      if (/^Week \d+$/i.test(nodeLabel)) return false;
      
      // Filter out nodes that match the roadmap title
      if (nodeLabel === roadmapTitle) return false;
      
      return true;
    })
    .sort((a, b) => {
      // Access day property safely with type assertion
      const dayA = ((a.data as any)?.day !== undefined) ? Number((a.data as any).day) : 0;
      const dayB = ((b.data as any)?.day !== undefined) ? Number((b.data as any).day) : 0;
      return dayA - dayB;
    });

  return (
    <Card className="h-full shadow-md">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b">
        <GraduationCap className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-semibold tracking-tight truncate" title={roadmapTitle}>
          {roadmapTitle}
        </h3>
      </div>
      
      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="p-3 space-y-1">
          {topicNodes.map((node) => (
            <Button
              key={node.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left pl-3 transition-all duration-200",
                currentTopicId === node.id 
                  ? "bg-primary/10 font-medium text-primary" 
                  : "hover:bg-muted"
              )}
              onClick={() => handleTopicClick(node.id, node.data?.label || "")}
            >
              <ChevronRight className={cn(
                "w-4 h-4 mr-2 shrink-0 transition-transform",
                currentTopicId === node.id && "text-primary"
              )} />
              <span className="truncate">{node.data?.label || "Unnamed Topic"}</span>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default TutorSidebar;
