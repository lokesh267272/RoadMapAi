
import { getDay, isEqual, isSameDay, isToday, isSameMonth } from "date-fns";
import { cn } from "@/lib/utils";

export const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
];

export const getDayButtonClassName = (
  day: Date,
  selectedDay: Date,
  firstDayCurrentMonth: Date
) => {
  return cn(
    isEqual(day, selectedDay) && "text-primary-foreground",
    !isEqual(day, selectedDay) &&
      !isToday(day) &&
      isSameMonth(day, firstDayCurrentMonth) &&
      "text-foreground",
    !isEqual(day, selectedDay) &&
      !isToday(day) &&
      !isSameMonth(day, firstDayCurrentMonth) &&
      "text-muted-foreground",
    isEqual(day, selectedDay) && isToday(day) && "border-none bg-primary",
    isEqual(day, selectedDay) && !isToday(day) && "bg-foreground",
    (isEqual(day, selectedDay) || isToday(day)) && "font-semibold",
    "flex h-7 w-7 items-center justify-center rounded-full text-xs hover:border"
  );
};

export const getDayCellClassName = (
  day: Date,
  selectedDay: Date,
  firstDayCurrentMonth: Date,
  dayIdx: number
) => {
  return cn(
    dayIdx === 0 && colStartClasses[getDay(day)],
    !isEqual(day, selectedDay) &&
      !isToday(day) &&
      !isSameMonth(day, firstDayCurrentMonth) &&
      "bg-accent/50 text-muted-foreground",
    "relative flex flex-col border-b border-r cursor-pointer hover:bg-muted focus:z-10",
    !isEqual(day, selectedDay) && "hover:bg-accent/75"
  );
};

export const getMobileDayButtonClassName = (
  day: Date,
  selectedDay: Date,
  firstDayCurrentMonth: Date
) => {
  return cn(
    isEqual(day, selectedDay) && "text-primary-foreground",
    !isEqual(day, selectedDay) &&
      !isToday(day) &&
      isSameMonth(day, firstDayCurrentMonth) &&
      "text-foreground",
    !isEqual(day, selectedDay) &&
      !isToday(day) &&
      !isSameMonth(day, firstDayCurrentMonth) &&
      "text-muted-foreground",
    (isEqual(day, selectedDay) || isToday(day)) && "font-semibold",
    "flex h-14 flex-col border-b border-r px-3 py-2 hover:bg-muted focus:z-10"
  );
};

export const getTimeClassName = (day: Date, selectedDay: Date) => {
  return cn(
    "ml-auto flex size-6 items-center justify-center rounded-full",
    isEqual(day, selectedDay) &&
      isToday(day) &&
      "bg-primary text-primary-foreground",
    isEqual(day, selectedDay) &&
      !isToday(day) &&
      "bg-primary text-primary-foreground"
  );
};

export const renderEventIndicators = (
  date: Date,
  isMobileView: boolean,
  data: { day: Date; events: { id: number; name: string; time: string; datetime: string }[] }[]
) => {
  const dayEvents = data.filter((d) => isSameDay(d.day, date));
  
  if (dayEvents.length === 0) return null;
  
  const totalEvents = dayEvents.reduce((sum, day) => sum + day.events.length, 0);
  
  if (isMobileView) {
    // Mobile view with maximum of 2 dots or single dot with number
    if (totalEvents <= 2) {
      // Display dots equal to the number of events (1 or 2)
      return (
        <div className="-mx-0.5 mt-auto flex justify-center">
          {Array.from({ length: Math.min(totalEvents, 2) }).map((_, i) => (
            <span
              key={i}
              className="mx-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground"
            />
          ))}
        </div>
      );
    } else {
      // Display 2 dots + number for more than 2 events
      return (
        <div className="mt-auto relative">
          <div className="flex justify-center">
            <span className="mx-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            <span className="mx-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          </div>
          <span className="absolute bottom-0 right-0 text-[10px] font-medium text-muted-foreground">
            +{totalEvents - 2}
          </span>
        </div>
      );
    }
  } else {
    // Desktop view
    return dayEvents.map((date) => (
      <div
        key={date.day.toString()}
        className="-mx-0.5 mt-auto flex flex-wrap-reverse"
      >
        {date.events.map((event) => (
          <span
            key={event.id}
            className="mx-0.5 mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground"
          />
        ))}
      </div>
    ));
  }
};
