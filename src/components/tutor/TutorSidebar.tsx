
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RoadmapNode } from "@/components/flowchart/FlowchartTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";

interface TutorSidebarProps {
  roadmapId: string;
  roadmapTitle: string;
  nodes: RoadmapNode[];
  currentTopicId: string;
}

const TutorSidebar = ({ roadmapId, roadmapTitle, nodes, currentTopicId }: TutorSidebarProps) => {
  const navigate = useNavigate();

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

  // Group topics by week
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
    <Card className="h-full">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center mb-1">
          <GraduationCap className="w-5 h-5 mr-2 text-primary" />
          <CardTitle className="text-lg">Learning Path</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground truncate" title={roadmapTitle}>
          {roadmapTitle}
        </p>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-15rem)]">
          <div className="p-2">
            <Accordion type="multiple" className="w-full">
              {sortedWeeks.map((week) => (
                <AccordionItem key={`week-${week}`} value={`week-${week}`}>
                  <AccordionTrigger className="px-2 py-1 hover:no-underline">
                    <span className="text-sm font-medium">Week {week}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-2">
                      {topicsByWeek[week].map((node) => (
                        <Button
                          key={node.id}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start text-left mb-1 overflow-hidden",
                            currentTopicId === node.id && "bg-accent text-accent-foreground"
                          )}
                          onClick={() => handleTopicClick(node.id, node.data?.label || "")}
                        >
                          <ChevronRight className="w-4 h-4 mr-2 shrink-0" />
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
