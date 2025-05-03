
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchRoadmapData } from "@/components/flowchart/FlowchartUtils";
import { RoadmapNode, RoadmapEdge } from "@/components/flowchart/FlowchartTypes";
import TutorSidebar from "@/components/tutor/TutorSidebar";
import TutorContent from "@/components/tutor/TutorContent";
import TutorChat from "@/components/tutor/TutorChat";

const AiTutor = () => {
  const { user } = useAuth();
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const [searchParams] = useSearchParams();
  const topicId = searchParams.get("topicId");
  const topicTitle = searchParams.get("title");

  const [isLoading, setIsLoading] = useState(true);
  const [roadmapTitle, setRoadmapTitle] = useState("");
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [edges, setEdges] = useState<RoadmapEdge[]>([]);
  
  useEffect(() => {
    if (roadmapId) {
      fetchRoadmapData(
        roadmapId,
        setRoadmapTitle,
        setNodes,
        setEdges,
        setIsLoading
      );
    }
  }, [roadmapId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full pt-16 pb-8 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-3 animate-fadeInUp h-full">
        <div className="flex flex-col md:flex-row h-[calc(100vh-10rem)] gap-5">
          {/* Left Panel - Topics */}
          <div className="w-full md:w-1/4 h-full overflow-hidden shrink-0">
            <TutorSidebar 
              roadmapId={roadmapId || ""} 
              roadmapTitle={roadmapTitle}
              nodes={nodes}
              currentTopicId={topicId || ""}
            />
          </div>
          
          {/* Center Panel - Content */}
          <div className="w-full md:w-[40%] h-full overflow-y-auto">
            <TutorContent 
              topicId={topicId || ""} 
              topicTitle={topicTitle || ""} 
            />
          </div>
          
          {/* Right Panel - Chat */}
          <div className="w-full md:w-[35%] h-full flex flex-col overflow-hidden">
            <TutorChat 
              topicId={topicId || ""} 
              topicTitle={topicTitle || ""} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiTutor;
