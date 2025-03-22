
import { format, isSameDay, isToday, isBefore } from "date-fns";
import { Topic, CalendarEvent } from "./types";

export const distributeTopicsToCalendar = (topics: Topic[], startDate = new Date()) => {
  const calendarEvents: CalendarEvent[] = [];

  const sortedTopics = [...topics].sort((a, b) => a.day_number - b.day_number);
  const today = new Date();
  
  // Only proceed if we have topics to distribute
  if (sortedTopics.length > 0) {
    // Find the roadmap id from the first topic
    const roadmapId = sortedTopics[0].roadmap_id;
    
    // Find the earliest topic by day_number (should be day 1)
    const earliestTopic = sortedTopics[0];
    
    // Calculate the original start date of the roadmap using the earliest topic's creation date
    // We subtract (day_number - 1) days to get back to day 1
    const originalStartDate = new Date(earliestTopic.created_at);
    originalStartDate.setDate(originalStartDate.getDate() - (earliestTopic.day_number - 1));
    
    // Use this fixed original start date for all topics
    sortedTopics.forEach((topic) => {
      // Calculate each topic's date based on its day number and the original start date
      const topicDate = new Date(originalStartDate);
      topicDate.setDate(originalStartDate.getDate() + (topic.day_number - 1));
      
      let status: 'completed' | 'pending' | 'missed';
      if (topic.completed) {
        status = 'completed';
      } else if (isBefore(topicDate, today) && !isSameDay(topicDate, today)) {
        status = 'missed';
      } else {
        status = 'pending';
      }
      
      calendarEvents.push({
        date: topicDate,
        title: topic.title,
        completed: topic.completed,
        id: topic.id,
        roadmap_id: topic.roadmap_id,
        description: topic.description,
        status,
        day_number: topic.day_number
      });
    });
  }

  return calendarEvents;
};

export const getStatusColor = (status: 'completed' | 'pending' | 'missed') => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400';
    case 'pending':
      return 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400';
    case 'missed':
      return 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400';
    default:
      return 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400';
  }
};

export const formatCalendarData = (calendarEvents: CalendarEvent[]) => {
  const data: {
    day: Date;
    events: {
      id: number;
      name: string;
      time: string;
      datetime: string;
    }[];
  }[] = [];

  const eventsByDate = new Map<string, {
    day: Date;
    events: {
      id: number;
      name: string;
      time: string;
      datetime: string;
    }[];
  }>();

  calendarEvents.forEach(event => {
    const dateStr = format(event.date, 'yyyy-MM-dd');
    if (!eventsByDate.has(dateStr)) {
      eventsByDate.set(dateStr, {
        day: event.date,
        events: []
      });
    }

    const entry = eventsByDate.get(dateStr);
    if (entry) {
      entry.events.push({
        id: parseInt(event.id.slice(0, 8), 16),
        name: event.title,
        time: event.status === 'completed' ? 'Completed' : event.status === 'pending' ? 'Pending' : 'Missed',
        datetime: format(event.date, 'yyyy-MM-dd')
      });
    }
  });

  eventsByDate.forEach(value => {
    data.push(value);
  });

  return data;
};
