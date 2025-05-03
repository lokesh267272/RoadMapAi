
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RoadmapNode } from "@/components/flowchart/FlowchartTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TutorSidebarProps {
  roadmapId: string;
  roadmapTitle: string;
  nodes: RoadmapNode[];
  currentTopicId: string;
}

const TutorSidebar = ({ roadmapId, roadmapTitle, nodes, currentTopicId }: TutorSidebarProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const handleTopicClick = (nodeId: string, label: string) => {
    navigate(`/ai-tutor/${roadmapId}?topicId=${nodeId}&title=${encodeURIComponent(label)}`);
  };

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
            {nodes
              .filter(node => node.type !== "start" && node.type !== "end")
              .sort((a, b) => {
                // Sort by day number if available, safely access the property using optional chaining
                const dayA = a.data?.day ? Number(a.data.day) : 0;
                const dayB = b.data?.day ? Number(b.data.day) : 0;
                return dayA - dayB;
              })
              .map((node) => (
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TutorSidebar;
