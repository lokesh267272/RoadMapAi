
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RoadmapNode, RoadmapEdge, Topic } from "./FlowchartTypes";
import { Json } from "@/integrations/supabase/types";

export const fetchRoadmapData = async (
  roadmapId: string, 
  setRoadmapTitle: (title: string) => void,
  setNodes: (nodes: RoadmapNode[]) => void,
  setEdges: (edges: RoadmapEdge[]) => void,
  setIsLoading: (loading: boolean) => void
) => {
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
      // Safely access the properties using type guards
      const mindMapData = roadmap.mind_map_data as any;
      if (mindMapData && typeof mindMapData === 'object') {
        if (mindMapData.nodes && Array.isArray(mindMapData.nodes)) {
          setNodes(mindMapData.nodes);
        }
        if (mindMapData.edges && Array.isArray(mindMapData.edges)) {
          setEdges(mindMapData.edges);
        }
      }
      
      // If we have data but nodes aren't set properly, fetch the topics
      const nodesState = await getNodesState(setNodes);
      if (nodesState.length <= 1) {
        await fetchTopicsAndGenerateFlowchart(roadmapId, roadmap.title, setNodes, setEdges);
      }
    } else {
      // No flowchart data, so fetch topics to build it
      await fetchTopicsAndGenerateFlowchart(roadmapId, roadmap.title, setNodes, setEdges);
    }
  } catch (error) {
    console.error("Error fetching roadmap data:", error);
    toast.error("Failed to load roadmap flowchart");
  } finally {
    setIsLoading(false);
  }
};

// Helper to get current nodes state for condition check
const getNodesState = async (setNodes: (nodes: RoadmapNode[]) => void): Promise<RoadmapNode[]> => {
  return new Promise(resolve => {
    let currentNodes: RoadmapNode[] = [];
    setNodes(nodes => {
      currentNodes = nodes;
      return nodes;
    });
    resolve(currentNodes);
  });
};

export const fetchTopicsAndGenerateFlowchart = async (
  roadmapId: string, 
  title: string,
  setNodes: (nodes: RoadmapNode[]) => void,
  setEdges: (edges: RoadmapEdge[]) => void
) => {
  try {
    // Fetch topics to build the flowchart
    const { data: topics, error: topicsError } = await supabase
      .from('learning_topics')
      .select('id, title, completed, day_number')
      .eq('roadmap_id', roadmapId)
      .order('day_number', { ascending: true });

    if (topicsError) throw topicsError;

    if (topics && topics.length > 0) {
      // Generate flowchart from topics
      const { generatedNodes, generatedEdges } = generateFlowchartFromTopics(topics, title);
      setNodes(generatedNodes);
      setEdges(generatedEdges);
    } else {
      // If no topics, at least show the root node
      setNodes([{
        id: 'root',
        type: 'input',
        data: { label: title },
        position: { x: 250, y: 0 }
      }]);
      setEdges([]);
    }
  } catch (error) {
    console.error("Error fetching topics:", error);
    toast.error("Failed to load topics");
  }
};

export const generateFlowchartFromTopics = (topics: Topic[], title: string) => {
  const generatedNodes: RoadmapNode[] = [];
  const generatedEdges: RoadmapEdge[] = [];
  
  // Create a node for the roadmap title (root node)
  generatedNodes.push({
    id: 'root',
    type: 'input',
    data: { label: title },
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

export const saveFlowchart = async (
  roadmapId: string,
  nodes: RoadmapNode[],
  edges: RoadmapEdge[]
) => {
  if (!roadmapId) return;
  
  try {
    const { error } = await supabase
      .from('learning_roadmaps')
      .update({ 
        mind_map_data: { nodes, edges } as unknown as Json,
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
