
import { CalendarDayInfo, CalendarProps } from "@/types/calendar";

export interface Resource {
  type: 'doc' | 'video' | 'blog' | 'tool';
  title: string;
  url: string;
}

export interface Topic {
  id: string;
  title: string;
  completed: boolean;
  day_number: number;
  roadmap_id: string;
  description?: string | null;
  created_at: string;
  updated_at?: string;
  parent_topic_id?: string | null;
  resources?: Resource[] | null;
  node_position?: any | null;
}

export interface CalendarViewProps {
  selectedRoadmapId: string | null;
  topics: Record<string, Topic[]>;
}

export interface CalendarEvent {
  date: Date;
  title: string;
  completed: boolean;
  id: string;
  roadmap_id: string;
  description?: string | null;
  status: 'completed' | 'pending' | 'missed';
  day_number: number;
  resources?: Resource[] | null;
}
