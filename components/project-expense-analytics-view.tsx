"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Period = "week" | "month" | "year";
type ChartType = "bar" | "line";
type Metric = "amount" | "tax" | "count";

interface DataPoint {
  label: string;
  amount: number;
  tax: number;
  count: number;
  billableAmount: number;
}

interface PeriodData {
  start: string;
  end: string;
  data: DataPoint[];
  totalAmount: number;
  totalTax: number;
  totalCount: number;
  totalBillableAmount: number;
}

interface ProjectExpenseAnalytics {
  project: {
    id: string;
    name: string;
    color: string;
    currency: string | null;
  };
  period: Period;
  current: PeriodData;
  previous: PeriodData;
}

interface Props {
  projectId: string;
}

const PERIOD_LABELS: Record<Period, string> = {
  week: "This Week",
  month: "This Month",
  year: "This Year",
};

const PREV_PERIOD_LABELS: Record<Period, string> = {
  week: "Last Week",
  month: "Last Month",
  year: "Last Year",
};

function formatPeriodRange(start: string, end: string, period: Period): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  endDate.setDate(endDate.getDate() - 1);
  if (period === "year") {
    return startDate.getFullYear().toString();
  }
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${startDate.toLocaleDateString(undefined, opts)} – ${endDate.toLocaleDateString(undefined, opts)}`;
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) {
    return <span className="text-xs text-emerald-600 dark:text-emerald-400">+100%</span>;
  }
  const pct = ((current - previous) / previous) * 100;
  const isPositive = pct >= 0;
  return (
    <span
      className={`text-xs font-medium ${
        isPositive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-500 dark:text-red-400"
      }`}
    >
      {isPositive ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

function addHexOpacity(hex: string, alpha = 0.35): string {
  const normalized = hex.replace("#", "");
  const fullHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(fullHex)) {
    return hex;
  }

  const alphaHex = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${fullHex}${alphaHex}`;
}

export default function ProjectExpenseAnalyticsView({ projectId }: Props) {
  const [data, setData] = useState<ProjectExpenseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("week");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [metric, setMetric] = useState<Metric>("amount");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses-analytics?period=${period}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? `Failed to load analytics (HTTP ${res.status}).`);
        return;
      }
      setData(await res.json());
    } catch {
      setError("Failed to load expense analytics.");
    } finally {
      setLoading(false);
    }
  }, [projectId, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        Loading expense analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800 p-4 text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { project, current, previous } = data;
  const currencySymbol = project.currency ?? "";
  const hasTax = current.totalTax > 0 || previous.totalTax > 0;

  const getValue = (d: DataPoint): number =>
    metric === "amount" ? d.amount : metric === "tax" ? d.tax : d.count;

  const comparisonChartData = current.data.map((d, i) => ({
    label: d.label,
    current: getValue(d),
    previous: getValue(previous.data[i]) ?? 0,
  }));

  const metricLabel =
    metric === "amount" ? `Amount (${currencySymbol})` : metric === "tax" ? `Tax (${currencySymbol})` : "Count";

  const currentTotal =
    metric === "amount" ? current.totalAmount : metric === "tax" ? current.totalTax : current.totalCount;
  const previousTotal =
    metric === "amount" ? previous.totalAmount : metric === "tax" ? previous.totalTax : previous.totalCount;

  const formatVal = (v: number) => (metric === "count" ? String(v) : `${currencySymbol}${v.toFixed(2)}`);

  const currentFormatted = formatVal(currentTotal);
  const previousFormatted = formatVal(previousTotal);

  return (
    <div className="space-y-6">
      {/* Header + controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="h-4 w-4 rounded-full shrink-0"
            style={{ backgroundColor: project.color }}
          />
          <h2 className="text-lg font-semibold">{project.name} — Expenses</h2>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Period selector */}
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
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-1.5 transition-colors ${
                chartType === "bar"
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`px-3 py-1.5 transition-colors ${
                chartType === "line"
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
            >
              Line
            </button>
          </div>

          {/* Metric toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
            <button
              onClick={() => setMetric("amount")}
              className={`px-3 py-1.5 transition-colors ${
                metric === "amount"
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
            >
              Amount
            </button>
            {hasTax && (
              <button
                onClick={() => setMetric("tax")}
                className={`px-3 py-1.5 transition-colors ${
                  metric === "tax"
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                Tax
              </button>
            )}
            <button
              onClick={() => setMetric("count")}
              className={`px-3 py-1.5 transition-colors ${
                metric === "count"
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
            >
              Count
            </button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {PERIOD_LABELS[period]}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatPeriodRange(current.start, current.end, period)}
          </p>
          <p className="text-2xl font-bold mt-2">{currentFormatted}</p>
          <div className="mt-1">
            <DeltaBadge current={currentTotal} previous={previousTotal} />
            {currentTotal !== previousTotal && (
              <span className="text-xs text-gray-400 ml-1">vs {previousFormatted}</span>
            )}
          </div>
          {metric === "amount" && current.totalBillableAmount > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {currencySymbol}{current.totalBillableAmount.toFixed(2)} billable
              ({current.totalAmount > 0 ? ((current.totalBillableAmount / current.totalAmount) * 100).toFixed(0) : 0}%)
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {PREV_PERIOD_LABELS[period]}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatPeriodRange(previous.start, previous.end, period)}
          </p>
          <p className="text-2xl font-bold mt-2">{previousFormatted}</p>
          {metric === "amount" && previous.totalBillableAmount > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {currencySymbol}{previous.totalBillableAmount.toFixed(2)} billable
            </p>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
          {metricLabel} — {PERIOD_LABELS[period]} vs {PREV_PERIOD_LABELS[period]}
        </p>
        <ResponsiveContainer width="100%" height={280}>
          {chartType === "bar" ? (
            <BarChart data={comparisonChartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(val) => {
                  const n = typeof val === "number" ? val : 0;
                  return metric === "count" ? String(n) : `${currencySymbol}${n.toFixed(2)}`;
                }}
              />
              <Legend />
              <Bar dataKey="current" name={PERIOD_LABELS[period]} fill={project.color} radius={[4, 4, 0, 0]} />
              <Bar dataKey="previous" name={PREV_PERIOD_LABELS[period]} fill={addHexOpacity(project.color, 0.35)} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={comparisonChartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(val) => {
                  const n = typeof val === "number" ? val : 0;
                  return metric === "count" ? String(n) : `${currencySymbol}${n.toFixed(2)}`;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="current"
                name={PERIOD_LABELS[period]}
                stroke={project.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="previous"
                name={PREV_PERIOD_LABELS[period]}
                stroke={addHexOpacity(project.color, 0.35)}
                strokeWidth={2}
                strokeDasharray="5 5"
                strokeOpacity={0.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
