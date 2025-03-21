
export interface Resource {
  type: string;
  title: string;
  url: string;
}

export interface Node {
  id: string;
  topic: string;
  content: string;
  day?: number;
  resources?: Resource[];
  children?: Node[];
  completed?: boolean;
  position?: { x: number; y: number };
}

export interface LinkType {
  source: { x: number; y: number };
  target: { x: number; y: number };
}

export interface RoadmapMindMapData {
  title: string;
  topics: Node[];
}
