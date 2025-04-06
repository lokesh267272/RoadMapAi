
import { Dispatch, SetStateAction } from "react";

export interface Event {
  id: number;
  name: string;
  time: string;
  datetime: string;
}

export interface CalendarData {
  day: Date;
  events: Event[];
}

export interface FullScreenCalendarProps {
  data: CalendarData[];
  onDayClick?: (date: Date) => void;
}

export interface CalendarHeaderProps {
  currentMonth: string;
  firstDayCurrentMonth: Date;
  previousMonth: () => void;
  nextMonth: () => void;
  goToToday: () => void;
}

export interface CalendarGridProps {
  days: Date[];
  selectedDay: Date;
  firstDayCurrentMonth: Date;
  data: CalendarData[];
  handleDayClick: (day: Date) => void;
  isMobile: boolean;
}

export interface CalendarDayProps {
  day: Date;
  dayIdx: number;
  selectedDay: Date;
  firstDayCurrentMonth: Date;
  data: CalendarData[];
  handleDayClick: (day: Date) => void;
}

export interface EventIndicatorsProps {
  date: Date;
  isMobileView: boolean;
  data: CalendarData[];
}
