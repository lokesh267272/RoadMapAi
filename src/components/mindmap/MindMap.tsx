import React, { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { Node, LinkType } from "./types";
import { NodeControls } from "./NodeControls";
import { Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MindMapProps {
  data: Node[];
  width?: number;
  height?: number;
  onNodeClick?: (node: Node) => void;
  selectedNodeId?: string | null;
}

const MindMap: React.FC<MindMapProps> = ({
  data,
  width = 800,
  height = 600,
  onNodeClick,
  selectedNodeId = null
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);

  // Extract links from hierarchical data
  const buildLinksAndNodes = useCallback((nodeData: Node[], parentPosition = { x: width / 2, y: height / 2 }) => {
    let allLinks: LinkType[] = [];
    let allNodes: Node[] = [];
    
    nodeData.forEach((node, index) => {
      // Calculate positions if not explicitly set
      const position = node.position || {
        x: parentPosition.x + 180 * Math.cos(index * (2 * Math.PI / nodeData.length)),
        y: parentPosition.y + 180 * Math.sin(index * (2 * Math.PI / nodeData.length))
      };
      
      const nodeWithPosition = { ...node, position };
      allNodes.push(nodeWithPosition);
      
      // Create link from parent to this node
      if (parentPosition) {
        allLinks.push({
          source: { x: parentPosition.x, y: parentPosition.y },
          target: { x: position.x, y: position.y }
        });
      }

      // Process children recursively
      if (node.children && node.children.length > 0) {
        const { links: childLinks, nodes: childNodes } = buildLinksAndNodes(node.children, position);
        allLinks = [...allLinks, ...childLinks];
        allNodes = [...allNodes, ...childNodes];
      }
    });

    return { links: allLinks, nodes: allNodes };
  }, [width, height]);

  // Initialize D3
  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select("g");

    // Create zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    // Apply zoom to SVG
    svg.call(zoomBehavior);
    setZoom(zoomBehavior);

    // Initialize data with positions
    const { links, nodes } = buildLinksAndNodes(data);
    setLinks(links);
    setNodes(nodes);

    // Center the view
    const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8);
    svg.call(zoomBehavior.transform, initialTransform);

  }, [data, buildLinksAndNodes, width, height]);

  // Handle zooming
  const handleZoomIn = useCallback(() => {
    if (svgRef.current && zoom) {
      const svg = d3.select(svgRef.current);
      zoom.scaleBy(svg.transition().duration(300), 1.2);
    }
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    if (svgRef.current && zoom) {
      const svg = d3.select(svgRef.current);
      zoom.scaleBy(svg.transition().duration(300), 0.8);
    }
  }, [zoom]);

  const handleReset = useCallback(() => {
    if (svgRef.current && zoom) {
      const svg = d3.select(svgRef.current);
      const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8);
      svg.transition().duration(300).call(zoom.transform, initialTransform);
    }
  }, [zoom, width, height]);

  return (
    <div className="relative w-full h-full min-h-[500px] bg-background/50 rounded-lg">
      <svg ref={svgRef} width="100%" height="100%" className="overflow-hidden rounded-lg">
        <g>
          {/* Render links */}
          {links.map((link, i) => (
            <line
              key={`link-${i}`}
              x1={link.source.x}
              y1={link.source.y}
              x2={link.target.x}
              y2={link.target.y}
              stroke="#ddd"
              strokeWidth="2"
              strokeDasharray="4,4"
            />
          ))}
          
          {/* Render nodes */}
          {nodes.map((node) => {
            // Add the type assertion here to fix the TS error
            const nodePosition = node.position as { x: number; y: number } || { x: 0, y: 0 };
            
            const isSelected = selectedNodeId === node.id;
            const isCompleted = node.completed;
            
            return (
              <g 
                key={node.id} 
                transform={`translate(${nodePosition.x}, ${nodePosition.y})`}
                onClick={() => onNodeClick && onNodeClick(node)}
                style={{ cursor: "pointer" }}
              >
                {/* Node circle background */}
                <circle 
                  r={35} 
                  fill={isSelected ? "rgb(var(--primary-500))" : (isCompleted ? "rgb(var(--success-500))" : "white")}
                  stroke={isSelected ? "rgb(var(--primary-600))" : "#ddd"}
                  strokeWidth="2"
                />
                
                {/* Node label */}
                <text 
                  textAnchor="middle" 
                  dy=".3em" 
                  fontSize="12px"
                  fill={isSelected || isCompleted ? "white" : "rgb(var(--foreground))"}
                  style={{ 
                    pointerEvents: "none",
                    fontWeight: isSelected ? "bold" : "normal"
                  }}
                >
                  {node.topic.length > 10 ? `${node.topic.substring(0, 10)}...` : node.topic}
                </text>
                
                {/* Completed indicator */}
                {isCompleted && (
                  <foreignObject x="-8" y="-8" width="16" height="16">
                    <Check className="h-4 w-4 text-white" />
                  </foreignObject>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      
      {/* Zoom controls */}
      <NodeControls 
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        zoomLevel={zoomLevel}
      />
    </div>
  );
};

export default MindMap;
