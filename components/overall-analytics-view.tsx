"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatHours } from "@/lib/format";

type Period = "week" | "month" | "year";
type ChartType = "bar" | "line" | "pie";
type Metric = "hours" | "earnings";

interface ProjectSeries {
  id: string;
  name: string;
  color: string;
  currency: string | null;
  hourlyRate: number | null;
  hours: number[];
  earnings: number[];
}

interface ProjectPie {
  id: string;
  name: string;
  color: string;
  hours: number;
  earnings: number;
}

interface AnalyticsData {
  period: Period;
  start: string;
  end: string;
  labels: string[];
  projects: ProjectPie[];
  series: ProjectSeries[];
}

const PERIOD_LABELS: Record<Period, string> = {
  week: "This Week",
  month: "This Month",
  year: "This Year",
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  metric: Metric;
}

function CustomBarLineTooltip({ active, payload, label, metric }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md px-3 py-2 text-xs space-y-1">
      <p className="font-medium text-gray-700 dark:text-gray-300">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {metric === "hours" ? formatHours(p.value) : p.value.toFixed(2)}
        </p>
      ))}
    </div>
  );
}

interface PieTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
  metric: Metric;
}

function CustomPieTooltip({ active, payload, metric }: PieTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md px-3 py-2 text-xs">
      <p className="font-medium" style={{ color: p.payload.color }}>
        {p.name}
      </p>
      <p className="text-gray-600 dark:text-gray-300">
        {metric === "hours" ? formatHours(p.value) : p.value.toFixed(2)}
      </p>
    </div>
  );
}

export default function OverallAnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [metric, setMetric] = useState<Metric>("hours");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?period=${period}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? `Failed to load analytics (HTTP ${res.status}).`);
        return;
      }
      setData(await res.json());
    } catch {
      setError("Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 p-4 text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!data || data.projects.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-400">
        No time entries found for this period.
      </div>
    );
  }

  const { labels, projects, series } = data;

  // Pie data
  const pieData = projects
    .filter((p) => (metric === "hours" ? p.hours : p.earnings) > 0)
    .map((p) => ({
      ...p,
      value: metric === "hours" ? p.hours : p.earnings,
    }));

  // Time series chart data: one row per label with each project as a key
  const timeSeriesData = labels.map((lbl, idx) => {
    const row: Record<string, number | string> = { label: lbl };
    for (const s of series) {
      row[s.name] = metric === "hours" ? s.hours[idx] : s.earnings[idx];
    }
    return row;
  });

  // Summary totals
  const totalHours = projects.reduce((s, p) => s + p.hours, 0);
  const totalEarnings = projects.reduce((s, p) => s + p.earnings, 0);
  const hasEarnings = projects.some((p) => p.earnings > 0);

  return (
    <div className="space-y-6">
      {/* Header + controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">All Projects — {PERIOD_LABELS[period]}</h2>

        <div className="flex gap-2 flex-wrap">
          {/* Period */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
            {(["week", "month", "year"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 transition-colors ${
                  period === p
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Chart type */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
            {(["bar", "line", "pie"] as ChartType[]).map((c) => (
              <button
                key={c}
                onClick={() => setChartType(c)}
                className={`px-3 py-1.5 transition-colors ${
                  chartType === c
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>

          {/* Metric */}
          {hasEarnings && (
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
              <button
                onClick={() => setMetric("hours")}
                className={`px-3 py-1.5 transition-colors ${
                  metric === "hours"
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                Hours
              </button>
              <button
                onClick={() => setMetric("earnings")}
                className={`px-3 py-1.5 transition-colors ${
                  metric === "earnings"
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                Earnings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Total Hours
          </p>
          <p className="text-2xl font-bold mt-2">{formatHours(totalHours)}</p>
        </div>
        {hasEarnings && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Total Earnings
            </p>
            <p className="text-2xl font-bold mt-2">{totalEarnings.toFixed(2)}</p>
          </div>
        )}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Projects
          </p>
          <p className="text-2xl font-bold mt-2">{projects.length}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        {chartType === "pie" ? (
          <div className="flex flex-col items-center gap-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomPieTooltip metric={metric} />}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 justify-center">
              {pieData.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <span>{p.name}</span>
                  <span className="text-gray-400">
                    {metric === "hours" ? formatHours(p.value) : p.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : chartType === "bar" ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={timeSeriesData}
              margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomBarLineTooltip metric={metric} />} />
              <Legend />
              {series.map((s) => (
                <Bar
                  key={s.id}
                  dataKey={s.name}
                  fill={s.color}
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={timeSeriesData}
              margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomBarLineTooltip metric={metric} />} />
              <Legend />
              {series.map((s) => (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Per-project breakdown */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Project Breakdown
        </p>
        {projects.map((p) => {
          const value = metric === "hours" ? p.hours : p.earnings;
          const total = metric === "hours" ? totalHours : totalEarnings;
          const pct = total > 0 ? (value / total) * 100 : 0;
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-2.5"
            >
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-sm font-medium flex-1 truncate">{p.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm">
                  {metric === "hours" ? formatHours(p.hours) : p.earnings.toFixed(2)}
                </span>
                <div className="w-24 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: p.color }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-10 text-right">
                  {pct.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
