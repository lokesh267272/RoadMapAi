
"use client"

import * as React from "react"
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isEqual,
  parse,
  startOfToday,
  startOfWeek,
} from "date-fns"
import { useMediaQuery } from "@/hooks/use-media-query"

import { CalendarHeader } from "./calendar/CalendarHeader"
import { WeekdaysHeader } from "./calendar/WeekdaysHeader"
import { CalendarGrid } from "./calendar/CalendarGrid"
import { FullScreenCalendarProps } from "./calendar/types"

export function FullScreenCalendar({ data, onDayClick }: FullScreenCalendarProps) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = React.useState(today)
  const [currentMonth, setCurrentMonth] = React.useState(
    format(today, "MMM-yyyy"),
  )
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date())
  const isMobile = useMediaQuery("(max-width: 767px)")

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  })

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function goToToday() {
    setCurrentMonth(format(today, "MMM-yyyy"))
  }

  function handleDayClick(day: Date) {
    setSelectedDay(day);
    if (onDayClick) {
      onDayClick(day);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Calendar Header */}
      <CalendarHeader
        currentMonth={currentMonth}
        firstDayCurrentMonth={firstDayCurrentMonth}
        previousMonth={previousMonth}
        nextMonth={nextMonth}
        goToToday={goToToday}
      />

      {/* Calendar Grid */}
      <div className="lg:flex lg:flex-auto lg:flex-col">
        {/* Week Days Header */}
        <WeekdaysHeader />

        {/* Calendar Days */}
        <CalendarGrid
          days={days}
          selectedDay={selectedDay}
          firstDayCurrentMonth={firstDayCurrentMonth}
          data={data}
          handleDayClick={handleDayClick}
          isMobile={isMobile}
        />
      </div>
    </div>
  )
}
