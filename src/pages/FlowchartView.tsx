
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button"; // Fixed import from button instead of card
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import RoadmapFlowchart from "@/components/flowchart/RoadmapFlowchart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Define proper TypeScript interfaces for our data structures
interface RoadmapNode {
  id: string;
  type: string;
  data: { label: string; completed?: boolean };
  position: { x: number; y: number };
  style?: any;
}

interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: any;
}

interface MindMapData {
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}

interface Roadmap {
  title: string;
  mind_map_data: MindMapData | null;
}

interface Topic {
  id: string;
  title: string;
  completed: boolean;
  day_number: number;
}

const FlowchartView = () => {
  const { roadmapId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roadmapTitle, setRoadmapTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [edges, setEdges] = useState<RoadmapEdge[]>([]);

  useEffect(() => {
    const fetchRoadmapData = async () => {
      if (!roadmapId) return;

      try {
        // Fetch the roadmap
        const { data: roadmap, error: roadmapError } = await supabase
          .from('learning_roadmaps')
          .select('title, mind_map_data')
          .eq('id', roadmapId)
          .single();

        if (roadmapError) throw roadmapError;

        setRoadmapTitle(roadmap.title);

        // Check if we have flowchart data already
        if (roadmap.mind_map_data) {
          // Type assertion to help TypeScript understand the structure
          const mindMapData = roadmap.mind_map_data as MindMapData;
          setNodes(mindMapData.nodes || []);
          setEdges(mindMapData.edges || []);
        } else {
          // Fetch topics to build the flowchart
          const { data: topics, error: topicsError } = await supabase
            .from('learning_topics')
            .select('*')
            .eq('roadmap_id', roadmapId)
            .order('day_number', { ascending: true });

          if (topicsError) throw topicsError;

          // Generate flowchart from topics
          const { generatedNodes, generatedEdges } = generateFlowchartFromTopics(topics);
          setNodes(generatedNodes);
          setEdges(generatedEdges);
        }
      } catch (error) {
        console.error("Error fetching roadmap data:", error);
        toast.error("Failed to load roadmap flowchart");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoadmapData();
  }, [roadmapId]);

  const generateFlowchartFromTopics = (topics: Topic[]) => {
    const generatedNodes: RoadmapNode[] = [];
    const generatedEdges: RoadmapEdge[] = [];
    
    // Create a node for the roadmap title (root node)
    generatedNodes.push({
      id: 'root',
      type: 'input',
      data: { label: roadmapTitle },
      position: { x: 250, y: 0 }
    });

    const columnWidth = 300;
    const rowHeight = 100;
    const maxNodesPerColumn = 4;
    
    // Group topics by week for better organization
    const topicsByWeek = topics.reduce((acc: Record<string, Topic[]>, topic) => {
      const weekNumber = Math.ceil(topic.day_number / 7);
      if (!acc[weekNumber]) acc[weekNumber] = [];
      acc[weekNumber].push(topic);
      return acc;
    }, {});
    
    const weeks = Object.keys(topicsByWeek).sort((a, b) => parseInt(a) - parseInt(b));

    // Create nodes for each week
    weeks.forEach((week, weekIndex) => {
      const weekId = `week-${week}`;
      
      // Add week node
      generatedNodes.push({
        id: weekId,
        type: 'default',
        data: { label: `Week ${week}` },
        position: { x: columnWidth * (weekIndex + 1), y: 0 }
      });
      
      // Connect root to week
      generatedEdges.push({
        id: `edge-root-${weekId}`,
        source: weekIndex === 0 ? 'root' : `week-${weeks[weekIndex - 1]}`,
        target: weekId,
        animated: false,
        style: { stroke: '#6366f1' }
      });
      
      // Add topic nodes for this week
      topicsByWeek[week].forEach((topic, topicIndex) => {
        const topicPosition = (topicIndex % maxNodesPerColumn) + 1;
        const topicRow = Math.floor(topicIndex / maxNodesPerColumn);
        
        // Create topic node
        generatedNodes.push({
          id: topic.id,
          type: 'default',
          data: { 
            label: topic.title,
            completed: topic.completed
          },
          position: { 
            x: columnWidth * (weekIndex + 1), 
            y: rowHeight * topicPosition + (topicRow * rowHeight * maxNodesPerColumn) 
          },
          style: {
            background: topic.completed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
            borderColor: topic.completed ? 'rgb(34, 197, 94)' : 'rgb(234, 179, 8)',
            borderWidth: '2px'
          }
        });
        
        // Connect week node to topic
        generatedEdges.push({
          id: `edge-${weekId}-${topic.id}`,
          source: weekId,
          target: topic.id,
          style: { stroke: topic.completed ? 'rgb(34, 197, 94)' : 'rgb(234, 179, 8)' }
        });
      });
    });

    return { generatedNodes, generatedEdges };
  };

  const handleSaveFlowchart = async () => {
    if (!roadmapId || !user) return;
    
    try {
      const { error } = await supabase
        .from('learning_roadmaps')
        .update({ 
          mind_map_data: { nodes, edges },
          updated_at: new Date().toISOString()
        })
        .eq('id', roadmapId);
      
      if (error) throw error;
      
      toast.success("Flowchart saved successfully!");
    } catch (error) {
      console.error("Error saving flowchart:", error);
      toast.error("Failed to save flowchart");
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button
              variant="outline"
              onClick={handleBackToDashboard}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">{roadmapTitle} - Flowchart View</h1>
          </div>
          <Button onClick={handleSaveFlowchart}>
            <Save className="mr-2 h-4 w-4" /> Save Layout
          </Button>
        </div>

        <Card className="bg-glass shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Learning Path Visualization</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full h-[70vh]">
              <RoadmapFlowchart 
                initialNodes={nodes} 
                initialEdges={edges}
                onNodesChange={setNodes}
                onEdgesChange={setEdges}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FlowchartView;
