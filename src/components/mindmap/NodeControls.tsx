
import React from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

interface NodeControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  zoomLevel: number;
}

export const NodeControls: React.FC<NodeControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  zoomLevel
}) => {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onZoomIn}
        className="rounded-b-none"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <div className="py-1 px-2 text-xs text-center border-t border-b">
        {Math.round(zoomLevel * 100)}%
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onZoomOut}
        className="rounded-t-none rounded-b-none border-b"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onReset}
        className="rounded-t-none"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
};
