
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { MindMap } from "@/components/mindmap";
import { Node, RoadmapMindMapData } from "@/components/mindmap/types";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface RoadmapMindMapViewProps {
  roadmapId: string;
  roadmapTitle: string;
  onBack: () => void;
}

const RoadmapMindMapView = ({ roadmapId, roadmapTitle, onBack }: RoadmapMindMapViewProps) => {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  const { data: mindMapData, isLoading } = useQuery({
    queryKey: ["roadmap-mindmap", roadmapId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_roadmaps")
        .select("mind_map_data")
        .eq("id", roadmapId)
        .single();
      
      if (error) {
        console.error("Error fetching mind map data:", error);
        toast.error("Failed to load mind map data");
        throw error;
      }
      
      return data?.mind_map_data as RoadmapMindMapData | null;
    }
  });

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
  };

  const processMindMapData = (data: RoadmapMindMapData | null): Node[] => {
    if (!data || !data.topics) return [];
    return data.topics;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold">{roadmapTitle} - Mind Map</h2>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-card rounded-lg border shadow-sm h-[600px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : mindMapData ? (
            <MindMap 
              data={processMindMapData(mindMapData)} 
              width={800} 
              height={600} 
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNode?.id}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No mind map data available</p>
            </div>
          )}
        </div>
        
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-4">
            {selectedNode ? selectedNode.topic : "Node Details"}
          </h3>
          
          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Content</h4>
                <p>{selectedNode.content}</p>
              </div>
              
              {selectedNode.resources && selectedNode.resources.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Resources</h4>
                  <ul className="space-y-2">
                    {selectedNode.resources.map((resource, index) => (
                      <li key={index}>
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {resource.title || resource.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <Button variant="outline" className="w-full">
                {selectedNode.completed ? "Mark as Incomplete" : "Mark as Complete"}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">Select a node to view details</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoadmapMindMapView;
