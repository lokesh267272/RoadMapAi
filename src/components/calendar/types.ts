
import { CalendarDayInfo, CalendarProps } from "@/types/calendar";

export interface Topic {
  id: string;
  title: string;
  completed: boolean;
  day_number: number;
  roadmap_id: string;
  description?: string | null;
  created_at: string; // Add this to ensure we have the creation date
  updated_at?: string;
  is_custom?: boolean;
  event_date?: string;
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
  is_custom?: boolean;
}
