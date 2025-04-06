
import React from "react";
import { format } from "date-fns";
import { CalendarDayProps } from "./types";
import { getMobileDayButtonClassName, getTimeClassName } from "./utils";
import { EventIndicators } from "./EventIndicators";

export const MobileCalendarDay: React.FC<Omit<CalendarDayProps, 'dayIdx'> & { dayIdx: number }> = ({
  day,
  dayIdx,
  selectedDay,
  firstDayCurrentMonth,
  data,
  handleDayClick
}) => {
  return (
    <button
      onClick={() => handleDayClick(day)}
      key={dayIdx}
      type="button"
      className={getMobileDayButtonClassName(day, selectedDay, firstDayCurrentMonth)}
    >
      <time
        dateTime={format(day, "yyyy-MM-dd")}
        className={getTimeClassName(day, selectedDay)}
      >
        {format(day, "d")}
      </time>
      
      <EventIndicators date={day} isMobileView={true} data={data} />
    </button>
  );
};
