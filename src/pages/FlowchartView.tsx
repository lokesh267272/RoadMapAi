
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { RoadmapNode, RoadmapEdge } from "@/components/flowchart/FlowchartTypes";
import { fetchRoadmapData } from "@/components/flowchart/FlowchartUtils";
import FlowchartHeader from "@/components/flowchart/FlowchartHeader";
import FlowchartContent from "@/components/flowchart/FlowchartContent";

const FlowchartView = () => {
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const { user } = useAuth();
  const [roadmapTitle, setRoadmapTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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
    <div className="min-h-screen w-full pt-16 pb-8">
      <div className="container mx-auto px-4 animate-fadeInUp">
        <FlowchartHeader 
          roadmapId={roadmapId || ""} 
          roadmapTitle={roadmapTitle} 
          nodes={nodes} 
          edges={edges} 
        />
        
        <FlowchartContent 
          nodes={nodes} 
          edges={edges} 
          setNodes={setNodes} 
          setEdges={setEdges} 
        />
      </div>
    </div>
  );
};

export default FlowchartView;
