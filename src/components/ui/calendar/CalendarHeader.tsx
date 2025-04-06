
import React from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, PlusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CalendarHeaderProps } from "./types";

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentMonth,
  firstDayCurrentMonth,
  previousMonth,
  nextMonth,
  goToToday
}) => {
  const today = new Date();

  return (
    <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none">
      <div className="flex flex-auto">
        <div className="flex items-center gap-4">
          <div className="hidden w-20 flex-col items-center justify-center rounded-lg border bg-muted p-0.5 md:flex">
            <h1 className="p-1 text-xs uppercase text-muted-foreground">
              {format(today, "MMM")}
            </h1>
            <div className="flex w-full items-center justify-center rounded-lg border bg-background p-0.5 text-lg font-bold">
              <span>{format(today, "d")}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-foreground">
              {format(firstDayCurrentMonth, "MMMM, yyyy")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {format(firstDayCurrentMonth, "MMM d, yyyy")} -{" "}
              {format(new Date(firstDayCurrentMonth.getFullYear(), firstDayCurrentMonth.getMonth() + 1, 0), "MMM d, yyyy")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
        <Button variant="outline" size="icon" className="hidden lg:flex">
          <Search size={16} strokeWidth={2} aria-hidden="true" />
        </Button>

        <Separator orientation="vertical" className="hidden h-6 lg:block" />

        <div className="inline-flex w-full -space-x-px rounded-lg shadow-sm shadow-black/5 md:w-auto rtl:space-x-reverse">
          <Button
            onClick={previousMonth}
            className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
            variant="outline"
            size="icon"
            aria-label="Navigate to previous month"
          >
            <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
          </Button>
          <Button
            onClick={goToToday}
            className="w-full rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 md:w-auto"
            variant="outline"
          >
            Today
          </Button>
          <Button
            onClick={nextMonth}
            className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
            variant="outline"
            size="icon"
            aria-label="Navigate to next month"
          >
            <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
          </Button>
        </div>

        <Separator orientation="vertical" className="hidden h-6 md:block" />
        <Separator
          orientation="horizontal"
          className="block w-full md:hidden"
        />

        <Button className="w-full gap-2 md:w-auto">
          <PlusCircle size={16} strokeWidth={2} aria-hidden="true" />
          <span>New Event</span>
        </Button>
      </div>
    </div>
  );
};
