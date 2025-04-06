
import React from "react";
import { format, isSameDay } from "date-fns";
import { CalendarDayProps } from "./types";
import { getDayButtonClassName, getDayCellClassName } from "./utils";
import { EventIndicators } from "./EventIndicators";

export const CalendarDay: React.FC<CalendarDayProps> = ({
  day,
  dayIdx,
  selectedDay,
  firstDayCurrentMonth,
  data,
  handleDayClick
}) => {
  return (
    <div
      key={dayIdx}
      onClick={() => handleDayClick(day)}
      className={getDayCellClassName(day, selectedDay, firstDayCurrentMonth, dayIdx)}
    >
      <header className="flex items-center justify-between p-2.5">
        <button
          type="button"
          className={getDayButtonClassName(day, selectedDay, firstDayCurrentMonth)}
        >
          <time dateTime={format(day, "yyyy-MM-dd")}>
            {format(day, "d")}
          </time>
        </button>
      </header>
      <div className="flex-1 p-2.5">
        {data
          .filter((event) => isSameDay(event.day, day))
          .map((day) => (
            <div key={day.day.toString()} className="space-y-1.5">
              {day.events.slice(0, 1).map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col items-start gap-1 rounded-lg border bg-muted/50 p-2 text-xs leading-tight"
                >
                  <p className="font-medium leading-none">
                    {event.name}
                  </p>
                  <p className="leading-none text-muted-foreground">
                    {event.time}
                  </p>
                </div>
              ))}
              {day.events.length > 1 && (
                <div className="text-xs text-muted-foreground">
                  + {day.events.length - 1} more
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};
