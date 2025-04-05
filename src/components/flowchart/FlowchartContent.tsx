
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RoadmapFlowchart from "./RoadmapFlowchart";
import { RoadmapNode, RoadmapEdge } from "./FlowchartTypes";

interface FlowchartContentProps {
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  setNodes: (nodes: RoadmapNode[]) => void;
  setEdges: (edges: RoadmapEdge[]) => void;
}

const FlowchartContent = ({
  nodes,
  edges,
  setNodes,
  setEdges
}: FlowchartContentProps) => {
  return (
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
  );
};

export default FlowchartContent;
