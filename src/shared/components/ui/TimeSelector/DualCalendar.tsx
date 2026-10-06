import { ChevronLeft, ChevronRight } from "lucide-react";
import type React from "react";
import { CalendarMonth } from "./CalendarMonth";
import { addMonths, formatMonthYear, subMonths } from "./utils";

interface DualCalendarProps {
  leftMonth: Date;
  setLeftMonth: React.Dispatch<React.SetStateAction<Date>>;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  hoverDate: Date | null;
  selectingMode: boolean;
  onSelectDate: (date: Date) => void;
  onHoverDate: (date: Date | null) => void;
}

export function DualCalendar({
  leftMonth,
  setLeftMonth,
  rangeStart,
  rangeEnd,
  hoverDate,
  selectingMode,
  onSelectDate,
  onHoverDate,
}: DualCalendarProps) {
  const rightMonth = addMonths(leftMonth, 1);
  const prevMonth = () => setLeftMonth(subMonths(leftMonth, 1));
  const nextMonth = () => setLeftMonth(addMonths(leftMonth, 1));

  return (
    <div className="flex gap-4 px-3 pt-3 pb-2">
      <div className="flex flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border-none bg-transparent text-foreground-secondary transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="font-semibold text-[13px] text-foreground">
            {formatMonthYear(leftMonth)}
          </span>
          <div className="w-6" />
        </div>
        <CalendarMonth
          currentMonth={leftMonth}
          onSelectDate={onSelectDate}
          onHoverDate={onHoverDate}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          hoverDate={hoverDate}
          selectingMode={selectingMode}
        />
      </div>

      <div className="w-px self-stretch bg-border" />

      <div className="flex flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between">
          <div className="w-6" />
          <span className="font-semibold text-[13px] text-foreground">
            {formatMonthYear(rightMonth)}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border-none bg-transparent text-foreground-secondary transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <CalendarMonth
          currentMonth={rightMonth}
          onSelectDate={onSelectDate}
          onHoverDate={onHoverDate}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          hoverDate={hoverDate}
          selectingMode={selectingMode}
        />
      </div>
    </div>
  );
}
