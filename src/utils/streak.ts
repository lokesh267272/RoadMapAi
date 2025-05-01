import { isToday, isSameDay, subDays, differenceInDays } from "date-fns";

export interface StreakEvent {
  date: Date;
  completed: boolean;
}

/**
 * Calculates the current streak based on completed events.
 * A streak is maintained by completing at least one task on consecutive days.
 * 
 * @param completedEvents Array of events with their completion dates and status
 * @returns The current streak count in days
 */
export const calculateStreak = (completedEvents: StreakEvent[]): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Sort events by date descending and normalize dates
  const sortedEvents = completedEvents
    .map(event => ({
      ...event,
      date: new Date(event.date)
    }))
    .map(event => {
      event.date.setHours(0, 0, 0, 0);
      return event;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  
  // Check if there's activity today
  const hasCompletedToday = sortedEvents.some(event => 
    isToday(event.date) && event.completed
  );
  
  // If no activity today, check yesterday
  if (!hasCompletedToday) {
    const yesterday = subDays(today, 1);
    const hasCompletedYesterday = sortedEvents.some(event => 
      isSameDay(event.date, yesterday) && event.completed
    );
    
    if (!hasCompletedYesterday) {
      return 0;
    }
  }
  
  // Calculate streak
  let streak = 0;
  let currentDate = today;
  let previousDate = null;
  
  for (const event of sortedEvents) {
    if (!event.completed) continue;
    
    const eventDate = event.date;
    
    // If this is the first event we're checking
    if (!previousDate) {
      streak = 1;
      previousDate = eventDate;
      continue;
    }
    
    // Check if dates are consecutive
    const daysDifference = differenceInDays(previousDate, eventDate);
    if (daysDifference === 1) {
      streak++;
      previousDate = eventDate;
    } else {
      break;
    }
  }
  
  return streak;
};

/**
 * Checks if the user needs to complete a task today to maintain their streak
 * 
 * @param streak The current streak count
 * @param lastCompletedDate The date of the last completed task
 * @returns true if user needs to complete a task today to maintain streak
 */
export const needsToCompleteToday = (streak: number, lastCompletedDate: Date): boolean => {
  if (streak === 0) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return !isToday(lastCompletedDate);
};

/**
 * Gets the streak status message
 * 
 * @param streak The current streak count
 * @param needsCompletion Whether user needs to complete a task today
 * @returns A message describing the streak status
 */
export const getStreakStatus = (streak: number, needsCompletion: boolean): string => {
  if (streak === 0) return "No active streak";
  if (needsCompletion) return `Complete a task today to maintain your ${streak}-day streak!`;
  return `You're on a ${streak}-day streak!`;
}; 