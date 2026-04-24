"use client";

import { useState, useEffect, useCallback } from "react";


interface DayData {
  day: number;
  hours: number;
}

interface CalendarData {
  project: { name: string; color: string };
  year: number;
  month: number;
  days: DayData[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export default function ProjectCalendarView({ projectId }: { projectId: string }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-based
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/calendar?year=${y}&month=${m}`);
      if (!res.ok) throw new Error("Failed to load calendar data");
      setData(await res.json());
    } catch {
      setError("Could not load calendar data.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(year, month); }, [fetchData, year, month]);

  function navigate(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m);
    setYear(y);
  }

  // Build calendar grid (Mon-first weeks)
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const startOffset = firstDow === 0 ? 6 : firstDow - 1; // offset to Mon-first
  const totalCells = Math.ceil((daysInMonth + startOffset) / 7) * 7;

  const byDay: Record<number, number> = {};
  if (data) {
    for (const d of data.days) byDay[d.day] = d.hours;
  }

  const maxHours = Math.max(0, ...Object.values(byDay));
  const workedDays = Object.keys(byDay).length;
  const totalHours = Object.values(byDay).reduce((s, h) => s + h, 0);
  const color = data?.project.color ?? "#6366f1";
  const { r, g, b } = hexToRgb(color);

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Work Calendar
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Previous month"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-gray-400"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Next month"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-gray-400"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>

      {/* Summary chips */}
      {!loading && !error && data && (
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <span className="font-semibold">{workedDays}</span> day{workedDays !== 1 ? "s" : ""} worked
          </span>
          <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <span className="font-semibold">{Math.round(totalHours * 10) / 10}h</span> total
          </span>
        </div>
      )}

      {/* Calendar grid */}
      {loading ? (
        <div className="h-48 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
          Loading…
        </div>
      ) : error ? (
        <div className="h-48 flex items-center justify-center text-sm text-red-500">{error}</div>
      ) : (
        <div>
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: totalCells }).map((_, i) => {
              const dayNum = i - startOffset + 1;
              const isValid = dayNum >= 1 && dayNum <= daysInMonth;
              const hours = isValid ? (byDay[dayNum] ?? 0) : 0;
              const isWorked = isValid && hours > 0;
              const isToday = isCurrentMonth && isValid && dayNum === today.getDate();
              const intensity = isWorked && maxHours > 0 ? 0.15 + (hours / maxHours) * 0.75 : 0;

              return (
                <div
                  key={i}
                  title={isWorked ? `${hours}h` : undefined}
                  style={
                    isWorked
                      ? { backgroundColor: `rgba(${r},${g},${b},${intensity})` }
                      : undefined
                  }
                  className={[
                    "aspect-square rounded-lg flex flex-col items-center justify-center select-none",
                    isValid ? "" : "opacity-0 pointer-events-none",
                    isToday ? "ring-2 ring-offset-1 ring-indigo-500 dark:ring-offset-gray-900" : "",
                    !isWorked && isValid ? "bg-gray-50 dark:bg-gray-800/50" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {isValid && (
                    <>
                      <span
                        className={`text-xs font-medium leading-none ${
                          isWorked
                            ? "text-gray-800 dark:text-gray-100"
                            : "text-gray-400 dark:text-gray-600"
                        }`}
                      >
                        {dayNum}
                      </span>
                      {isWorked && (
                        <span className="text-[10px] leading-none mt-0.5 text-gray-600 dark:text-gray-300">
                          {hours}h
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
