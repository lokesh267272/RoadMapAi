
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { MindMap } from "@/components/mindmap";
import { Node, RoadmapMindMapData } from "@/components/mindmap/types";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

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
      
      // Safely handle the JSON data with type validation
      if (!data?.mind_map_data) {
        return null;
      }
      
      // Check if mind_map_data has the expected structure
      const jsonData = data.mind_map_data as Json;
      
      // Validate the structure before casting
      if (typeof jsonData === 'object' && jsonData !== null && 
          'topics' in jsonData && Array.isArray(jsonData.topics)) {
        // Use type assertion with unknown as intermediate step
        return jsonData as unknown as RoadmapMindMapData;
      }
      
      console.error("Invalid mind map data structure:", jsonData);
      toast.error("Mind map data has invalid format");
      return null;
    }
  });

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
  };

  const handleToggleNodeStatus = () => {
    if (!selectedNode) return;
    
    // Create a new version of the node with updated status
    const updatedNode = {
      ...selectedNode,
      completed: !selectedNode.completed
    };
    
    // Update the selectedNode with the new status
    setSelectedNode(updatedNode);
    
    // Here you would typically persist this change to the database
    // This is a placeholder for that functionality
    console.log("Toggle status for node:", selectedNode.id, "to", !selectedNode.completed);
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
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleToggleNodeStatus}
              >
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
