
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Node, LinkType } from "./types";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NodeDetailsPanel } from "./NodeDetailsPanel";
import { cn } from "@/lib/utils";
import { NodeControls } from "./NodeControls";

interface MindMapProps {
  data: Node | null;
  onNodeClick?: (node: Node) => void;
  onNodeComplete?: (nodeId: string, completed: boolean) => void;
  className?: string;
}

const MindMap: React.FC<MindMapProps> = ({ 
  data, 
  onNodeClick,
  onNodeComplete,
  className
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewportCenter, setViewportCenter] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    setViewportCenter({ x: width / 2, y: height / 2 });

    // Clear SVG
    d3.select(svgRef.current).selectAll("*").remove();

    // Create the hierarchical structure
    const root = d3.hierarchy(data);
    
    // Create a tree layout
    const treeLayout = d3.tree<Node>()
      .size([height - 100, width - 160])
      .nodeSize([80, 200]);
    
    const rootNode = treeLayout(root);
    
    // Create SVG element
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .call(d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 3])
        .on("zoom", (event) => {
          setZoomLevel(event.transform.k);
          g.attr("transform", event.transform.toString());
        }) as any
      );
    
    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, 50)`);
    
    // Add links
    g.selectAll(".link")
      .data(rootNode.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1.5)
      .attr("d", d3.linkHorizontal<d3.HierarchyLink<Node>, unknown>()
        .x((d) => d.y)
        .y((d) => d.x)
      );
    
    // Add nodes
    const nodes = g.selectAll(".node")
      .data(rootNode.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y}, ${d.x})`)
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(d.data);
        if (onNodeClick) onNodeClick(d.data);
      });
    
    // Add node circles
    nodes.append("circle")
      .attr("r", 10)
      .attr("fill", d => d.data.completed ? "#10b981" : "#3b82f6")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
    
    // Add node labels
    nodes.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d.children ? -12 : 12)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.topic.length > 25 ? d.data.topic.substring(0, 25) + "..." : d.data.topic)
      .attr("font-size", "12px")
      .attr("fill", "#374151");
    
    // Add day labels for root nodes
    nodes.filter(d => !d.parent)
      .append("text")
      .attr("dy", "-1.5em")
      .attr("text-anchor", "middle")
      .text(d => d.data.day ? `Day ${d.data.day}` : "")
      .attr("font-size", "10px")
      .attr("fill", "#6b7280");

    // Handle SVG background clicks to deselect
    svg.on("click", () => {
      setSelectedNode(null);
    });

  }, [data, onNodeClick]);

  const handleNodeComplete = (completed: boolean) => {
    if (selectedNode && onNodeComplete) {
      onNodeComplete(selectedNode.id, completed);
      // Update the local state
      setSelectedNode(prev => prev ? { ...prev, completed } : null);
    }
  };

  const handleZoom = (factor: number) => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const newZoom = zoomLevel * factor;
    
    svg.transition().duration(300).call(
      (d3.zoom<SVGSVGElement, unknown>() as any)
        .transform,
      d3.zoomIdentity
        .translate(viewportCenter.x, viewportCenter.y)
        .scale(newZoom)
        .translate(-viewportCenter.x, -viewportCenter.y)
    );
    
    setZoomLevel(newZoom);
  };

  const resetZoom = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      (d3.zoom<SVGSVGElement, unknown>() as any)
        .transform,
      d3.zoomIdentity
    );
    
    setZoomLevel(1);
  };

  return (
    <div className={cn("relative h-full flex flex-col", className)}>
      <div className="flex-1 relative overflow-hidden border rounded-lg bg-background/50">
        <svg ref={svgRef} className="w-full h-full"></svg>
        <NodeControls 
          onZoomIn={() => handleZoom(1.2)} 
          onZoomOut={() => handleZoom(0.8)} 
          onReset={resetZoom}
          zoomLevel={zoomLevel}
        />
      </div>
      
      {selectedNode && (
        <NodeDetailsPanel 
          node={selectedNode} 
          onClose={() => setSelectedNode(null)}
          onComplete={handleNodeComplete}
        />
      )}
    </div>
  );
};

export default MindMap;
