
import { useState, useEffect } from "react";
import { isBefore, isSameDay } from "date-fns";
import { CalendarEvent } from "./types";

const useCalendarStats = (calendarEvents: CalendarEvent[]) => {
  const [streak, setStreak] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);

  useEffect(() => {
    // Calculate statistics only when we have events
    if (calendarEvents.length === 0) return;
    
    const allEvents = [...calendarEvents];
    const today = new Date();
    
    // Calculate completion rate
    const completedCount = allEvents.filter(event => event.completed).length;
    setCompletionRate(Math.round((completedCount / allEvents.length) * 100));
    
    // Calculate streak
    let currentStreak = 0;
    const sortedDates = [...allEvents]
      .filter(event => isBefore(event.date, today) || isSameDay(event.date, today))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    for (const event of sortedDates) {
      if (event.completed) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    setStreak(currentStreak);
  }, [calendarEvents]);

  return { streak, completionRate };
};

export default useCalendarStats;
