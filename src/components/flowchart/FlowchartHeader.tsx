
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { saveFlowchart } from "./FlowchartUtils";
import { RoadmapNode, RoadmapEdge } from "./FlowchartTypes";

interface FlowchartHeaderProps {
  roadmapId: string;
  roadmapTitle: string;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}

const FlowchartHeader = ({ roadmapId, roadmapTitle, nodes, edges }: FlowchartHeaderProps) => {
  const navigate = useNavigate();

  const handleSaveFlowchart = async () => {
    await saveFlowchart(roadmapId, nodes, edges);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
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
  );
};

export default FlowchartHeader;
