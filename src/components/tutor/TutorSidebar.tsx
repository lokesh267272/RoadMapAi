
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RoadmapNode } from "@/components/flowchart/FlowchartTypes";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
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

  // Filter out start and end nodes, and organize nodes by week
  const topicNodes = nodes
    .filter(node => node.type !== "start" && node.type !== "end")
    .sort((a, b) => {
      // Access day property safely with type assertion
      const dayA = ((a.data as any)?.day !== undefined) ? Number((a.data as any).day) : 0;
      const dayB = ((b.data as any)?.day !== undefined) ? Number((b.data as any).day) : 0;
      return dayA - dayB;
    });

  // For mobile view, we'll just show a flat list without week grouping
  if (isMobile) {
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
  }
  
  // Group topics by week for desktop view
  const topicsByWeek: Record<number, RoadmapNode[]> = {};
  topicNodes.forEach(node => {
    const day = Number((node.data as any)?.day || 0);
    const week = Math.ceil(day / 7) || 1; // Group by week, default to week 1
    
    if (!topicsByWeek[week]) {
      topicsByWeek[week] = [];
    }
    
    topicsByWeek[week].push(node);
  });
  
  // Sort weeks for display
  const sortedWeeks = Object.keys(topicsByWeek)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <Card className="h-full shadow-md">
      <div className="flex items-center gap-2.5 px-5 py-4">
        <GraduationCap className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-semibold tracking-tight truncate" title={roadmapTitle}>
          {roadmapTitle}
        </h3>
      </div>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-15rem)]">
          <div className="px-3 py-2">
            <Accordion 
              type="multiple" 
              className="w-full space-y-1"
              defaultValue={sortedWeeks.map(week => `week-${week}`)} // Default open
            >
              {sortedWeeks.map((week) => (
                <AccordionItem 
                  key={`week-${week}`} 
                  value={`week-${week}`}
                  className="border-0 bg-muted/40 rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-3 py-2.5 hover:no-underline font-medium">
                    <span className="text-sm">Week {week}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2 px-2">
                    <div className="space-y-1">
                      {topicsByWeek[week].map((node) => (
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
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TutorSidebar;
