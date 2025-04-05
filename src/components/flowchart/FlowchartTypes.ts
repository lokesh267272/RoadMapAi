
import { Json } from "@/integrations/supabase/types";

export interface RoadmapNode {
  id: string;
  type: string;
  data: { label: string; completed?: boolean };
  position: { x: number; y: number };
  style?: any;
}

export interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: any;
}

export interface MindMapData {
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}

export interface Roadmap {
  title: string;
  mind_map_data: Json | null;
}

export interface Topic {
  id: string;
  title: string;
  completed: boolean;
  day_number: number;
}
