
import { useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Import custom styling for our flowchart
import "./flowchart.css";

export interface RoadmapFlowchartProps {
  initialNodes: any[];
  initialEdges: any[];
  onNodesChange?: (nodes: any[]) => void;
  onEdgesChange?: (edges: any[]) => void;
  readOnly?: boolean;
}

const RoadmapFlowchart = ({
  initialNodes,
  initialEdges,
  onNodesChange,
  onEdgesChange,
  readOnly = false
}: RoadmapFlowchartProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);

  // Handle node changes
  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChangeInternal(changes);
      if (onNodesChange) {
        // Only call external handler after state is updated
        setTimeout(() => onNodesChange(nodes), 0);
      }
    },
    [nodes, onNodesChange, onNodesChangeInternal]
  );

  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes) => {
      onEdgesChangeInternal(changes);
      if (onEdgesChange) {
        // Only call external handler after state is updated
        setTimeout(() => onEdgesChange(edges), 0);
      }
    },
    [edges, onEdgesChange, onEdgesChangeInternal]
  );

  // Handle connecting nodes
  const onConnect = useCallback(
    (connection) => {
      const newEdges = addEdge(
        {
          ...connection,
          style: { stroke: '#6366f1' },
          animated: false
        },
        edges
      );
      setEdges(newEdges);
      if (onEdgesChange) onEdgesChange(newEdges);
    },
    [edges, setEdges, onEdgesChange]
  );

  const nodeColor = (node) => {
    if (node.data?.completed) return 'rgb(34, 197, 94)';
    return 'rgb(234, 179, 8)';
  };

  return (
    <div ref={reactFlowWrapper} className="flowchart-wrapper w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap nodeColor={nodeColor} zoomable pannable />
        {!readOnly && (
          <Panel position="top-right">
            <div className="bg-background/80 backdrop-blur-sm p-2 rounded shadow text-xs">
              <div>Drag nodes to reposition</div>
              <div>Connect nodes using handles</div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

export default RoadmapFlowchart;
