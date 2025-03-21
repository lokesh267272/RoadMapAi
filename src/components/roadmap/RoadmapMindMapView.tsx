
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, LayoutDashboard, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MindMap } from "@/components/mindmap";
import { Node, RoadmapMindMapData } from "@/components/mindmap/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RoadmapMindMapViewProps {
  roadmapId: string;
  roadmapTitle: string;
  onBack: () => void;
}

const RoadmapMindMapView: React.FC<RoadmapMindMapViewProps> = ({
  roadmapId,
  roadmapTitle,
  onBack
}) => {
  const [mindMapData, setMindMapData] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<"mindmap" | "calendar">("mindmap");

  useEffect(() => {
    const fetchMindMapData = async () => {
      setIsLoading(true);
      try {
        // Fetch the roadmap to get the mind map data
        const { data: roadmapData, error: roadmapError } = await supabase
          .from('learning_roadmaps')
          .select('mind_map_data')
          .eq('id', roadmapId)
          .single();
        
        if (roadmapError) throw roadmapError;
        
        // Fetch all topics for this roadmap
        const { data: topicsData, error: topicsError } = await supabase
          .from('learning_topics')
          .select('*')
          .eq('roadmap_id', roadmapId);
        
        if (topicsError) throw topicsError;
        
        if (roadmapData?.mind_map_data) {
          // If we have mind map data, use it
          const mapData = roadmapData.mind_map_data as RoadmapMindMapData;
          
          // Update completion status from database
          const updateCompletionStatus = (nodes: Node[]): Node[] => {
            return nodes.map(node => {
              const topic = topicsData.find(t => t.title === node.topic);
              const updatedNode = {
                ...node,
                completed: topic ? topic.completed : false,
                id: topic ? topic.id : node.id
              };
              
              if (node.children && node.children.length > 0) {
                updatedNode.children = updateCompletionStatus(node.children);
              }
              
              return updatedNode;
            });
          };
          
          if (mapData.topics && mapData.topics.length > 0) {
            // Create a root node for the mind map
            const rootNode: Node = {
              id: "root",
              topic: mapData.title,
              content: "Learning roadmap overview",
              children: updateCompletionStatus(mapData.topics)
            };
            
            setMindMapData(rootNode);
          }
        } else if (topicsData.length > 0) {
          // If no mind map data, create a basic structure from topics
          const rootTopics = topicsData.filter(t => !t.parent_topic_id);
          
          // Convert flat list to hierarchical structure
          const buildTree = (topics: any[], parentId: string | null = null): Node[] => {
            const children = topics.filter(t => t.parent_topic_id === parentId);
            
            return children.map(child => ({
              id: child.id,
              topic: child.title,
              content: child.description || "",
              day: child.day_number,
              completed: child.completed,
              resources: child.resources || [],
              children: buildTree(topics, child.id)
            }));
          };
          
          // Create a root node
          const rootNode: Node = {
            id: "root",
            topic: roadmapTitle,
            content: "Learning roadmap overview",
            children: buildTree(topicsData)
          };
          
          setMindMapData(rootNode);
        }
      } catch (error) {
        console.error("Error fetching mind map data:", error);
        toast.error("Failed to load mind map data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMindMapData();
  }, [roadmapId, roadmapTitle]);

  const handleNodeComplete = async (nodeId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('learning_topics')
        .update({ completed })
        .eq('id', nodeId);
      
      if (error) throw error;
      
      toast.success(`Topic marked as ${completed ? "completed" : "incomplete"}`);
    } catch (error) {
      console.error("Error updating topic completion:", error);
      toast.error("Failed to update topic status");
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Back to Roadmaps
        </Button>
        
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "mindmap" | "calendar")}>
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="mindmap" className="flex items-center gap-1">
              <LayoutDashboard className="h-4 w-4" />
              Mind Map
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <Card className="bg-glass shadow">
        <CardHeader>
          <CardTitle>{roadmapTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[60vh]">
            {activeView === "mindmap" ? (
              isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : mindMapData ? (
                <MindMap 
                  data={mindMapData} 
                  onNodeComplete={handleNodeComplete}
                  className="h-full"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No mind map data available for this roadmap
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center">
                {/* Calendar view will be integrated here */}
                <p className="text-muted-foreground">
                  Switch to the Dashboard view to see the calendar
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoadmapMindMapView;
