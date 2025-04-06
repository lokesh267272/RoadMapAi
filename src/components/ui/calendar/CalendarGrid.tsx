
import React from "react";
import { CalendarGridProps } from "./types";
import { CalendarDay } from "./CalendarDay";
import { MobileCalendarDay } from "./MobileCalendarDay";

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  selectedDay,
  firstDayCurrentMonth,
  data,
  handleDayClick,
  isMobile
}) => {
  return (
    <div className="flex text-xs leading-6 lg:flex-auto">
      {/* Desktop calendar grid */}
      <div className="hidden w-full border-x lg:grid lg:grid-cols-7 lg:grid-rows-5">
        {days.map((day, dayIdx) => (
          <CalendarDay
            key={dayIdx}
            day={day}
            dayIdx={dayIdx}
            selectedDay={selectedDay}
            firstDayCurrentMonth={firstDayCurrentMonth}
            data={data}
            handleDayClick={handleDayClick}
          />
        ))}
      </div>

      {/* Mobile calendar grid */}
      <div className="isolate grid w-full grid-cols-7 grid-rows-5 border-x lg:hidden">
        {days.map((day, dayIdx) => (
          <MobileCalendarDay
            key={dayIdx}
            day={day}
            dayIdx={dayIdx}
            selectedDay={selectedDay}
            firstDayCurrentMonth={firstDayCurrentMonth}
            data={data}
            handleDayClick={handleDayClick}
          />
        ))}
      </div>
    </div>
  );
};
