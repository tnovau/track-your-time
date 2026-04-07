"use client";

import { useState, useEffect, useCallback } from "react";

interface TimeEntry {
  id: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  project: { id: string; name: string; color: string } | null;
}

interface Project {
  id: string;
  name: string;
  color: string;
}

interface TimeTrackerProps {
  userId: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function TimeTracker({ userId }: TimeTrackerProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [runningEntry, setRunningEntry] = useState<TimeEntry | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    const [entriesRes, projectsRes] = await Promise.all([
      fetch("/api/time-entries"),
      fetch("/api/projects"),
    ]);
    if (entriesRes.ok) {
      const data: TimeEntry[] = await entriesRes.json();
      setEntries(data.filter((e) => e.endTime !== null));
      const running = data.find((e) => e.endTime === null) ?? null;
      setRunningEntry(running);
      if (running) {
        setDescription(running.description ?? "");
        setSelectedProject(running.project?.id ?? "");
      }
    }
    if (projectsRes.ok) {
      setProjects(await projectsRes.json());
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!runningEntry) {
      setElapsed(0);
      return;
    }
    const start = new Date(runningEntry.startTime).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [runningEntry]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          projectId: selectedProject || null,
        }),
      });
      if (res.ok) {
        await fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!runningEntry) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/time-entries/${runningEntry.id}/stop`, {
        method: "PATCH",
      });
      if (res.ok) {
        setRunningEntry(null);
        setDescription("");
        setSelectedProject("");
        await fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  const totalToday = entries.reduce((acc, e) => {
    const start = new Date(e.startTime);
    const today = new Date();
    if (
      start.getFullYear() === today.getFullYear() &&
      start.getMonth() === today.getMonth() &&
      start.getDate() === today.getDate()
    ) {
      return acc + (e.duration ?? 0);
    }
    return acc;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Timer Bar */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input
            type="text"
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!!runningEntry}
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={!!runningEntry}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {runningEntry && (
            <span className="font-mono text-lg font-semibold tabular-nums">
              {formatDuration(elapsed)}
            </span>
          )}
          <button
            onClick={runningEntry ? handleStop : handleStart}
            disabled={loading}
            className={`rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
              runningEntry
                ? "bg-red-500 hover:bg-red-400"
                : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            {runningEntry ? "Stop" : "Start"}
          </button>
        </div>
      </div>

      {/* Today's summary */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Today</h2>
        <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
          Total: {formatDuration(totalToday)}
        </span>
      </div>

      {/* Entries list */}
      <div className="space-y-2">
        {entries.length === 0 && !runningEntry && (
          <p className="text-center py-12 text-gray-400">
            No time entries yet. Start tracking!
          </p>
        )}
        {runningEntry && (
          <div className="flex items-center justify-between rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/30 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
              <span className="text-sm font-medium truncate">
                {runningEntry.description ?? "No description"}
              </span>
              {runningEntry.project && (
                <span
                  className="shrink-0 text-xs px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: runningEntry.project.color }}
                >
                  {runningEntry.project.name}
                </span>
              )}
            </div>
            <span className="font-mono text-sm tabular-nums text-indigo-600 dark:text-indigo-400">
              {formatDuration(elapsed)}
            </span>
          </div>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm font-medium truncate">
                {entry.description ?? "No description"}
              </span>
              {entry.project && (
                <span
                  className="shrink-0 text-xs px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: entry.project.color }}
                >
                  {entry.project.name}
                </span>
              )}
            </div>
            <span className="font-mono text-sm tabular-nums text-gray-500 dark:text-gray-400 shrink-0">
              {formatDuration(entry.duration ?? 0)}
            </span>
          </div>
        ))}
      </div>

      {/* Hidden userId for reference */}
      <input type="hidden" value={userId} />
    </div>
  );
}
